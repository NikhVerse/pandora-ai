import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glow' | 'border';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'glass', hoverEffect = false, ...props }, ref) => {
    const baseClass = 'rounded-xl overflow-hidden transition-all duration-300';
    
    const variants = {
      glass: 'glass-panel',
      glow: 'glass-panel-glow',
      border: 'gradient-border-mask bg-neutral-950/70 backdrop-blur-md',
    };

    const hoverClass = hoverEffect
      ? 'hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_10px_30px_-10px_rgba(157,78,221,0.2)]'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseClass} ${variants[variant]} ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
