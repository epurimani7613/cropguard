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
      className="overflow-hidden rounded-lg border border-line/70 bg-elevated/50"
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-elevated">
          <span className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-150 group-data-[state=open]:rotate-90" />
            <span className="truncate text-[13px] font-medium text-ink">{title}</span>
          </span>
          {badge ? <span className="shrink-0">{badge}</span> : null}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden text-[13px] leading-relaxed text-muted">
        <div className="border-t border-line/60 px-3 pb-3 pt-2.5">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}