import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // `pressable` supplies the brief's uniform 0.3s transition on every variant.
  'pressable inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-white shadow-e1 hover:bg-brand/90 hover:shadow-e2 active:scale-[0.98] hover:-translate-y-px',
        leaf: 'bg-leaf text-white shadow-e1 hover:brightness-105 hover:shadow-e2 active:scale-[0.98] hover:-translate-y-px',
        danger:
          'bg-danger text-white shadow-e1 hover:brightness-110 hover:shadow-e2 active:scale-[0.98] hover:-translate-y-px',
        outline:
          'border border-line bg-surface text-ink shadow-e1 hover:border-brand/35 hover:bg-elevated hover:text-brand active:scale-[0.98]',
        ghost: 'text-muted hover:bg-elevated hover:text-brand',
        console: 'border border-white/12 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/25',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-3.5 text-[13px]',
        lg: 'h-11 px-5 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };