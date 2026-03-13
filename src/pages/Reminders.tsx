import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, Check, ChevronDown, ChevronRight, Calendar, User, Flag, Edit2, Save, X } from 'lucide-react';
import Header from '../components/Header';
import { getReminders, createReminder, toggleComplete, deleteReminder, updateReminder, type Reminder, type CreateReminderData } from '../services/reminders';
import { formatDistanceToNow, isPast, isToday, format } from 'date-fns';

interface RemindersBySection {
  overdue: Reminder[];
  today: Reminder[];
  upcoming: Reminder[];
  completed: Reminder[];
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateReminderData>({
    title: '',
    description: '',
    dueAt: '',
    repeat: 'none',
    assignee: null,
    dealId: null,
    dealName: null,
    priority: 'medium'
  });

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    try {
      setError(null);
      const data = await getReminders();
      setReminders(data);
    } catch (err) {
      setError('Failed to load reminders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueAt) return;

    try {
      setError(null);
      await createReminder(formData);
      setFormData({
        title: '',
        description: '',
        dueAt: '',
        repeat: 'none',
        assignee: null,
        dealId: null,
        dealName: null,
        priority: 'medium'
      });
      setShowCreateForm(false);
      loadReminders();
    } catch (err) {
      setError('Failed to create reminder');
      console.error(err);
    }
  }

  async function handleToggleComplete(reminder: Reminder) {
    try {
      setError(null);
      await toggleComplete(reminder.id);
      loadReminders();
    } catch (err) {
      setError('Failed to update reminder');
      console.error(err);
    }
  }

  async function handleDeleteReminder(reminder: Reminder) {
    if (!confirm(`Delete reminder "${reminder.title}"?`)) return;
    
    try {
      setError(null);
      await deleteReminder(reminder.id);
      loadReminders();
    } catch (err) {
      setError('Failed to delete reminder');
      console.error(err);
    }
  }

  function organizeReminders(reminders: Reminder[]): RemindersBySection {
    const now = new Date();
    const organized: RemindersBySection = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: []
    };

    reminders.forEach(reminder => {
      if (reminder.completed) {
        organized.completed.push(reminder);
        return;
      }

      const dueDate = new Date(reminder.dueAt);
      if (isPast(dueDate) && !isToday(dueDate)) {
        organized.overdue.push(reminder);
      } else if (isToday(dueDate)) {
        organized.today.push(reminder);
      } else {
        organized.upcoming.push(reminder);
      }
    });

    return organized;
  }

  const organizedReminders = organizeReminders(reminders);

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  function getAssigneeColor(assignee: string): string {
    switch (assignee) {
      case 'vlad': return 'bg-blue-600';
      case 'eric': return 'bg-green-600';
      case 'paul': return 'bg-purple-600';
      case 'ilya': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  }

  function ReminderCard({ reminder }: { reminder: Reminder }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState(reminder.description || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const dueDate = new Date(reminder.dueAt);
    const isOverdue = isPast(dueDate) && !isToday(dueDate) && !reminder.completed;
    
    async function handleSaveDescription() {
      setIsSaving(true);
      try {
        await updateReminder(reminder.id, { description: editedDescription });
        setIsEditing(false);
        loadReminders();
      } catch (err) {
        setError('Failed to update description');
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
    
    function handleCancelEdit() {
      setEditedDescription(reminder.description || '');
      setIsEditing(false);
    }
    
    return (
      <div className={`bg-navy-900 border border-navy-700/50 rounded-lg p-4 transition-all hover:border-navy-600 ${reminder.completed ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Complete checkbox */}
            <button
              onClick={() => handleToggleComplete(reminder)}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                reminder.completed
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-400 hover:border-green-400'
              }`}
            >
              {reminder.completed && <Check size={12} />}
            </button>

            <div className="flex-1 min-w-0">
              {/* Title, priority, and expand button */}
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(reminder.priority)}`} />
                <h3 className={`text-sm font-medium flex-1 ${reminder.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                  {reminder.title}
                </h3>
                {reminder.description && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
              </div>

              {/* Description - truncated or expanded */}
              {reminder.description && (
                <div className="mb-2">
                  {!isExpanded ? (
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {reminder.description}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {!isEditing ? (
                        <div className="relative group">
                          <p className="text-xs text-gray-400 whitespace-pre-wrap">
                            {reminder.description}
                          </p>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-800 hover:bg-navy-700 text-gray-300 p-1.5 rounded"
                            title="Edit description"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            className="w-full px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-xs text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveDescription}
                              disabled={isSaving}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded transition-colors"
                            >
                              <Save size={12} />
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="flex items-center gap-1 px-2 py-1 bg-navy-700 hover:bg-navy-600 disabled:opacity-50 text-gray-300 text-xs rounded transition-colors"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Due time and metadata */}
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                    {format(dueDate, 'MMM d, h:mm a')}
                  </span>
                </div>
                
                {reminder.assignee && (
                  <div className="flex items-center gap-1">
                    <User size={10} />
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${getAssigneeColor(reminder.assignee)}`}>
                      {reminder.assignee}
                    </span>
                  </div>
                )}

                {reminder.repeat !== 'none' && (
                  <span className="text-blue-400">
                    {reminder.repeat}
                  </span>
                )}
              </div>

              {/* Created and Completed dates - shown when expanded */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-navy-700/50 text-xs text-gray-500 space-y-1">
                  <div>
                    Created: {format(new Date(reminder.createdAt), 'MMM d, yyyy')}
                  </div>
                  {reminder.completed && reminder.completedAt && (
                    <div className="text-green-400">
                      Completed: {format(new Date(reminder.completedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              )}

              {/* Deal link */}
              {reminder.dealName && (
                <div className="mt-1 text-xs text-blue-400">
                  Deal: {reminder.dealName}
                </div>
              )}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={() => handleDeleteReminder(reminder)}
            className="text-gray-500 hover:text-red-400 transition-colors ml-2"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  function ReminderSection({ 
    title, 
    reminders, 
    accentColor, 
    icon, 
    collapsible = false, 
    defaultExpanded = true 
  }: { 
    title: string; 
    reminders: Reminder[]; 
    accentColor: string; 
    icon: React.ReactNode; 
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (reminders.length === 0) return null;

    return (
      <div className="mb-6">
        <div 
          className={`flex items-center gap-2 mb-3 ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          {collapsible && (
            expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />
          )}
          <div className={`text-lg font-semibold ${accentColor} flex items-center gap-2`}>
            {icon}
            {title} ({reminders.length})
          </div>
        </div>
        
        {expanded && (
          <div className="space-y-3">
            {reminders.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 text-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-navy-800 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-navy-800 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-blue-400" size={28} />
            Reminders
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add Reminder
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreateForm && (
          <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Reminder</h2>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reminder title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional details"
                    rows={3}
                  />
                </div>

                {/* Due date and time */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority *
                  </label>
                  <div className="flex gap-2">
                    {['high', 'medium', 'low'].map(priority => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: priority as any })}
                        className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                          formData.priority === priority
                            ? priority === 'high' ? 'bg-red-600 text-white' : 
                              priority === 'medium' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                            : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assignee
                  </label>
                  <select
                    value={formData.assignee || ''}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value as any || null })}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    <option value="vlad">Vlad</option>
                    <option value="eric">Eric</option>
                    <option value="paul">Paul</option>
                    <option value="ilya">Ilya</option>
                  </select>
                </div>

                {/* Repeat */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Repeat
                  </label>
                  <select
                    value={formData.repeat}
                    onChange={(e) => setFormData({ ...formData, repeat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.title.trim() || !formData.dueAt}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs: Active / History */}
        <div className="flex items-center gap-1 mb-6 bg-navy-900 rounded-lg p-1 w-fit">
          <button
            onClick={() => setShowCompleted(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showCompleted 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active
            {(organizedReminders.overdue.length + organizedReminders.today.length + organizedReminders.upcoming.length) > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">
                {organizedReminders.overdue.length + organizedReminders.today.length + organizedReminders.upcoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showCompleted 
                ? 'bg-green-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            History
            {organizedReminders.completed.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-green-700 text-white">
                {organizedReminders.completed.length}
              </span>
            )}
          </button>
        </div>

        {/* Active tab */}
        {!showCompleted && (
          <div>
            <ReminderSection
              title="Overdue"
              reminders={organizedReminders.overdue}
              accentColor="text-red-400"
              icon={<Flag className="text-red-400" size={20} />}
            />

            <ReminderSection
              title="Today"
              reminders={organizedReminders.today}
              accentColor="text-amber-400"
              icon={<Clock className="text-amber-400" size={20} />}
            />

            <ReminderSection
              title="Upcoming"
              reminders={organizedReminders.upcoming}
              accentColor="text-blue-400"
              icon={<Calendar className="text-blue-400" size={20} />}
            />

            {organizedReminders.overdue.length === 0 && organizedReminders.today.length === 0 && organizedReminders.upcoming.length === 0 && (
              <div className="text-center py-12">
                <Check size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">All clear!</h3>
                <p className="text-gray-500">No active reminders. Nice work.</p>
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {showCompleted && (
          <div>
            {organizedReminders.completed.length > 0 ? (
              <div className="space-y-3">
                {organizedReminders.completed
                  .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                  .map(reminder => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No completed reminders yet</h3>
                <p className="text-gray-500">Completed reminders will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state - no reminders at all */}
        {reminders.length === 0 && (
          <div className="text-center py-12">
            <Clock size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No reminders yet</h3>
            <p className="text-gray-500">Create your first reminder to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}