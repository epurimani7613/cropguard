import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronRight } from 'lucide-react';

export function Accordion({
  children,
  className,
  defaultOpen = [],
}: {
  children: React.ReactNode;
  className?: string;
  /** Values expanded on first render. */
  defaultOpen?: string[];
}) {
  return (
    <AccordionPrimitive.Root type="multiple" className={className} defaultValue={defaultOpen}>
      {children}
    </AccordionPrimitive.Root>
  );
}

export function AccordionItem({
  value,
  title,
  badge,
  children,
}: {
  value: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccordionPrimitive.Item
      value={value}
      className="pressable overflow-hidden rounded-xl border border-line/70 bg-elevated/50 hover:border-brand/25 hover:bg-elevated"
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
          <span className="flex min-w-0 items-center gap-2.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-brand transition-transform duration-300 group-data-[state=open]:rotate-90" />
            <span className="truncate text-[13px] font-semibold text-ink">{title}</span>
          </span>
          {badge ? <span className="shrink-0">{badge}</span> : null}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden text-[13px] leading-relaxed text-muted">
        <div className="px-4 pb-4 pt-0.5">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}