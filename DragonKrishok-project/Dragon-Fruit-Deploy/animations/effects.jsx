// Decorative motion: the scanner sweep, drifting seeds and floating art.
// Pure CSS keyframes (animations.css) so they cost nothing on the main thread.

/** Glowing line that sweeps over its parent while `active`. Parent needs position: relative. */
export function ScanLine({ active = true }) {
  return active ? <div className="anim-scan" aria-hidden="true"><span /></div> : null;
}

// Fixed layout so the server and every render agree (no Math.random in render).
const SEEDS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 4 + (i % 3) * 2,
  delay: (i % 6) * -1.7,
  dur: 9 + (i % 5) * 2,
}));

/** Small black seeds drifting slowly, like the inside of the fruit. */
export function Seeds() {
  return (
    <div className="anim-seeds" aria-hidden="true">
      {SEEDS.map((s, i) => (
        <span key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size * 1.4,
          animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
      ))}
    </div>
  );
}

/** Gentle up and down float. */
export function Float({ children, delay = 0, className = "" }) {
  return <div className={`anim-float ${className}`} style={{ animationDelay: `${delay}s` }}>{children}</div>;
}
