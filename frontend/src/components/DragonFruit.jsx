// Hand drawn dragon fruit, one look per grade, plus a cut half for the hero.
const LOOKS = {
  Mature: { skin: ["#FF4F93", "#C2185B"], bract: "#7CB342", tip: "#F06292" },
  Immature: { skin: ["#A5D66B", "#4E7D1E"], bract: "#558B2F", tip: "#9CCC65" },
  Defect: { skin: ["#F06292", "#AD1457"], bract: "#7CB342", tip: "#8D6E63", marks: "scar" },
  Bad: { skin: ["#8E5A6B", "#4A2B36"], bract: "#6D5B3A", tip: "#3E2723", marks: "rot" },
};

// Bracts: [x, y, rotation] around the body
const BRACTS = [[100, 34, 0], [62, 58, -40], [138, 58, 40], [44, 104, -70], [156, 104, 70],
  [54, 150, -110], [146, 150, 110], [78, 186, -150], [122, 186, 150], [100, 110, 0], [80, 84, -20], [120, 84, 20], [82, 138, -160], [118, 138, 160]];

export function DragonFruit({ grade = "Mature", size = 200, title }) {
  const look = LOOKS[grade];
  const id = `df-${grade}`;
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" role={title ? "img" : undefined}
      aria-label={title} aria-hidden={title ? undefined : "true"}>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={look.skin[0]} />
          <stop offset="1" stopColor={look.skin[1]} />
        </radialGradient>
      </defs>
      <path d="M100 26c44 0 70 38 70 88s-30 92-70 92-70-42-70-92 26-88 70-88z" fill={`url(#${id})`} />
      {BRACTS.map(([x, y, r], i) => (
        <path key={i} d="M0 14C-9 4-7-10 0-18 7-10 9 4 0 14z" fill={look.bract}
          transform={`translate(${x} ${y}) rotate(${r})`} stroke={look.tip} strokeWidth="2.5" strokeLinejoin="round" />
      ))}
      <path d="M100 26c-4-10-2-18 4-22" stroke="#558B2F" strokeWidth="6" strokeLinecap="round" fill="none" />
      {look.marks === "scar" && (
        <g stroke="#6D4C41" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M62 120l14-8 6 10 12-6" />
          <path d="M122 160l10 6 8-4" />
        </g>
      )}
      {look.marks === "rot" && (
        <g fill="#2B1A1F" opacity="0.85">
          <ellipse cx="78" cy="122" rx="16" ry="12" />
          <ellipse cx="128" cy="160" rx="12" ry="9" />
          <ellipse cx="118" cy="96" rx="7" ry="6" />
        </g>
      )}
      <ellipse cx="74" cy="76" rx="14" ry="22" fill="#fff" opacity="0.18" transform="rotate(25 74 76)" />
    </svg>
  );
}

const SEEDS = Array.from({ length: 46 }, (_, i) => {
  const a = i * 2.4;
  const r = 8 + ((i * 7) % 52);
  return [100 + Math.cos(a) * r * 0.8, 110 + Math.sin(a) * r * 1.15];
});

export function DragonFruitHalf({ size = 200 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" aria-hidden="true">
      <ellipse cx="100" cy="112" rx="78" ry="98" fill="#C2185B" />
      <ellipse cx="100" cy="112" rx="68" ry="88" fill="var(--flesh)" />
      {SEEDS.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2.4" ry="3.2" fill="#1A1014" />)}
    </svg>
  );
}
