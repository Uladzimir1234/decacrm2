import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-1',
        'text-sm text-gray-200 placeholder:text-gray-600',
        'transition-colors',
        'focus-visible:outline-none focus-visible:border-sky-500 focus-visible:ring-1 focus-visible:ring-sky-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
