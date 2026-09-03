'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface YearPickerProps {
  years: number[];
  value: number;
  onChange: (year: number) => void;
  label?: string;
}

export default function YearPicker({
  years,
  value,
  onChange,
  label = '真题年份',
}: YearPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 h-7 px-3 rounded border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 transition-colors text-[11px] font-medium',
          open && 'border-zinc-900'
        )}
      >
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-zinc-900">{value}</span>
        <ChevronDown size={12} className={cn(open && 'rotate-180 transition-transform')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 right-0 min-w-[100px] bg-white border border-zinc-200 rounded shadow-lg py-1 max-h-64 overflow-y-auto">
          {(years || []).map((y) => (
            <button
              key={y}
              onClick={() => {
                onChange(y);
                setOpen(false);
              }}
              className={cn(
                'block w-full text-left px-3 py-1.5 text-[11px] hover:bg-zinc-100 transition-colors',
                y === value && 'bg-zinc-900 text-white hover:bg-zinc-900 font-bold'
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
