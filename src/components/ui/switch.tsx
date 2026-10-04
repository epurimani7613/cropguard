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
        'pressable relative h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-leaf' : 'bg-line',
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pressable pointer-events-none block h-5 w-5 rounded-full bg-white shadow-e1 ring-0',
          checked ? 'translate-x-5' : 'translate-x-0',
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
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-2xs leading-snug text-muted">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}