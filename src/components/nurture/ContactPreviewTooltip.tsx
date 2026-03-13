import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, DollarSign, ListOrdered } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { NurtureEnrollment } from '../../types';

interface ContactPreviewTooltipProps {
  enrollment: NurtureEnrollment;
}

export default function ContactPreviewTooltip({ enrollment }: ContactPreviewTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function handleMouseEnter() {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const email = enrollment.emailStatus?.email || '';
  const phone = enrollment.phone || '';
  const amount = enrollment.dealAmount || 0;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {enrollment.dealId ? (
        <button
          onClick={() => navigate(`/deals/${enrollment.dealId}`)}
          className="text-sm text-accent-light hover:text-accent transition-colors font-medium text-left"
        >
          {enrollment.contactName}
        </button>
      ) : (
        <span className="text-sm text-gray-300 font-medium">
          {enrollment.contactName}
        </span>
      )}

      {visible && (email || phone || amount > 0) && (
        <div className="absolute left-0 bottom-full mb-2 z-30 w-64 bg-navy-800 border border-navy-600/60 rounded-lg shadow-xl shadow-black/40 p-3 animate-fade-in">
          <p className="text-xs font-semibold text-gray-200 mb-2">{enrollment.contactName}</p>
          <div className="space-y-1.5">
            {email && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Mail size={11} className="text-gray-500 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Phone size={11} className="text-gray-500 flex-shrink-0" />
                {phone}
              </div>
            )}
            {amount > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <DollarSign size={11} className="text-gray-500 flex-shrink-0" />
                {formatCurrency(amount)}
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <ListOrdered size={11} className="text-gray-500 flex-shrink-0" />
              Step {enrollment.step} of {enrollment.totalSteps}
            </div>
          </div>
          <div className="absolute left-4 -bottom-1 w-2 h-2 bg-navy-800 border-r border-b border-navy-600/60 rotate-45" />
        </div>
      )}
    </div>
  );
}
