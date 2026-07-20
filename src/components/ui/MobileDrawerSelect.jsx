import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * MobileDrawerSelect — responsive select:
 *  - Desktop (≥768px): renders the standard Radix (Shadcn) Select.
 *  - Mobile (<768px): renders a vaul bottom-sheet Drawer with the options.
 *
 * Props:
 *  value, onValueChange, options:[{value,label}], placeholder, title,
 *  className (applied to the trigger), triggerStyle (inline style for trigger)
 */
export default function MobileDrawerSelect({
  value,
  onValueChange,
  options,
  placeholder,
  title,
  className,
  triggerStyle,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger className={className} style={triggerStyle}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
            className
          )}
          style={triggerStyle}
        >
          <span className={selected ? '' : 'text-muted-foreground'}>{selected ? selected.label : placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[75vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title || placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="px-3 pb-6 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onValueChange(o.value); setOpen(false); }}
              className="touch-target w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors"
              style={{
                background: o.value === value ? 'rgba(234,0,234,0.12)' : 'transparent',
                color: o.value === value ? '#ea00ea' : '#c3c3c3',
              }}
            >
              {o.label}
              {o.value === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}