import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  /** Renders as an active/pressed toggle. */
  active?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover disabled:bg-inset disabled:text-subtle',
  ghost:
    'text-muted hover:bg-hover hover:text-fg disabled:text-subtle disabled:hover:bg-transparent',
};

export function Button({
  variant = 'ghost',
  icon,
  active = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active || undefined}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.92em] font-medium',
        'transition-colors duration-100 disabled:cursor-not-allowed select-none',
        variants[variant],
        active ? 'bg-accent-soft text-accent' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {icon ? <span className="grid size-[1.15em] place-items-center">{icon}</span> : null}
      {children}
    </button>
  );
}
