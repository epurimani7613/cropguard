import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SelectField({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  label: string;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={label}
        className={cn(
          'inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-ink transition-colors hover:bg-elevated',
          className,
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="glass z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line/80 p-1 shadow-e3"
        >
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none flex-col rounded-lg px-2.5 py-2 pr-7 text-[13px] text-ink outline-none data-[highlighted]:bg-elevated"
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                {/* This Radix build has no ItemDescription; render the hint directly. */}
                {o.hint ? (
                  <span className="mt-0.5 text-2xs leading-snug text-muted">{o.hint}</span>
                ) : null}
                <SelectPrimitive.ItemIndicator className="absolute right-2 top-2.5">
                  <Check className="h-3.5 w-3.5 text-ok" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}