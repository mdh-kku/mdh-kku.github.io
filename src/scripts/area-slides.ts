// The research-area slides. One continuous position drives every slide and the tab pill, so any interruption
// (a click mid-flight, grabbing a moving slide) continues from where things are on screen. Without this script
// the slides read as a plain list.
import { SLIDES, pose, rubber, snapTarget, springOf, wheelPage } from '../lib/slides';

const PAUSE =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>';
const PLAY =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7z"/></svg>';
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initAreaSlides(section: HTMLElement): void {
  const stage = section.querySelector<HTMLElement>('[data-stage]')!;
  const tabs = [...section.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const ix = section.querySelector<HTMLElement>('.ix')!;
  const topLayer = section.querySelector<HTMLElement>('[data-top]')!;
  const scroller = section.querySelector<HTMLElement>('[data-scroll]')!;
  const status = section.querySelector<HTMLElement>('[data-status]')!;
  const prevBtn = section.querySelector<HTMLButtonElement>('[data-prev]')!;
  const nextBtn = section.querySelector<HTMLButtonElement>('[data-next]')!;
  const plays = [...stage.querySelectorAll<HTMLButtonElement>('[data-play]')];
  const slides = [...stage.querySelectorAll<HTMLElement>('[role="tabpanel"]')].map((el, i) => ({
    el,
    i,
    shade: el.querySelector<HTMLElement>('.shade')!,
  }));
  const names = tabs.map((t) => t.textContent ?? '');
  const n = slides.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const SOFT = springOf(SLIDES.response, SLIDES.damping);
  const FLICK = springOf(SLIDES.response, SLIDES.flickDamping);
  const FAN = springOf(SLIDES.fanResponse, 1);

  let playing = !reduce.matches; // with reduced motion nothing plays by itself; the button still works
  let inView = false;
  let icon: 'pause' | 'play' = 'pause'; // what the HTML ships with
  // pos is a float: 1.4 means 40% of the way from slide 2 to slide 3. Every slide's place is drawn from it.
  let pos = 0;
  let vel = 0;
  let target = 0;
  let cfg = SOFT;
  let fan = 1;
  let fanV = 0;
  let fanTo = 1;
  let travel = 1300;
  let step: number = SLIDES.step;
  let boxes: [number, number][] = [];
  let topW = 0;
  let raf = 0;
  let last = 0;
  let dragging = false;
  let shown = -1;

  const syncPlay = () => {
    stage.classList.toggle('is-playing', playing && inView);
    const want = playing ? 'pause' : 'play';
    if (want === icon) return; // swap only on a real change, so the icon's fade-in runs once
    icon = want;
    for (const b of plays) {
      b.setAttribute('aria-label', playing ? 'Pause motion' : 'Play motion');
      b.innerHTML = playing ? PAUSE : PLAY;
    }
  };

  const measure = () => {
    travel = document.documentElement.clientWidth - stage.getBoundingClientRect().left + 24; // just past the screen's edge
    step = innerWidth <= 760 ? SLIDES.stepPhone : SLIDES.step;
    boxes = tabs.map((b) => [b.offsetLeft, b.offsetLeft + b.offsetWidth]);
    topW = topLayer.offsetWidth;
  };

  const render = () => {
    for (const s of slides) {
      const d = s.i - pos;
      const p = pose(d, { travel, step, fan, pulledPastEnd: s.i === n - 1 && pos > n - 1 });
      s.el.style.transform = `translate3d(${p.x.toFixed(2)}px, 0, 0) scale(${p.scale.toFixed(4)})`;
      s.el.style.opacity = p.opacity.toFixed(3);
      s.el.style.zIndex = String(s.i + 1); // a newer slide always comes in over the pile
      s.el.style.visibility = d >= 1 ? 'hidden' : 'visible'; // fully off-screen: don't paint it
      s.shade.style.opacity = p.shade.toFixed(3);
    }
    // The dark pill slides between names in step with the stage, even mid-drag.
    const c = clamp(pos, 0, n - 1);
    const i0 = Math.floor(c);
    const i1 = Math.min(i0 + 1, n - 1);
    const t = c - i0;
    const left = boxes[i0][0] + (boxes[i1][0] - boxes[i0][0]) * t;
    const right = boxes[i0][1] + (boxes[i1][1] - boxes[i0][1]) * t;
    topLayer.style.clipPath = `inset(0 ${(topW - right).toFixed(1)}px 0 ${left.toFixed(1)}px round 999px)`;

    const now = clamp(Math.round(pos), 0, n - 1);
    if (now === shown) return;
    shown = now;
    for (const s of slides) {
      s.el.inert = s.i !== now;
      s.el.classList.toggle('is-current', s.i === now);
    }
    tabs.forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === now));
      b.tabIndex = k === now ? 0 : -1;
    });
    prevBtn.setAttribute('aria-disabled', String(now === 0));
    nextBtn.setAttribute('aria-disabled', String(now === n - 1));
    if (scroller.scrollWidth > scroller.clientWidth) {
      const b = tabs[now];
      const at = b.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
      scroller.scrollTo({ left: at - (scroller.clientWidth - b.offsetWidth) / 2, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  };

  const tick = (now: number) => {
    const dt = clamp((now - last) / 1000, 0, 0.032);
    last = now;
    const h = dt / 4; // four small steps per frame keep the spring stable
    for (let k = 0; k < 4; k++) {
      if (!dragging) {
        vel += (-cfg.k * (pos - target) - cfg.c * vel) * h;
        pos += vel * h;
      }
      fanV += (-FAN.k * (fan - fanTo) - FAN.c * fanV) * h;
      fan += fanV * h;
    }
    const posDone = dragging || (Math.abs(pos - target) < 4e-4 && Math.abs(vel) < 4e-3);
    const fanDone = Math.abs(fan - fanTo) < 2e-3 && Math.abs(fanV) < 2e-2;
    if (posDone && !dragging) {
      pos = target;
      vel = 0;
    }
    if (fanDone) {
      fan = fanTo;
      fanV = 0;
    }
    render();
    raf = posDone && fanDone ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  // The spring always starts from where the stage is now, so a new click mid-flight just changes course.
  const go = (to: number, v: number | null = null, spring = SOFT) => {
    target = clamp(to, 0, n - 1);
    status.textContent = `${names[target]}, ${target + 1} of ${n}`;
    if (reduce.matches) {
      // Nothing travels: swap in place and fade the new slide in.
      const from = shown;
      pos = target;
      vel = 0;
      render();
      if (from !== target) slides[target].el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' });
      return;
    }
    cfg = spring;
    if (v !== null) vel = v;
    kick();
  };
  const setFan = (to: number) => {
    if (fanTo === to) return;
    fanTo = to;
    kick();
  };

  prevBtn.addEventListener('click', () => go(target - 1));
  nextBtn.addEventListener('click', () => go(target + 1));
  tabs.forEach((b, i) => b.addEventListener('click', () => go(i)));
  // Tabs pattern: arrows act on the focused tab list, and focus follows the selection. Keys pressed inside a slide
  // are left alone, so focus never lands in a slide that has just become inert.
  section.addEventListener('keydown', (e) => {
    if (!tabs.includes(e.target as HTMLButtonElement) || e.altKey || e.ctrlKey || e.metaKey) return;
    const to = ({ ArrowLeft: target - 1, ArrowRight: target + 1, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to);
    tabs[target].focus();
  });

  // Drag: the slide sticks to the hand; a flick or a long enough drag finishes the move.
  let pressed = false;
  let moved = false;
  let pid = 0;
  let x0 = 0;
  let y0 = 0;
  let p0 = 0;
  let trail: [number, number][] = [];
  stage.addEventListener('pointerdown', (e) => {
    if (pressed || (e.pointerType === 'mouse' && e.button !== 0)) return; // one pointer at a time
    pressed = true;
    moved = false;
    pid = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    trail = [[e.timeStamp, e.clientX]];
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pressed || e.pointerId !== pid) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (!dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        pressed = false; // vertical: the page scrolls
        return;
      }
      if (Math.abs(dx) < 8) return; // wait for a clear sideways intent
      dragging = moved = true;
      try {
        stage.setPointerCapture(pid);
      } catch {
        // the pointer is already gone
      }
      stage.classList.add('is-dragging');
      x0 = e.clientX;
      p0 = pos; // grab the stage where it is now, even mid-flight
      vel = 0;
    }
    trail.push([e.timeStamp, e.clientX]);
    if (trail.length > 8) trail.shift();
    if (reduce.matches) return; // reduced motion: nothing follows the hand; the swipe is read on release
    pos = rubber(p0 - (e.clientX - x0) / travel, n, travel);
    render();
  });
  const release = (e: PointerEvent) => {
    if (!pressed || e.pointerId !== pid) return;
    pressed = false;
    if (!dragging) return; // a plain click: let it through
    dragging = false;
    stage.classList.remove('is-dragging');
    // A mouse drag ends with a click, swallowed below in this same task; a touch drag ends with none. Clear the flag
    // after this task either way, so the next keyboard press or tap is never eaten.
    setTimeout(() => {
      moved = false;
    });
    const dx = e.clientX - x0;
    const old = trail.find(([t]) => e.timeStamp - t < 100) ?? trail[0];
    const vx = e.type === 'pointercancel' ? 0 : (e.clientX - old[1]) / Math.max(1, e.timeStamp - old[0]); // px per ms
    go(snapTarget({ from: Math.round(p0), dx, vx, travel, count: n }), -(vx * 1000) / travel, FLICK);
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault(); // a drag is not a click
        e.stopPropagation();
        moved = false;
        return;
      }
      if ((e.target as Element).closest('[data-play]')) {
        playing = !playing;
        syncPlay();
      }
    },
    true,
  );
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  // A sideways trackpad swipe pages one slide, instead of being ignored or sending the browser Back.
  let wheelSum = 0;
  let wheelDone = false;
  let wheelTimer = 0;
  stage.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // mostly vertical: the page scrolls
      e.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelSum = 0;
        wheelDone = false;
      }, SLIDES.wheelIdle);
      if (wheelDone) return; // one slide per swipe, however long the trackpad's momentum lasts
      wheelSum += e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
      const by = wheelPage(wheelSum);
      if (by === 0) return;
      wheelDone = true;
      go(target + by);
    },
    { passive: false },
  );

  // The pile sits just left of the stage: hovering fans it out, a tap brings the last slide back.
  const onPile = (e: MouseEvent) => {
    const r = stage.getBoundingClientRect();
    return target > 0 && e.clientX < r.left && e.clientX > r.left - 72 && e.clientY > r.top && e.clientY < r.bottom;
  };
  section.addEventListener('pointermove', (e) => {
    if (pressed || e.pointerType !== 'mouse' || reduce.matches) return;
    const on = onPile(e);
    setFan(on ? SLIDES.fan : 1);
    section.style.cursor = on ? 'pointer' : '';
  });
  section.addEventListener('click', (e) => {
    if (onPile(e)) go(target - 1);
  });

  // Nothing plays while the section is off screen.
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlay();
  }).observe(stage);
  reduce.addEventListener('change', () => {
    if (reduce.matches) {
      playing = false;
      pos = target;
      vel = 0;
      fan = fanTo = 1;
      fanV = 0;
      render();
    }
    syncPlay();
  });

  measure();
  render();
  ix.classList.add('is-ready');
  syncPlay();
  addEventListener('resize', () => {
    measure();
    render();
  });
  document.fonts?.ready.then(() => {
    measure();
    render();
  });
}
