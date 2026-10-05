import { useEffect, useRef, type CSSProperties } from 'react';
import { bandSpan, grid, photos, ringStep, spin } from '../photos';
import './PhotoGrid.css';

/**
 * Rotating photo ring behind the masthead.
 *
 * The ring turns one way at a steady speed. Its rotation is one number, written
 * as `--spin` on the stage and added to each tile's own angle on the cylinder.
 * The band only covers part of a circle, so each tile also carries a `--wrap`
 * offset: once a tile has turned past one end of the band, out of sight, it is
 * moved a whole band-width to the other end, and the ring never runs out.
 *
 * Dragging turns the ring directly and a fling carries on with the release speed
 * before settling back into the steady turn. Arrow keys step it. Nothing pulls it
 * back to a centre, so it is never fighting the reader or swinging back and forth.
 *
 * The ring is decorative, so it is described in one label rather than per image,
 * and it is keyboard operable because it moves on its own.
 */
export function PhotoGrid() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const field = node.querySelector<HTMLElement>('.grid__field');
    const tiles = [...node.querySelectorAll<HTMLElement>('.grid__tile')];
    const half = (tiles.length - 1) / 2;

    let angle = 0;
    let velocity: number = spin.speed;
    let last = 0;
    let frame: number | null = null;

    /*
      The angle between tiles comes from the stylesheet, which changes it at the
      phone breakpoint, so it is read back rather than assumed. Without styles
      (tests, or a stylesheet that failed to load) it falls back to the desktop
      value the stylesheet is checked against.
    */
    let step = ringStep(grid.tile, grid.gap);
    const readStep = () => {
      const declared =
        field === null
          ? Number.NaN
          : Number.parseFloat(getComputedStyle(field).getPropertyValue('--step-deg'));
      step = Number.isFinite(declared) && declared > 0 ? declared : ringStep(grid.tile, grid.gap);
    };

    const wraps = tiles.map(() => Number.NaN);

    const drag = {
      active: false,
      pointerId: -1,
      startX: 0,
      startAngle: 0,
      lastAngle: 0,
      lastTime: 0,
    };

    /*
      --spin goes on the stage, which every tile inherits and adds to its own ring
      angle. The stylesheet must not redeclare it on the field or a tile: a local
      declaration outranks an inherited one and would silently freeze the motion.

      --wrap goes on each tile, and is only written when it changes, which is once
      per tile each time it passes the end of the band.
    */
    const paint = () => {
      const span = bandSpan(step);

      // Kept within one band either side of zero. The layout repeats every span,
      // so this changes nothing on screen and stops the number growing forever.
      angle = ((((angle + span / 2) % span) + span) % span) - span / 2;
      node.style.setProperty('--spin', `${angle.toFixed(2)}deg`);

      tiles.forEach((tile, index) => {
        const wrap = span * Math.round(((index - half) * step + angle) / span);
        if (wrap === wraps[index]) return;
        wraps[index] = wrap;
        tile.style.setProperty('--wrap', `${wrap.toFixed(3)}deg`);
      });
    };

    const tick = (now: number) => {
      // Clamped so a frame after a background tab does not lurch the ring.
      const delta = last === 0 ? 0 : Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;

      if (!drag.active) {
        velocity += (spin.speed - velocity) * Math.min(1, spin.settleRate * delta);
        angle += velocity * delta;
      }

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

    // Belt and braces with draggable={false}: nothing in the ring is a drag source.
    const onDragStart = (event: DragEvent) => event.preventDefault();

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      drag.active = true;
      drag.pointerId = event.pointerId;
      drag.startX = event.clientX;
      drag.startAngle = angle;
      drag.lastAngle = angle;
      drag.lastTime = event.timeStamp;
      velocity = 0;
      node.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      // Guard the width: dividing by zero yields Infinity, which propagates into
      // NaN on the next frame.
      const width = Math.max(node.clientWidth, 1);
      angle = drag.startAngle + ((event.clientX - drag.startX) / width) * spin.dragRange;

      // The release speed is the speed of the last movement, so a fling carries on.
      const elapsed = (event.timeStamp - drag.lastTime) / 1000;
      if (elapsed > 0) {
        const moved = angle - drag.lastAngle;
        velocity = Math.max(-spin.flingLimit, Math.min(spin.flingLimit, moved / elapsed));
      }
      drag.lastAngle = angle;
      drag.lastTime = event.timeStamp;

      paint();
    };

    const endDrag = (event: PointerEvent) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      drag.active = false;
      // A drag that stopped before letting go should not fling.
      if (event.timeStamp - drag.lastTime > 80) velocity = 0;
      node.releasePointerCapture?.(event.pointerId);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const keyStep = event.shiftKey ? spin.keyStep * 2 : spin.keyStep;

      switch (event.key) {
        case 'ArrowLeft':
          angle += keyStep;
          break;
        case 'ArrowRight':
          angle -= keyStep;
          break;
        default:
          return;
      }

      paint();
      event.preventDefault();
      event.stopPropagation();
    };

    const onResize = () => {
      readStep();
      paint();
    };

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', endDrag);
    node.addEventListener('pointercancel', endDrag);
    node.addEventListener('keydown', onKeyDown);
    node.addEventListener('dragstart', onDragStart);
    window.addEventListener('resize', onResize);

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

    readStep();
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
      node.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /*
    Each tile gets its index on the ring. The stylesheet turns that into an angle
    by multiplying by --step, which it derives from the tile size, so the ring
    stays correctly spaced when the tiles shrink at a breakpoint. Measuring the
    angle here instead would bake in the desktop spacing and break the phone one.

    The indices are offset from the centre so the band straddles the axis
    symmetrically. The animated `--spin` is added on top, which orbits every tile
    together without any of them needing to know where the others are.
  */
  const half = (photos.length - 1) / 2;
  const tiles = Array.from({ length: photos.length }, (_, index) => ({
    photo: photos[index] as (typeof photos)[number],
    slot: index - half,
    key: index,
  }));

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
          {tiles.map(({ photo, slot, key }) => {
            // Normalised distance from the centre of the ring, -1 to 1. The image
            // is scaled up slightly further out, which counteracts the
            // perspective foreshortening so the photos near the edges do not read
            // as shrunken copies of the ones in the middle.
            const u = half === 0 ? 0 : key / half;

            return (
              <div
                className="grid__tile"
                key={key}
                style={
                  {
                    '--i': String(slot),
                    '--zoom': (1.06 + ((u + 1) / 2) * 0.1).toFixed(2),
                  } as CSSProperties
                }
              >
                {/*
                  No loading="lazy" here. The ring spans roughly 100 degrees, so
                  most tiles start outside the viewport and lazy loading never
                  fetches them. They then swing into view as empty frames as the
                  carousel turns. The whole set is needed for the first sweep, so
                  it is fetched up front.
                */}
                {/*
                  draggable is off so a drag across the ring turns it, instead of
                  the browser picking the photo up as an image to drop somewhere.
                */}
                <img
                  className="grid__img"
                  src={photo.src}
                  alt=""
                  decoding="async"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid__scrim" />
    </div>
  );
}
