import { useEffect, useRef, useState } from 'react';
import type { Album } from '../types';
import './Deck.css';

/** 33⅓ rpm, in degrees per second. */
const PLAYING_SPEED = (100 / 3 / 60) * 360;

/**
 * Seconds for the platter to cover most of the gap to its target speed. A real
 * platter catches up in about half a turn and coasts for longer once the motor
 * is cut, so spinning down is slower than spinning up.
 */
const SPIN_UP = 0.35;
const SPIN_DOWN = 0.9;

/** The tonearm's swing onto the record, matching its transition in Deck.css. */
const ARM_SWING_MS = 650;

/**
 * The turntable.
 *
 * Putting a record on goes in the order a real one does: the record lands on the
 * platter, the platter spins up, the arm swings over, and the clip starts as the
 * needle touches down. It keeps turning until the clip ends, or fails to play,
 * when it coasts to a stop and the arm lifts back to its rest. The rotation is
 * driven frame by frame with a little inertia, so it spins up and spins down
 * rather than snapping between still and full speed.
 *
 * The clip is a 30 second preview from Apple's CDN, handed to the browser by the
 * component and never downloaded into the page's own assets. Playback is triggered
 * by a click on the record, which is a user gesture, so no autoplay policy is
 * being worked around.
 */
export function Deck({
  album,
  arriving,
  onLift,
}: {
  /** The record on the deck, if any. */
  album: Album | undefined;
  /**
   * True while that record is still flying over from the shelf. It is on the deck
   * as far as the state goes, but nothing turns or plays until it has landed.
   */
  arriving: boolean;
  /**
   * Clicking the record on the deck puts it back on the main shelf. The
   * clicked element is passed through so the flight starts from the platter.
   */
  onLift: (album: Album, source: HTMLElement) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const vinylRef = useRef<HTMLSpanElement>(null);
  const motion = useRef({ angle: 0, speed: 0 });
  /*
    Which record's clip has finished, rather than a bare flag, so putting a new
    record down starts it turning without anything having to reset the last one.
  */
  const [finishedSlug, setFinishedSlug] = useState<string | undefined>(undefined);
  const [returning, setReturning] = useState(false);

  const src = album?.previewUrl;
  const slug = album?.slug;
  const turning = slug !== undefined && !arriving && finishedSlug !== slug;
  const needleDown = turning && !returning;

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
    A new record. This runs straight out of the click that put it on the deck, so
    it is the one moment the browser counts as a user gesture. The clip is only
    heard later, once the needle is down, and by then Safari no longer treats the
    play as user initiated. So the element is started and stopped here, which
    unlocks it, and the real play() later is allowed. Nothing is audible: it is
    paused before a single byte has loaded.
  */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio === null || src === undefined) return;

    // The same record put back down after its clip ended plays again from the top.
    setFinishedSlug(undefined);
    audio.currentTime = 0;

    /*
      play() is spec'd to return a promise, but jsdom returns undefined and some
      older engines throw outright rather than rejecting, so the result is not
      assumed to be thenable. The pause() straight after rejects it on purpose,
      so its failure is ignored.
    */
    try {
      const unlocked = audio.play() as Promise<void> | undefined;
      unlocked?.catch(() => {});
      audio.pause();
    } catch {
      // Nothing to unlock; the play once the needle is down still gets its chance.
    }
  }, [src]);

  /*
    The needle is down: once the arm has finished its swing, the clip starts. If
    the arm comes back up first (the record lifted, or swapped for another), the
    clip stops with it. A clip that cannot play counts as finished, so the record
    coasts to a stop instead of spinning silently forever.
  */
  useEffect(() => {
    const audio = audioRef.current;
    if (!needleDown || audio === null) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchdown = window.setTimeout(
      () => {
        try {
          const started = audio.play() as Promise<void> | undefined;
          started?.catch((error: unknown) => {
            // Interrupted by the arm lifting, not a clip that cannot play.
            if (error instanceof DOMException && error.name === 'AbortError') return;
            setFinishedSlug(slug);
          });
        } catch {
          setFinishedSlug(slug);
        }
      },
      reduced ? 0 : ARM_SWING_MS,
    );

    return () => {
      window.clearTimeout(touchdown);
      audio.pause();
    };
  }, [needleDown, slug]);

  /*
    The spin. Speed eases toward 33⅓ rpm while the record is turning and toward
    zero once it has finished, and the loop stops itself once the platter is at
    rest. Angle and speed live in a ref so a record that stops and starts again
    carries on from where it was rather than jumping back to zero. Under reduced
    motion the record still plays; it just does not turn.
  */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = turning ? PLAYING_SPEED : 0;
    const tau = turning ? SPIN_UP : SPIN_DOWN;
    let last: number | null = null;
    let frame = 0;
    let cancelled = false;

    const tick = (now: number) => {
      // A frame already queued when the target changed must not keep running.
      if (cancelled) return;

      // Clamped so a frame after a background tab does not lurch the record.
      const delta = last === null ? 0 : Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;

      const state = motion.current;
      state.speed += (target - state.speed) * (1 - Math.exp(-delta / tau));
      if (target === 0 && state.speed < 2) state.speed = 0;
      state.angle = (state.angle + state.speed * delta) % 360;

      vinylRef.current?.style.setProperty('transform', `rotate(${state.angle.toFixed(2)}deg)`);

      if (state.speed !== 0 || target !== 0) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [turning]);

  /*
    The platter is rendered whether or not a record is on it, so the deck keeps
    its place in the layout and putting a record on it does not shove the shelves
    sideways. Only the label, the caption, and the audio element come and go.

    The tonearm goes inside whichever platter is showing, so it is part of the
    turntable rather than part of the record: the needle is parked and waiting from
    the first paint, and swinging over it is what putting a record down means.
    Parked covers both an empty deck and the moment a record has just been picked,
    before the arm swings the rest of the way onto it.
  */
  const arm = (
    <span className="deck__arm" data-cued={needleDown ? 'true' : undefined} aria-hidden="true">
      <span className="deck__arm-rod" />
      <span className="deck__arm-head" />
    </span>
  );

  return (
    <div className="deck" data-empty={album === undefined ? 'true' : undefined}>
      {album === undefined ? (
        <span className="deck__platter deck__platter--empty">
          <span className="deck__spindle" aria-hidden="true" />
          {arm}
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
          data-spinning={turning ? 'true' : undefined}
          onClick={(event) => onLift(album, event.currentTarget)}
        >
          <span className="deck__vinyl" ref={vinylRef} aria-hidden="true">
            <img className="deck__label" src={album.cover} alt="" width={600} height={600} />
          </span>

          {arm}

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
              <span className="deck__clip">preview</span>
            </span>
            <span className="deck__by">
              {album.artist}, {album.year}
            </span>
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
          onEnded={() => setFinishedSlug(slug)}
          onError={() => setFinishedSlug(slug)}
        />
      )}
    </div>
  );
}
