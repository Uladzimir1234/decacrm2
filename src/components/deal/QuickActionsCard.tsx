import { useState } from 'react';
import { Bell, CalendarPlus, Mail, Send } from 'lucide-react';
import { nudgeSeller } from '../../services/notify';
import { setReminder } from '../../services/deals';
import type { Deal } from '../../types';
import { cn } from '../../lib/utils';

interface QuickActionsCardProps {
  deal: Deal;
  onAction: () => void;
}

export default function QuickActionsCard({
  deal,
  onAction,
}: QuickActionsCardProps) {
  const [nudged, setNudged] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderText, setReminderText] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  async function handleNudge() {
    await nudgeSeller(deal.id, deal.seller_id);
    setNudged(true);
    setTimeout(() => setNudged(false), 3000);
  }

  async function handleSetReminder() {
    if (!reminderDate || !reminderText) return;
    await setReminder(deal.id, reminderDate, reminderText);
    setShowReminder(false);
    setReminderDate('');
    setReminderText('');
    onAction();
  }

  function handleSendEmail() {
    const mailto = `mailto:${deal.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
    setShowEmail(false);
    setEmailSubject('');
    setEmailBody('');
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Quick Actions
      </h3>

      <div className="space-y-2">
        <button
          onClick={handleNudge}
          disabled={nudged}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
            nudged
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-navy-700 text-gray-300 border-navy-600 hover:bg-navy-600 hover:text-gray-100'
          )}
        >
          <Bell size={14} />
          {nudged ? 'Nudge Sent!' : 'Send Nudge to Seller'}
        </button>

        <button
          onClick={() => setShowReminder(!showReminder)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-navy-700 text-gray-300 border border-navy-600 hover:bg-navy-600 hover:text-gray-100 transition-all duration-200"
        >
          <CalendarPlus size={14} />
          Set Reminder
        </button>

        {showReminder && (
          <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700/30 space-y-2">
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="input-dark w-full text-sm"
            />
            <input
              type="text"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Reminder text..."
              className="input-dark w-full text-sm"
            />
            <button
              onClick={handleSetReminder}
              disabled={!reminderDate || !reminderText}
              className="btn-primary w-full text-sm disabled:opacity-40"
            >
              Save Reminder
            </button>
          </div>
        )}

        <button
          onClick={() => setShowEmail(!showEmail)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-navy-700 text-gray-300 border border-navy-600 hover:bg-navy-600 hover:text-gray-100 transition-all duration-200"
        >
          <Mail size={14} />
          Send Email to Customer
        </button>

        {showEmail && (
          <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700/30 space-y-2">
            <p className="text-xs text-gray-500">
              To: {deal.email}
            </p>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject..."
              className="input-dark w-full text-sm"
            />
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Email body..."
              rows={4}
              className="input-dark w-full text-sm resize-none"
            />
            <button
              onClick={handleSendEmail}
              disabled={!emailSubject}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send size={12} />
              Open in Email Client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
