// Line icons: 24x24 viewBox, stroke-based, matching the prototype's icon style.
export default function Icon({ path, size = 16, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', ...style }}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
