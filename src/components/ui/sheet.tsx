import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: 'right' | 'left';
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  width?: string;
}

function Sheet({
  open,
  onClose,
  side = 'right',
  title,
  description,
  children,
  className,
  width = 'w-[420px]',
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 z-50 flex h-full flex-col border-navy-700 bg-navy-900 shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          side === 'right'
            ? 'right-0 border-l'
            : 'left-0 border-r',
          side === 'right'
            ? open ? 'translate-x-0' : 'translate-x-full'
            : open ? 'translate-x-0' : '-translate-x-full',
          width,
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-navy-700 px-5 py-4 flex-shrink-0">
            <div>
              {title && <h2 className="text-base font-semibold text-gray-100">{title}</h2>}
              {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-md p-1 text-gray-500 transition-colors hover:bg-navy-700 hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

export { Sheet };
