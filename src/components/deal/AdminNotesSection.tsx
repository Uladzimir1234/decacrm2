import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addNote } from '../../services/deals';
import { formatDateTime } from '../../lib/utils';
import type { AdminNote } from '../../types';

interface AdminNotesSectionProps {
  dealId: string;
  notes: AdminNote[];
  onNoteAdded: () => void;
}

export default function AdminNotesSection({
  dealId,
  notes,
  onNoteAdded,
}: AdminNotesSectionProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await addNote(dealId, text.trim());
    setText('');
    setSubmitting(false);
    onNoteAdded();
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Admin Notes
      </h3>

      {notes.length === 0 && (
        <p className="text-sm text-gray-500 mb-4">No notes yet</p>
      )}

      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-navy-900/50 rounded-lg p-3 border border-navy-700/30"
          >
            <p className="text-sm text-gray-300 leading-relaxed">
              {note.text}
            </p>
            <p className="text-[10px] text-gray-600 mt-2">
              {formatDateTime(note.created_at)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Add a note..."
          className="input-dark flex-1 text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="btn-primary px-3 py-2 text-sm flex items-center gap-1 disabled:opacity-40"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  );
}
