import { useEffect, useRef, useState } from 'react';
import type { Album } from '../types';
import './Deck.css';

/**
 * The turntable.
 *
 * A record on the deck spins while its preview clip is playing and stops when the
 * clip ends, so the motion is a readout of the audio rather than decoration running
 * on its own. The spin is a CSS animation driven by a data attribute; the audio
 * element is the only thing that reports play and end.
 *
 * The clip is a 30 second preview from Apple's CDN, handed to the browser by the
 * component and never downloaded into the page's own assets. Playback is triggered
 * by a click on the record, which is a user gesture, so no autoplay policy is
 * being worked around.
 */
export function Deck({
  album,
  onLift,
}: {
  /** The record on the deck, if any. */
  album: Album | undefined;
  /**
   * Clicking the record on the deck puts it back on the main shelf. The
   * clicked element is passed through so the flight starts from the platter.
   */
  onLift: (album: Album, source: HTMLElement) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [returning, setReturning] = useState(false);

  const src = album?.previewUrl;
  const slug = album?.slug;

  /*
    Cueing. Every record arrives with the arm swinging back to its rest before it
    comes down over the new one, the way you lift an arm off a record, move it, and
    set it down again. Without this, swapping one record for another on a turntable
    that is already playing leaves the arm exactly where it was, so the record
    changes underneath a needle that never moved.

    The delay is the arm's own travel time, so it lands as the swing finishes rather
    than cutting it short.
  */
  useEffect(() => {
    if (slug === undefined) return;

    setReturning(true);
    const settled = window.setTimeout(() => setReturning(false), 380);
    return () => window.clearTimeout(settled);
  }, [slug]);

  /*
    A new source has to be loaded and played from scratch, and the play() promise
    rejects if the component re-renders mid-flight, so it is caught rather than
    left floating. Under reduced motion the record still plays, it just does not
    spin: the rotation is the only thing the media query takes away.
  */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio === null) return;

    if (album === undefined || src === undefined) {
      audio.pause();
      setSpinning(false);
      return;
    }

    audio.currentTime = 0;

    /*
      play() is spec'd to return a promise, but jsdom returns undefined and some
      older engines throw outright rather than rejecting, so the result is not
      assumed to be thenable. A failure here just means no audio: the record still
      goes on the deck and stays clickable.
    */
    try {
      const started = audio.play() as Promise<void> | undefined;
      started?.catch(() => setSpinning(false));
    } catch {
      setSpinning(false);
    }
  }, [album, src]);

  /*
    The platter is rendered whether or not a record is on it, so the deck keeps
    its place in the layout and putting a record on it does not shove the shelves
    sideways. Only the label, the caption, and the audio element come and go.
  */
  return (
    <div className="deck" data-empty={album === undefined ? 'true' : undefined}>
      {/*
        The tonearm is part of the furniture, so it is drawn whether or not a record
        is on the platter: parked low and to the right when the deck is empty, swung
        over the label while a record plays. It is aria-hidden because the state it
        conveys is already in the caption beside it.
      */}
      <span
        className="deck__arm"
        data-cued={album !== undefined && spinning && !returning ? 'true' : undefined}
        aria-hidden="true"
      >
        <span className="deck__arm-rod" />
        <span className="deck__arm-head" />
      </span>

      {album === undefined ? (
        <span className="deck__platter deck__platter--empty">
          <span className="deck__spindle" aria-hidden="true" />
          <span className="visually-hidden">the turntable is empty</span>
        </span>
      ) : (
        <button
          type="button"
          className="deck__platter"
          /*
            data-slot is what the flight overlay measures as a destination, so a
            record leaving the main shelf lands on the platter instead of fading
            out and reappearing.
          */
          data-slot={album.slug}
          data-spinning={spinning ? 'true' : undefined}
          onClick={(event) => onLift(album, event.currentTarget)}
        >
          <span className="deck__vinyl" aria-hidden="true">
            <img className="deck__label" src={album.cover} alt="" width={600} height={600} />
          </span>

          {/*
            The tonearm. It pivots from the corner, so the needle end is what travels
            across the record. It sits over the vinyl only while a record is actually
            spinning, which means the arm reads as the cause of the sound rather than
            as decoration parked on the disc.
          */}
          <span className="deck__arm" data-cued={spinning ? 'true' : undefined} aria-hidden="true">
            <span className="deck__arm-rod" />
            <span className="deck__arm-head" />
          </span>

          <span className="visually-hidden">
            Put {album.title} by {album.artist} back on the main shelf
          </span>
        </button>
      )}

      <div className="deck__meta">
        {album === undefined ? (
          <span className="deck__idle">nothing on the deck</span>
        ) : (
          <>
            <span className="deck__track">
              {album.trackName}
              <span className="deck__clip">30s preview</span>
            </span>
            <span className="deck__by">
              {album.artist}, {album.year}
            </span>
            <a
              className="deck__link sweep"
              href={album.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              hear the whole thing on apple music
            </a>
          </>
        )}
      </div>

      {/*
        crossOrigin is not set: these clips are served from Apple's CDN without
        permissive CORS headers, so requesting them anonymously would fail and the
        audio would never start. Nothing reads back across origins here, so the
        element plays without it.

        Captions are off for the same kind of reason: this is thirty seconds of
        music with no spoken content to transcribe. The track is named in the
        caption beside the platter, which is the part worth conveying.
      */}
      {album !== undefined && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={audioRef}
          src={src}
          preload="none"
          onPlay={() => setSpinning(true)}
          onPause={() => setSpinning(false)}
          onEnded={() => setSpinning(false)}
        />
      )}
    </div>
  );
}
