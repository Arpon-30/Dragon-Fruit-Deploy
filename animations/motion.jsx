// Scroll and state animations shared by every section. Built on framer-motion;
// <MotionConfig reducedMotion="user"> in main.jsx turns movement off when the phone asks.
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export const pop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18 } },
};

/** Fades and lifts its children into view once, when scrolled to. */
export function Reveal({ as = "div", delay = 0, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: fadeUp.hidden, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay } } }}
      {...rest}>
      {children}
    </Tag>
  );
}

/** Parent that reveals its <Item> children one after another. */
export function Stagger({ as = "div", gap = 0.09, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }} {...rest}>
      {children}
    </Tag>
  );
}

export function Item({ as = "div", variants = fadeUp, children, ...rest }) {
  const Tag = motion[as];
  return <Tag variants={variants} {...rest}>{children}</Tag>;
}

/** Counts from 0 to `value` when it comes into view. `format` turns the number into text. */
export function CountUp({ value, format = (n) => Math.round(n), duration = 1.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const n = useMotionValue(0);
  const text = useTransform(n, format);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(n, value, { duration, ease });
    return () => controls.stop();
  }, [inView, value, duration, n]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Ring that fills to `value` (0..1). */
export function Ring({ value, size = 132, stroke = 12, color = "var(--accent)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="anim-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.3, ease }} />
      </svg>
      <div className="anim-ring__label">{children}</div>
    </div>
  );
}

/** Horizontal bar that grows to `value` (0..1). */
export function Bar({ value, color, delay = 0 }) {
  return (
    <div className="anim-bar">
      <motion.div className="anim-bar__fill" style={{ background: color, transformOrigin: "left" }}
        initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(value, 0.01) }}
        transition={{ duration: 0.9, delay, ease }} />
    </div>
  );
}

/** Cross fade between views (tabs, language, result steps). Use with AnimatePresence. */
export const swap = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};
