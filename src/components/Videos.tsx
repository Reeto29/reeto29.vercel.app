import { useEffect, useRef, useState } from 'react';
import { videos, type Video } from '../content';
import './Videos.css';

/**
 * Live clips shown under the shelf.
 *
 * Nothing from YouTube is loaded until a clip is actually played. Each one is a
 * static thumbnail served from `public/videos/`, and pressing play swaps it for the
 * real player on the nocookie domain. Four live embeds would otherwise pull in the
 * YouTube player, its tracking cookies, and a few megabytes of script on a page
 * that is otherwise entirely self-hosted, which is a poor trade for four
 * thumbnails.
 */
function Clip({ id, artist, venue }: Video) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  /*
    The play button is what had focus, and it is about to be replaced by an iframe,
    so focus is moved onto the frame instead. Left alone, a keyboard reader would
    be dropped to the top of the document at the moment playback starts.
  */
  useEffect(() => {
    if (!playing) return;
    frameRef.current?.focus();
  }, [playing]);

  return (
    <li className="videos__item">
      <div className="videos__frame" ref={frameRef} tabIndex={playing ? -1 : undefined}>
        {playing ? (
          <iframe
            className="videos__embed"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={`${artist}, ${venue}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="videos__facade" onClick={() => setPlaying(true)}>
            <img
              className="videos__thumb"
              src={`/videos/${id}.jpg`}
              alt=""
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
            />
            <span className="videos__play" aria-hidden="true" />
            <span className="visually-hidden">
              Play {artist}, {venue}
            </span>
          </button>
        )}
      </div>

      <p className="videos__caption">
        <span className="videos__artist">{artist}</span>
        <span className="videos__venue">{venue}</span>
      </p>
    </li>
  );
}

export function Videos() {
  return (
    <div className="videos">
      <h3 className="label videos__label">watch</h3>

      <ul className="videos__grid">
        {videos.map((video) => (
          <Clip key={video.id} {...video} />
        ))}
      </ul>
    </div>
  );
}
