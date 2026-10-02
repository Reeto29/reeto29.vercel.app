import { useEffect, useRef, type CSSProperties } from 'react';
import { grid, photos, spin } from '../photos';
import './PhotoGrid.css';

/**
 * Rotating photo grid behind the masthead.
 *
 * One number drives everything: the Y rotation, written to a single custom
 * property as `--spin`. The default motion is a slow sinusoidal sway; dragging or
 * arrow keys add a manual offset on top, which then drifts back to centre so the
 * grid never gets stuck at an angle the reader did not ask for.
 *
 * The grid is decorative, so it is described in one label rather than per image,
 * and it is keyboard operable because it moves on its own.
 */
export function PhotoGrid() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    let manual = 0;
    let manualVelocity = 0;
    let elapsed = 0;
    let last = 0;
    let frame: number | null = null;

    const drag = {
      active: false,
      pointerId: -1,
      startX: 0,
      startAngle: 0,
      lastX: 0,
      moved: false,
    };

    const clampManual = (value: number) =>
      Math.max(-spin.manualLimit, Math.min(spin.manualLimit, value));

    const totalAngle = () =>
      spin.autoRange * Math.sin((2 * Math.PI * elapsed) / spin.autoPeriod) + manual;

    /*
      Both properties are written to the stage, which .grid__field inherits
      from. Writing them to the field itself would work too, but the stylesheet
      must not redeclare either name on the field, or a local declaration would
      outrank the animated value and silently freeze the motion.

      The horizontal shift is coupled to the angle because rotation alone is
      mostly a scaling effect: even at 34 degrees the band slides only a little
      on its own. Adding travel proportional to the same angle makes tiles enter
      and leave the frame the way they would on a carousel. Proportional rather
      than sin-shaped so the two stay in step at every point in the cycle.
    */
    const paint = () => {
      const angle = totalAngle();

      node.style.setProperty('--spin', `${angle.toFixed(2)}deg`);
      node.style.setProperty('--shift', `${(angle * spin.shiftPerDegree).toFixed(2)}px`);
    };

    const tick = (now: number) => {
      const delta = last === 0 ? 0 : (now - last) / 1000;
      last = now;
      elapsed += delta;

      // User input wins; the offset eases back once they let go.
      manual = clampManual(manual + manualVelocity * delta);
      manualVelocity *= 0.86;
      manual += (0 - manual) * spin.recentreRate * delta;

      paint();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame !== null) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frame === null) return;
      cancelAnimationFrame(frame);
      frame = null;
    };

    /** Arrow keys and drag both nudge the manual offset. */
    const nudge = (degrees: number) => {
      manual = clampManual(manual + degrees);
      manualVelocity = 0;
      paint();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      drag.active = true;
      drag.pointerId = event.pointerId;
      drag.startX = event.clientX;
      drag.lastX = event.clientX;
      drag.startAngle = manual;
      drag.moved = false;
      node.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      if (Math.abs(dx) > 2) drag.moved = true;

      // A full-width swipe sweeps about a third of the manual range. Guard the
      // width: dividing by zero yields Infinity, which propagates into NaN on
      // the next frame.
      const span = Math.max(node.clientWidth, 1);
      const next = drag.startAngle + (dx / span) * spin.manualLimit * 2;
      manualVelocity = ((next - manual) / 60) * 16;
      manual = clampManual(next);
      paint();
    };

    const endDrag = (event: PointerEvent) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      drag.active = false;
      node.releasePointerCapture?.(event.pointerId);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? spin.keyStep * 2 : spin.keyStep;

      switch (event.key) {
        case 'ArrowLeft':
          nudge(step);
          break;
        case 'ArrowRight':
          nudge(-step);
          break;
        default:
          return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', endDrag);
    node.addEventListener('pointercancel', endDrag);
    node.addEventListener('keydown', onKeyDown);

    // Automatic motion is optional; keyboard and drag stay available either way.
    const syncMotion = () => (motion.matches ? stop() : start());
    motion.addEventListener('change', syncMotion);

    // Don't burn frames on a grid that is scrolled out of view.
    const visibility = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !motion.matches ? start() : stop()),
      { threshold: 0 },
    );
    visibility.observe(node);

    // Dragging only makes sense with a fine pointer; on touch it fights scrolling.
    if (finePointer.matches) node.dataset.draggable = 'true';

    paint();
    syncMotion();

    return () => {
      stop();
      motion.removeEventListener('change', syncMotion);
      visibility.disconnect();
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', endDrag);
      node.removeEventListener('pointercancel', endDrag);
      node.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const tiles = Array.from({ length: grid.columns * grid.rows }, (_, index) => {
    const column = index % grid.columns;
    const row = Math.floor(index / grid.columns);

    // -1 at the outer columns, 1 in the middle. Drives how far each tile is
    // pushed back, which is what makes the row read as curved.
    const half = (grid.columns - 1) / 2;
    const u = half === 0 ? 0 : (column - half) / half;

    return { photo: photos[index % photos.length], u, key: `${row}-${column}` };
  });

  return (
    <div
      className="grid__stage"
      ref={stageRef}
      role="group"
      aria-label={`Rotating grid of ${photos.length} photographs: ${photos
        .map((photo) => photo.alt)
        .join('; ')}. Use the left and right arrow keys to turn it.`}
      tabIndex={0}
    >
      <div className="grid__viewport">
        <div className="grid__field">
          {tiles.map(({ photo, u, key }) => (
            <div
              className="grid__tile"
              key={key}
              style={
                {
                  '--u': u.toFixed(3),
                  '--zoom': (1.08 + ((u + 1) / 2) * 0.12).toFixed(2),
                } as CSSProperties
              }
            >
              {/*
                No loading="lazy" here. The band is one row ten tiles wide, so
                most tiles start parked outside the viewport and lazy loading
                never fetches them. They then swing into view as empty frames as
                the carousel turns. The whole set is needed for the first sweep,
                so it is fetched up front.
              */}
              <img className="grid__img" src={photo.src} alt="" decoding="async" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid__scrim" />
    </div>
  );
}
