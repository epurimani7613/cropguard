import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,color,border-color,filter,transform] duration-150 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px select-none',
  {
    variants: {
      variant: {
        primary: 'bg-ok text-white hover:brightness-110 shadow-e1',
        danger: 'bg-danger text-white hover:brightness-110 shadow-e1',
        outline: 'border border-line bg-surface text-ink hover:bg-elevated hover:border-ink/25',
        ghost: 'text-muted hover:bg-elevated hover:text-ink',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3 text-[13px]',
        lg: 'h-10 px-4 text-sm',
        icon: 'h-8 w-8 p-0',
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