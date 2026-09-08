/** Hand-rolled 16px icons on a 24-grid. A whole icon package is not worth the
 *  bundle for the eight glyphs the shell needs. */
type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const PlayIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <path d="M7 4.8v14.4a1 1 0 0 0 1.53.85l11.2-7.2a1 1 0 0 0 0-1.7L8.53 3.95A1 1 0 0 0 7 4.8Z" />
  </svg>
);

export const StopIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const SunIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const MoonIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const PresentIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M12 16v4M8 20h8" />
  </svg>
);

export const CodeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
  </svg>
);

export const LensIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);

export const TerminalIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m5 7 4 4-4 4M12 15h7" />
  </svg>
);

export const PauseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
  </svg>
);

export const SkipStartIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <rect x="5" y="5" width="2.6" height="14" rx="1.1" />
    <path d="M19 6.1v11.8a1 1 0 0 1-1.53.85l-9-5.9a1 1 0 0 1 0-1.7l9-5.9A1 1 0 0 1 19 6.1Z" />
  </svg>
);

export const SkipEndIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <rect x="16.4" y="5" width="2.6" height="14" rx="1.1" />
    <path d="M5 6.1v11.8a1 1 0 0 0 1.53.85l9-5.9a1 1 0 0 0 0-1.7l-9-5.9A1 1 0 0 0 5 6.1Z" />
  </svg>
);

export const StepBackIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m14 6-6 6 6 6" />
  </svg>
);

export const StepForwardIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m10 6 6 6-6 6" />
  </svg>
);
