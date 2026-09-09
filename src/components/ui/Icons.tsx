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

export const BookIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5Z" />
  </svg>
);

export const ShareIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="17.5" cy="6" r="2.6" />
    <circle cx="6.5" cy="12" r="2.6" />
    <circle cx="17.5" cy="18" r="2.6" />
    <path d="m8.9 10.8 6.2-3.4M8.9 13.2l6.2 3.4" />
  </svg>
);

export const NoteIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 4.5h14v10l-4 4.5H5Z" />
    <path d="M19 14.5h-4v4.5M8 9h8M8 12.5h5" />
  </svg>
);

export const EyeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const HelpIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M9.7 9.4a2.4 2.4 0 1 1 3.2 2.3c-.6.25-.9.8-.9 1.5" />
    <path d="M12 16.6h.01" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
