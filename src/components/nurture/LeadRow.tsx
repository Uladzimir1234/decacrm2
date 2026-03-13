import { useState } from 'react';
import { ChevronDown, ChevronRight, Phone, Mail, FileText, Clock, MousePointer, Eye } from 'lucide-react';
import { timeAgo } from '../../lib/utils';
import type { Lead } from '../../services/nurture';

interface LeadRowProps {
  lead: Lead;
  onContactClick?: (dealId: string | null) => void;
  onLeadClick?: (email: string) => void;
}

export default function LeadRow({ lead, onContactClick, onLeadClick }: LeadRowProps) {
  const [expanded, setExpanded] = useState(false);

  const temperatureConfig = {
    hot: {
      dot: 'bg-red-500',
      pill: 'bg-red-500/20 text-red-400 border-red-500/30',
      text: 'HOT',
    },
    warm: {
      dot: 'bg-amber-500',
      pill: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      text: 'WARM',
    },
    cooling: {
      dot: 'bg-sky-500',
      pill: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      text: 'COOLING',
    },
    cold: {
      dot: 'bg-slate-500',
      pill: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      text: 'COLD',
    },
  };

  const config = temperatureConfig[lead.temperature];

  const handleNameClick = () => {
    if (lead.dealId && onContactClick) {
      onContactClick(lead.dealId);
    } else if (onLeadClick) {
      onLeadClick(lead.email);
    }
  };

  const handleRowClick = () => {
    // First try expanding, but also trigger lead profile
    setExpanded(!expanded);
    if (onLeadClick) {
      onLeadClick(lead.email);
    }
  };

  const formatEventType = (type: string) => {
    switch (type) {
      case 'opens': return 'Opened';
      case 'clicks': return 'Clicked';
      case 'delivered': return 'Delivered';
      case 'bounces': return 'Bounced';
      case 'unsubscribed': return 'Unsubscribed';
      default: return type;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'opens': return <Eye size={14} className="text-blue-400" />;
      case 'clicks': return <MousePointer size={14} className="text-green-400" />;
      case 'delivered': return <Mail size={14} className="text-gray-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <div
        className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
        onClick={handleRowClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Expand/Collapse Button */}
            <button 
              className="text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Temperature Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.dot}`} />
              <span className={`text-xs px-2 py-1 rounded border font-medium ${config.pill}`}>
                {config.text}
              </span>
            </div>

            {/* Name & Email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNameClick();
                  }}
                  className={`font-medium truncate ${
                    lead.dealId
                      ? 'text-accent-light hover:text-accent cursor-pointer'
                      : 'text-white'
                  }`}
                >
                  {lead.name}
                </button>
              </div>
              <p className="text-sm text-gray-400 truncate">{lead.email}</p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye size={14} className="text-blue-400" />
                <span className="text-sm bg-slate-700 px-2 py-1 rounded text-blue-400">
                  {lead.totalOpens}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointer size={14} className="text-green-400" />
                <span className="text-sm bg-slate-700 px-2 py-1 rounded text-green-400">
                  {lead.totalClicks}
                </span>
              </div>
            </div>

            {/* Last Activity */}
            <div className="hidden lg:block text-sm text-gray-400">
              {lead.lastActivity ? timeAgo(new Date(lead.lastActivity)) : 'No activity'}
            </div>
          </div>

          {/* Signal */}
          <div className="hidden xl:block ml-4 max-w-xs">
            <p className="text-sm text-gray-400 italic truncate">{lead.signal}</p>
          </div>
        </div>

        {/* Mobile Stats Row */}
        <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye size={12} className="text-blue-400" />
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-blue-400">
                {lead.totalOpens}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MousePointer size={12} className="text-green-400" />
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-green-400">
                {lead.totalClicks}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {lead.lastActivity ? timeAgo(new Date(lead.lastActivity)) : 'No activity'}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-800 bg-slate-900/50">
          <div className="p-4 space-y-4">
            {/* Signal/Recommendation */}
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
              <h4 className="text-sm font-medium text-accent-light mb-1">Recommendation</h4>
              <p className="text-sm text-gray-300">{lead.signal}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-400 transition-colors">
                <Phone size={14} />
                Call
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm font-medium text-green-400 transition-colors">
                <Mail size={14} />
                Send Email
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-400 transition-colors">
                <FileText size={14} />
                Add Note
              </button>
            </div>

            {/* Campaigns */}
            {lead.campaigns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Campaigns Received</h4>
                <div className="flex flex-wrap gap-2">
                  {lead.campaigns.map((campaign, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-slate-700 rounded border border-slate-600 text-gray-300"
                    >
                      {campaign}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Event Timeline */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Activity Timeline</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {lead.events.length > 0 ? (
                  lead.events.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-slate-800/50 rounded border border-slate-700"
                    >
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">
                            {formatEventType(event.type)}
                          </p>
                          <span className="text-xs text-gray-400">
                            {timeAgo(new Date(event.date))}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {event.subject || 'No subject'}
                        </p>
                        {event.url && (
                          <p className="text-xs text-blue-400 truncate mt-1">
                            {event.url}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No events recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}