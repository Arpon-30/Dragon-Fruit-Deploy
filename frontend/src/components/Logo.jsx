export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 10c13 0 22 11 22 25S45 58 32 58 10 49 10 35s9-25 22-25z" fill="#E91E7A" />
      <path d="M32 10l-5-7M32 10l7-6M14 24l-9-4M50 24l9-4M13 42l-9 3M51 42l9 3M22 15l-7-7M42 15l7-7"
        stroke="#7CB342" strokeWidth="4" strokeLinecap="round" />
      <circle cx="26" cy="32" r="2.4" fill="#2A1020" />
      <circle cx="37" cy="37" r="2.4" fill="#2A1020" />
      <circle cx="29" cy="45" r="2.4" fill="#2A1020" />
    </svg>
  );
}
