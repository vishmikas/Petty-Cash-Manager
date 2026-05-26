import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className = '', children, ...props }) {
  return <div className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)} {...props}>{children}</div>;
}

export function CardHeader({ className = '', children, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>{children}</h3>;
}

export function CardDescription({ className = '', children, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props}>{children}</p>;
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props}>{children}</div>;
}

const buttonVariants = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  success: 'bg-emerald-600 text-white shadow hover:bg-emerald-700'
};

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10'
};

export const Button = React.forwardRef(({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      buttonVariants[variant] || buttonVariants.default,
      buttonSizes[size] || buttonSizes.default,
      className
    )}
    {...props}
  >
    {children}
  </button>
));
Button.displayName = 'Button';

export const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export function Label({ className = '', children, ...props }) {
  return <label className={cn('text-sm font-medium leading-none text-foreground', className)} {...props}>{children}</label>;
}

export function Badge({ className = '', variant = 'default', children, ...props }) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground',
    success: 'border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    warning: 'border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    destructive: 'border-transparent bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    muted: 'border-transparent bg-muted text-muted-foreground'
  };
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant] || variants.default, className)} {...props}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
      {Icon && <div className="mb-3 rounded-full bg-background p-3 shadow-sm"><Icon className="h-6 w-6 text-muted-foreground" /></div>}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
