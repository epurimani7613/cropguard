import { cn } from '@/lib/utils';

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pb-3 pt-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate font-display text-[15px] font-bold tracking-tight text-ink">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-2xs leading-snug text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}

/** Hairline separator with generous breathing room. */
export function CardDivider({ className }: { className?: string }) {
  return <div className={cn('hairline my-4', className)} />;
}