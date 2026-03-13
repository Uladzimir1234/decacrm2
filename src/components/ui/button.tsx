import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:   'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700',
        secondary: 'bg-navy-700 text-gray-200 hover:bg-navy-600 border border-navy-600/50',
        ghost:     'text-gray-400 hover:text-gray-200 hover:bg-navy-700',
        outline:   'border border-navy-600 bg-transparent text-gray-300 hover:bg-navy-700 hover:text-gray-100',
        destructive: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
        success:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20',
        link:      'text-blue-400 underline-offset-4 hover:underline',
      },
      size: {
        default:  'h-9 px-4 py-2',
        sm:       'h-7 px-3 text-xs',
        lg:       'h-11 px-6 text-base',
        icon:     'h-9 w-9',
        'icon-sm':'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
