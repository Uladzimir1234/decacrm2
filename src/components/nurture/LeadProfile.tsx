import { useEffect, useState, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Tag,
  Clock,
  Eye,
  MousePointer,
  PhoneCall,
  MessageSquare,
  FileText,
  TrendingUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { formatDate, timeAgo, cn } from '../../lib/utils';
import { getLeadProfile } from '../../services/nurture';

interface LeadProfileProps {
  email: string | null;
  onClose: () => void;
}

interface TimelineItem {
  type: 'call' | 'sms' | 'email' | 'note' | 'stage_change';
  date: string;
  direction?: 'inbound' | 'outbound';
  duration?: number;
  from?: string;
  summary?: string;
  text?: string;
  subject?: string;
  url?: string;
  event?: string;
  body?: string;
  author?: string;
  callId?: string;
}

interface Contact {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  state?: string;
  source?: string;
  sourceDetail?: string;
  createdAt?: string;
  owner?: string;
  ownerId?: string;
  lifecycleStage?: string;
}

interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  stageName: string;
  owner: string;
  createdAt: string;
}

interface LeadProfileData {
  contact: Contact;
  deals: Deal[];
  timeline: TimelineItem[];
}

export default function LeadProfile({ email, onClose }: LeadProfileProps) {
  const [profile, setProfile] = useState<LeadProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'calls' | 'sms' | 'emails' | 'notes'>('all');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (email) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [email, onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    if (!email) {
      setProfile(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getLeadProfile(email).then((data) => {
      if (!cancelled) {
        setProfile(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err.message || 'Failed to load profile');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [email]);

  // Filter timeline based on active tab
  const filteredTimeline = profile?.timeline.filter((item) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'calls') return item.type === 'call';
    if (filterTab === 'sms') return item.type === 'sms';
    if (filterTab === 'emails') return item.type === 'email';
    if (filterTab === 'notes') return item.type === 'note';
    return true;
  }) || [];

  // Count items by type
  const timelineCounts = profile?.timeline.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const ownerColor = (owner: string) => {
    switch (owner) {
      case 'Eric': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Paul': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Ilya': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          email ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Slide-out Panel */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 z-50',
          'shadow-2xl shadow-black/40 overflow-y-auto',
          'transition-transform duration-300 ease-out',
          email ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {email && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <User size={20} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-white truncate">
                    {profile?.contact.name || 'Loading...'}
                  </h2>
                  <p className="text-sm text-gray-400 truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="text-accent animate-spin mb-4" />
                  <p className="text-gray-400">Loading lead profile...</p>
                </div>
              ) : error ? (
                <div className="p-6">
                  <div className="card p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                      <X size={24} className="text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Error Loading Profile</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : profile ? (
                <div className="p-6 space-y-6">
                  {/* Contact Header */}
                  <div className="card p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">{profile.contact.name}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail size={16} />
                            <span className="text-sm">{profile.contact.email}</span>
                          </div>
                          {profile.contact.phone && (
                            <a
                              href={`tel:${profile.contact.phone}`}
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Phone size={16} />
                              <span className="text-sm">{profile.contact.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {profile.contact.owner && (
                          <Badge className={ownerColor(profile.contact.owner)}>
                            {profile.contact.owner}
                          </Badge>
                        )}
                        {profile.contact.lifecycleStage && (
                          <Badge className="bg-slate-700 text-gray-300 border-slate-600">
                            {profile.contact.lifecycleStage}
                          </Badge>
                        )}
                        {profile.contact.source && profile.contact.source !== 'EMAIL_ONLY' && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {profile.contact.sourceDetail || profile.contact.source}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {profile.contact.company && (
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-gray-500" />
                          <span className="text-gray-400">Company:</span>
                          <span className="text-white">{profile.contact.company}</span>
                        </div>
                      )}
                      {(profile.contact.city || profile.contact.state) && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500" />
                          <span className="text-gray-400">Location:</span>
                          <span className="text-white">
                            {[profile.contact.city, profile.contact.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {profile.contact.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500" />
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white">{timeAgo(new Date(profile.contact.createdAt))}</span>
                        </div>
                      )}
                    </div>

                    {/* Deal Info */}
                    {profile.deals.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <h4 className="text-lg font-semibold text-white mb-3">Associated Deals</h4>
                        <div className="space-y-2">
                          {profile.deals.map((deal) => (
                            <div key={deal.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                              <div>
                                <p className="font-medium text-white">{deal.name}</p>
                                <p className="text-sm text-gray-400">{deal.stageName} • {deal.owner}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-400">${deal.amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{timeAgo(new Date(deal.createdAt))}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="card p-0 overflow-hidden">
                    <div className="flex items-center border-b border-slate-700">
                      {[
                        { key: 'all', label: 'All', icon: Clock },
                        { key: 'calls', label: `Calls (${timelineCounts.call || 0})`, icon: PhoneCall },
                        { key: 'sms', label: `SMS (${timelineCounts.sms || 0})`, icon: MessageSquare },
                        { key: 'emails', label: `Emails (${timelineCounts.email || 0})`, icon: Mail },
                        { key: 'notes', label: `Notes (${timelineCounts.note || 0})`, icon: FileText },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setFilterTab(key as any)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                            filterTab === key
                              ? 'border-accent text-accent bg-accent/10'
                              : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-800'
                          )}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="p-6">
                      {filteredTimeline.length > 0 ? (
                        <div className="space-y-4">
                          {filteredTimeline.map((item, index) => (
                            <TimelineItem key={index} item={item} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock size={48} className="mx-auto text-gray-600 mb-3" />
                          <p className="text-gray-400 mb-2">No activity found</p>
                          <p className="text-sm text-gray-500">
                            {filterTab === 'all' ? 'No activity recorded' : `No ${filterTab} activity`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TimelineItem({ item }: { item: TimelineItem }) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'call': return <PhoneCall size={18} className="text-blue-400" />;
      case 'sms': return <MessageSquare size={18} className="text-green-400" />;
      case 'email': return item.event === 'clicked' ? <MousePointer size={18} className="text-purple-400" /> : <Eye size={18} className="text-blue-400" />;
      case 'note': return <FileText size={18} className="text-yellow-400" />;
      case 'stage_change': return <TrendingUp size={18} className="text-orange-400" />;
      default: return <Clock size={18} className="text-gray-400" />;
    }
  };

  const getDirectionIcon = () => {
    if (item.type !== 'call' && item.type !== 'sms') return null;
    return item.direction === 'inbound' ? '←' : '→';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getContent = () => {
    switch (item.type) {
      case 'call':
        const callDir = item.direction === 'inbound' ? 'Inbound' : 'Outbound';
        const duration = item.duration ? formatDuration(item.duration) : 'No duration';
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{callDir} call with {item.from}</span>
              <span className="text-gray-400">— {duration}</span>
            </div>
            {item.summary && (
              <div className="mt-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-accent hover:text-accent-light transition-colors"
                >
                  {expanded ? 'Hide summary' : 'Show summary'}
                </button>
                {expanded && (
                  <div className="mt-2 p-3 bg-slate-800 rounded border-l-2 border-accent">
                    <p className="text-sm text-gray-300">{item.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'sms':
        const smsDir = item.direction === 'inbound' ? '←' : '→';
        return (
          <div className="flex items-start gap-2">
            <span className="text-lg">{smsDir}</span>
            <span className="text-gray-300">{item.text || 'No content'}</span>
          </div>
        );

      case 'email':
        return (
          <div>
            <div className="flex items-center gap-2">
              <Badge className={item.event === 'clicked' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}>
                {item.event === 'clicked' ? 'Clicked' : 'Opened'}
              </Badge>
              <span className="text-gray-300">{item.subject}</span>
            </div>
            {item.url && (
              <div className="mt-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink size={14} />
                  {item.url}
                </a>
              </div>
            )}
          </div>
        );

      case 'note':
        return (
          <div>
            <div className="text-gray-300 mb-1">{item.body}</div>
            {item.author && (
              <div className="text-xs text-gray-500">by {item.author}</div>
            )}
          </div>
        );

      default:
        return <span className="text-gray-300">Unknown activity</span>;
    }
  };

  return (
    <div className="flex gap-4 p-4 border border-slate-700 rounded-lg hover:bg-slate-800/30 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white capitalize">{item.type}</span>
            {getDirectionIcon() && (
              <span className="text-gray-400">{getDirectionIcon()}</span>
            )}
          </div>
          <span className="text-sm text-gray-500 flex-shrink-0">
            {timeAgo(new Date(item.date))}
          </span>
        </div>
        {getContent()}
      </div>
    </div>
  );
}