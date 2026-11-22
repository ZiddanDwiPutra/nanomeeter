interface HoneycombBackgroundProps {
  className?: string
}

export const HoneycombBackground = ({ className = "" }: HoneycombBackgroundProps) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}
    >
      {/* Subtle radial ambient highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,182,212,0.12),transparent_70%)]" />

      {/* Hexagonal Honeycomb SVG Pattern */}
      <svg
        className="absolute inset-0 size-full text-foreground/5 dark:text-cyan-400/[0.08]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="honeycomb-pattern"
            width="56"
            height="96"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L28 96"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#honeycomb-pattern)" />
      </svg>
    </div>
  )
}
