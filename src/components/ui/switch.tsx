import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors',
        checked ? 'border-ok/60 bg-ok/85' : 'border-line bg-elevated',
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'block h-[16px] w-[16px] translate-x-[3px] rounded-full bg-white shadow transition-transform duration-150',
          checked && 'translate-x-[19px]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export function SwitchRow({
  checked,
  onCheckedChange,
  label,
  hint,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {hint ? <p className="text-2xs text-muted">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}