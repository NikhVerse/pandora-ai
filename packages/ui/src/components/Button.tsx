import * as React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-display font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-neon-purple/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    // Variant styles
    const variants = {
      primary:
        'bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white shadow-[0_0_20px_rgba(157,78,221,0.3)] hover:shadow-[0_0_30px_rgba(157,78,221,0.55)] hover:opacity-95',
      secondary:
        'glass-panel text-neutral-100 hover:bg-neutral-800 hover:border-neutral-600 border border-neutral-700',
      outline:
        'border border-white/20 text-neutral-300 hover:text-white hover:bg-white/5 hover:border-white/40',
      ghost:
        'text-neutral-400 hover:text-white hover:bg-neutral-900',
      danger:
        'bg-red-950/20 text-red-400 border border-red-500/20 hover:bg-red-900/30 hover:border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    };

    // Size styles
    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin h-4 w-4 shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
