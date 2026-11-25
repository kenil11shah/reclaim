'use client';
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] text-[15px] leading-tight',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand hover:bg-brand/90',
        secondary: 'bg-surface text-ink border border-line hover:border-brand/50 hover:bg-brand-soft/40',
        ghost: 'text-ink hover:bg-brand-soft/60',
        quiet: 'text-brand underline-offset-4 hover:underline px-0 min-h-0',
        danger: 'bg-danger text-white hover:bg-danger/90',
        amber: 'bg-amber text-[#1f1300] hover:bg-amber/90',
      },
      size: { sm: 'px-3 py-2 text-sm min-h-[40px]', md: 'px-4 py-2.5', lg: 'px-6 py-3.5 text-base' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-surface p-5 sm:p-6', className)} {...p} />;
}
export function Badge({ className, tone = 'neutral', ...p }: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'brand' | 'amber' | 'ok' | 'danger' }) {
  const tones = {
    neutral: 'bg-line/60 text-ink',
    brand: 'bg-brand-soft text-brand',
    amber: 'bg-amber-soft text-[#6b4300] dark:text-amber',
    ok: 'bg-ok-soft text-ok',
    danger: 'bg-danger/10 text-danger',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)} {...p} />;
}
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 max-w-prose">
      <h1 className="text-[30px] sm:text-[40px] font-bold leading-[1.1] tracking-tight text-balance">{title}</h1>
      {sub && <p className="mt-3 text-[17px] text-muted">{sub}</p>}
      {children}
    </header>
  );
}
export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children}
      {hint && <span className="ml-1 font-normal text-muted">{hint}</span>}
    </label>
  );
}
const field = 'w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 min-h-[44px]';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, className)} {...p} />
));
Input.displayName = 'Input';
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-[96px] leading-relaxed', className)} {...p} />
));
Textarea.displayName = 'Textarea';
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(field, 'pr-8', className)} {...p} />
));
Select.displayName = 'Select';

export function Notice({ tone = 'brand', children, className }: { tone?: 'brand' | 'amber' | 'ok'; children: ReactNode; className?: string }) {
  const tones = { brand: 'bg-brand-soft/70 border-brand/20', amber: 'bg-amber-soft border-amber/40', ok: 'bg-ok-soft border-ok/30' };
  return <div role="note" className={cn('rounded-xl border px-4 py-3 text-[15px]', tones[tone], className)}>{children}</div>;
}
