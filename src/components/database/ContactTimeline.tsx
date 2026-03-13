import { useState, useEffect } from 'react';
import { Phone, Mail, MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

interface Communication {
  id: number;
  comm_type: string;
  direction: string;
  subject: string | null;
  body: string | null;
  duration_seconds: number | null;
  created_at: string;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  state: string;
  zip: string;
  source: string;
  lifecycle_stage: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  contactId: number;
}

function commIcon(type: string) {
  if (type === 'call') return <Phone size={14} className="text-emerald-400" />;
  if (type === 'email') return <Mail size={14} className="text-blue-400" />;
  return <MessageSquare size={14} className="text-purple-400" />;
}

function commLabel(type: string) {
  if (type === 'call') return 'text-emerald-400';
  if (type === 'email') return 'text-blue-400';
  return 'text-purple-400';
}

export default function ContactTimeline({ contactId }: Props) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const headers = { 'x-api-key': API_KEY };
    Promise.all([
      fetch(`${API_URL}/api/pg/contacts/${contactId}`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/pg/contacts/${contactId}/timeline`, { headers }).then(r => r.json()),
    ]).then(([cd, td]) => {
      if (cd.ok) setContact(cd.contact);
      if (td.ok) setTimeline(td.communications);
    }).finally(() => setLoading(false));
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading details...</span>
      </div>
    );
  }

  const displayed = showAll ? timeline : timeline.slice(0, 5);

  return (
    <div className="flex gap-6 py-4 px-2">
      {/* Left: Contact Details */}
      {contact && (
        <div className="w-72 shrink-0">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Details</h4>
          <div className="space-y-2 text-sm">
            {[
              ['Name', contact.name],
              ['Email', contact.email],
              ['Phone', contact.phone],
              ['Company', contact.company],
              ['City', contact.city],
              ['State', contact.state],
              ['ZIP', contact.zip],
              ['Source', contact.source],
              ['Stage', contact.lifecycle_stage],
              ['Owner', contact.owner_name],
              ['Created', contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '—'],
              ['Updated', contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : '—'],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">{k}</span>
                <span className="text-gray-200 break-all">{v}</span>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Right: Timeline */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Communications {timeline.length > 0 && <span className="text-gray-600">({timeline.length})</span>}
        </h4>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-600">No communications found.</p>
        ) : (
          <div className="space-y-2">
            {displayed.map(c => (
              <div key={c.id} className="flex gap-3 items-start bg-navy-900/50 rounded-lg p-3 border border-navy-700/30">
                <div className="mt-0.5">{commIcon(c.comm_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-medium uppercase ${commLabel(c.comm_type)}`}>{c.comm_type}</span>
                    <span className="text-xs text-gray-600">{c.direction === 'inbound' ? '← in' : '→ out'}</span>
                    {c.duration_seconds ? <span className="text-xs text-gray-600">{Math.round(c.duration_seconds / 60)}m</span> : null}
                    <span className="text-xs text-gray-600 ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  {c.subject && <p className="text-sm text-gray-300 font-medium truncate">{c.subject}</p>}
                  {c.body && <p className="text-xs text-gray-500 truncate mt-0.5">{c.body.slice(0, 120)}</p>}
                </div>
              </div>
            ))}
            {timeline.length > 5 && (
              <button
                onClick={() => setShowAll(s => !s)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1"
              >
                {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAll ? 'Show less' : `Show ${timeline.length - 5} more`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
