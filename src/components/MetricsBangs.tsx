import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function MetricsBangs() {
  const [open, setOpen] = useState(() => {
    return localStorage.getItem('deca-bangs-open') === 'true';
  });

  // Sync open state from Deal Page close
  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail?.open;
      if (typeof val === 'boolean') setOpen(val);
    };
    window.addEventListener('toggle-deal-page', handler);
    return () => window.removeEventListener('toggle-deal-page', handler);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    localStorage.setItem('deca-bangs-open', String(next));
    window.dispatchEvent(new CustomEvent('toggle-deal-page', { detail: { open: next } }));
  }

  return (
    <button
      onClick={toggleOpen}
      className="w-full flex items-center justify-center gap-1 py-0.5 backdrop-blur-md bg-white/60 border-b border-gray-200/50 hover:bg-white/80 transition-all duration-200"
    >
      <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Deals</span>
      {open ? <ChevronUp size={10} className="text-gray-400" /> : <ChevronDown size={10} className="text-gray-400" />}
    </button>
  );
}
