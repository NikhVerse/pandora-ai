import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink' | 'blue';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className = '', variant = 'info', size = 'sm', ...props }, ref) => {
    const baseClass = 'inline-flex items-center font-display font-medium rounded-full tracking-wide uppercase';

    const variants = {
      success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      error: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      info: 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20',
      purple: 'bg-neon-purple/10 text-purple-400 border border-neon-purple/20',
      pink: 'bg-neon-pink/10 text-pink-400 border border-neon-pink/20',
      blue: 'bg-neon-blue/10 text-cyan-400 border border-neon-blue/20',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-3 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
