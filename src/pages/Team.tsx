import { useState, useEffect } from 'react';
import { RefreshCw, Phone, Clock, MessageSquare, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, ChevronDown, ChevronRight, ChevronLeft, PhoneIncoming, PhoneOutgoing, PhoneMissed, Mail } from 'lucide-react';
import { getTeamActivity, getTeamHistory, getDayDrillDown, type TeamActivityData, type TeamSeller, type TeamHistoryData, type HistoryDayPhone, type HistoryDaySDR, type HistorySeller, type DayDrillDown, type CallDetail, type SmsDetail } from '../services/team';
import { formatCurrency, timeAgo } from '../lib/utils';

function ActivityComparison({ today, yesterday, type }: { today: number; yesterday: number; type: 'calls' | 'sms' }) {
  if (yesterday === 0) return null;
  
  const change = today - yesterday;
  const isUp = change > 0;
  const isDown = change < 0;
  
  if (change === 0) return null;
  
  return (
    <span className={`inline-flex items-center ml-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
    </span>
  );
}

function ResponsivenessBadge({ avgResponseTimeHours, unansweredCount }: { avgResponseTimeHours: number | null; unansweredCount: number }) {
  // Color coding for response time
  let responseColor = 'bg-gray-600';
  let responseText = 'No data';
  
  if (avgResponseTimeHours !== null) {
    if (avgResponseTimeHours < 2) {
      responseColor = 'bg-green-600';
      responseText = `${avgResponseTimeHours}h`;
    } else if (avgResponseTimeHours <= 8) {
      responseColor = 'bg-yellow-600';
      responseText = `${avgResponseTimeHours}h`;
    } else {
      responseColor = 'bg-red-600';
      responseText = `${avgResponseTimeHours}h`;
    }
  }
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`px-2 py-1 rounded-full text-white font-medium ${responseColor}`}>
        📊 Avg response: {responseText}
      </span>
      {unansweredCount > 0 && (
        <span className="bg-red-600 text-white px-2 py-1 rounded-full font-medium flex items-center gap-1">
          <AlertTriangle size={12} />
          {unansweredCount} unanswered
        </span>
      )}
    </div>
  );
}

function DailyBreakdown({ dailyBreakdown }: { dailyBreakdown: Array<{ date: string; calls: number; sms: number }> }) {
  if (!dailyBreakdown || dailyBreakdown.length === 0) return null;
  
  const maxActivity = Math.max(...dailyBreakdown.map(day => day.calls + day.sms));
  
  return (
    <div className="flex items-end gap-1 mt-2">
      {dailyBreakdown.map((day, index) => {
        const activity = day.calls + day.sms;
        const height = maxActivity > 0 ? Math.max((activity / maxActivity) * 30, 2) : 2;
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        
        return (
          <div
            key={index}
            className="flex flex-col items-center group relative"
            title={`${day.date}: ${day.calls} calls, ${day.sms} messages`}
          >
            <div
              className="w-3 bg-accent/70 rounded-sm transition-opacity group-hover:bg-accent"
              style={{ height: `${height}px` }}
            />
            <span className="text-[10px] text-slate-500 mt-1">{dayName}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
              {day.date}<br />
              {day.calls} calls, {day.sms} messages
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalsSection({ signals }: { signals: TeamSeller['signals'] }) {
  const redCount = signals?.filter(s => s.severity === 'red').length || 0;
  const yellowCount = signals?.filter(s => s.severity === 'yellow').length || 0;
  const greenCount = signals?.filter(s => s.severity === 'green').length || 0;
  const hasUrgent = redCount > 0 || yellowCount > 0;
  const [isExpanded, setIsExpanded] = useState(hasUrgent);
  
  if (!signals || signals.length === 0) return null;
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-amber-500';  
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className={`border-t mt-3 pt-3 ${hasUrgent ? 'border-red-500/30' : 'border-slate-800'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 hover:text-slate-300 transition-colors w-full"
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>Signals</span>
        <div className="flex items-center gap-1.5 ml-1">
          {redCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">{redCount} 🔴</span>}
          {yellowCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{yellowCount} 🟡</span>}
          {greenCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">{greenCount} 🟢</span>}
        </div>
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          {signals.slice(0, 5).map((signal, index) => (
            <div key={signal.id || index} className="flex items-start gap-2 py-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getSeverityColor(signal.severity)}`} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-300 font-medium block">{signal.title}</span>
                <p className="text-[11px] text-slate-500 leading-tight">{signal.message}</p>
              </div>
            </div>
          ))}
          {signals.length > 5 && (
            <div className="text-[10px] text-slate-600 italic">
              +{signals.length - 5} more signals
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CallDetailPanel({ drillDown, isExpanded, onToggle }: { drillDown: DayDrillDown; isExpanded: boolean; onToggle: () => void }) {
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());
  
  const toggleSummary = (index: number) => {
    const newExpanded = new Set(expandedSummaries);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSummaries(newExpanded);
  };
  
  const formatTime = (time: string) => {
    // Convert to ET (subtract 5 hours from UTC or just show time portion)
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true,
      timeZone: 'America/New_York'
    });
  };
  
  const getCallIcon = (status: string, direction: 'in' | 'out') => {
    if (status === 'missed') return '🔴';
    if (status === 'voicemail') return '🟡';
    return '🟢';
  };
  
  return (
    <div className="border-t border-slate-800 mt-3 pt-3">
      <button 
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2 hover:text-slate-200 transition-colors w-full"
      >
        📞 {drillDown.summary.calls} calls · {drillDown.summary.callMinutes} min
        <span className="ml-auto text-[10px] text-slate-500">[click to {isExpanded ? 'collapse' : 'expand'}]</span>
      </button>
      
      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <div className="border-b border-slate-700/50 mb-2"></div>
          {drillDown.calls.map((call, index) => (
            <div key={index} className="text-xs">
              <div 
                className="flex items-center gap-2 py-1.5 hover:bg-slate-800/30 rounded cursor-pointer"
                onClick={() => toggleSummary(index)}
              >
                <span>{getCallIcon(call.status, call.direction)}</span>
                <span className="text-slate-500 w-16 flex-shrink-0">{formatTime(call.time)}</span>
                <span className="text-slate-400">{call.direction === 'in' ? '←' : '→'}</span>
                <span className="text-slate-200 font-medium">
                  {call.contact || (call.phone ? call.phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') : 'Unknown')}
                </span>
                {call.contact && call.phone && (
                  <span className="text-slate-600 text-[10px]">{call.phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}</span>
                )}
                <span className="text-slate-400">{call.durationText}</span>
                <span className={`ml-auto text-[10px] ${call.status === 'completed' ? 'text-green-500' : call.status === 'missed' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {call.status === 'completed' ? '✓' : call.status === 'missed' ? '✗ missed' : call.status}
                </span>
                {call.summary && <span className="text-slate-600 text-[10px]">▼</span>}
              </div>
              
              <div className="ml-4 mt-1 text-[11px] leading-relaxed">
                {call.summary ? (
                  <>
                    <p className="text-slate-500 italic">"{call.summary}"</p>
                    {call.nextSteps && call.nextSteps.length > 0 && (
                      <p className="mt-1 text-slate-500">→ Next: {call.nextSteps.join(', ')}</p>
                    )}
                  </>
                ) : (
                  <span className="text-slate-600 italic">No summary (call too short)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SmsDetailPanel({ drillDown, isExpanded, onToggle }: { drillDown: DayDrillDown; isExpanded: boolean; onToggle: () => void }) {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  
  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true,
      timeZone: 'America/New_York'
    });
  };

  const toggleMessage = (index: number) => {
    const next = new Set(expandedMessages);
    if (next.has(index)) next.delete(index); else next.add(index);
    setExpandedMessages(next);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '';
    // Format +1XXXXXXXXXX to (XXX) XXX-XXXX
    const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
  };
  
  return (
    <div className="border-t border-slate-800 mt-3 pt-3">
      <button 
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2 hover:text-slate-200 transition-colors w-full"
      >
        💬 {drillDown.summary.smsOut + drillDown.summary.smsIn} SMS · {drillDown.summary.smsOut} sent · {drillDown.summary.smsIn} received
        <span className="ml-auto text-[10px] text-slate-500">[click to collapse]</span>
      </button>
      
      {isExpanded && (
        <div className="space-y-0.5 max-h-96 overflow-y-auto">
          <div className="border-b border-slate-700/50 mb-2"></div>
          {drillDown.sms.map((sms, index) => {
            const isLong = (sms.body || '').length > 100;
            const isExpanded = expandedMessages.has(index);
            const displayBody = !sms.body ? '(empty)' : (isLong && !isExpanded) ? sms.body.slice(0, 100) + '...' : sms.body;
            
            return (
              <div key={index} className="py-1.5 text-xs border-b border-slate-800/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${sms.direction === 'out' ? 'text-blue-400' : 'text-green-400'}`}>
                    {sms.direction === 'out' ? '→ Sent' : '← Received'}
                  </span>
                  <span className="text-slate-500">{formatTime(sms.time)}</span>
                  <span className="text-slate-300 font-medium">
                    {sms.contact || formatPhone(sms.phone) || 'Unknown'}
                  </span>
                  {sms.contact && sms.phone && (
                    <span className="text-slate-600">{formatPhone(sms.phone)}</span>
                  )}
                </div>
                <div 
                  className={`mt-1 text-slate-400 leading-relaxed whitespace-pre-wrap ${isLong ? 'cursor-pointer hover:text-slate-300' : ''}`}
                  onClick={() => isLong && toggleMessage(index)}
                >
                  {displayBody}
                  {isLong && !isExpanded && <span className="text-accent ml-1 text-[10px]">[show more]</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SellerCard({ seller, period }: { seller: TeamSeller; period: string }) {
  const hasPhoneData = seller.today !== null;
  const lastActivityTime = seller.today?.lastActivity ? timeAgo(seller.today.lastActivity) : null;
  const [drillDownData, setDrillDownData] = useState<DayDrillDown | null>(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [expandedCalls, setExpandedCalls] = useState(false);
  const [expandedSms, setExpandedSms] = useState(false);
  
  // Signal badges logic
  const todayMissedCalls = drillDownData?.summary.missedCalls || 0;
  
  // Check for unanswered SMS (inbound SMS without outbound reply to same contact)
  const getUnansweredSmsCount = () => {
    if (!drillDownData?.sms) return 0;
    
    const contactReplies = new Map<string, { hasInbound: boolean; hasOutbound: boolean }>();
    
    drillDownData.sms.forEach(sms => {
      const contact = sms.contact || sms.phone;
      if (!contact) return;
      
      if (!contactReplies.has(contact)) {
        contactReplies.set(contact, { hasInbound: false, hasOutbound: false });
      }
      
      const entry = contactReplies.get(contact)!;
      if (sms.direction === 'in') entry.hasInbound = true;
      if (sms.direction === 'out') entry.hasOutbound = true;
    });
    
    return Array.from(contactReplies.values())
      .filter(entry => entry.hasInbound && !entry.hasOutbound).length;
  };
  
  const unansweredSms = getUnansweredSmsCount();
  const unansweredEmails = (seller as any).emailStats?.unanswered || 0;
  
  // Get the right date based on the current period view
  const getDateForPeriod = (which: 'today' | 'yesterday') => {
    const now = new Date();
    const etNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    if (which === 'yesterday') {
      etNow.setDate(etNow.getDate() - 1);
    }
    return etNow.toISOString().slice(0, 10);
  };

  const handleCallsClick = async (dateOverride?: string) => {
    const date = dateOverride || (period === 'yesterday' ? getDateForPeriod('yesterday') : getDateForPeriod('today'));
    
    // If already showing calls for this date, toggle off
    if (expandedCalls && drillDownData?.date === date) {
      setExpandedCalls(false);
      return;
    }
    
    setExpandedSms(false);
    setDrillDownLoading(true);
    try {
      const data = await getDayDrillDown(seller.name, date);
      setDrillDownData(data);
      setExpandedCalls(true);
    } catch (error) {
      console.error('Failed to fetch drill-down:', error);
    } finally {
      setDrillDownLoading(false);
    }
  };
  
  const handleSmsClick = async (dateOverride?: string) => {
    const date = dateOverride || (period === 'yesterday' ? getDateForPeriod('yesterday') : getDateForPeriod('today'));
    
    // If already showing SMS for this date, toggle off
    if (expandedSms && drillDownData?.date === date) {
      setExpandedSms(false);
      return;
    }
    
    setExpandedCalls(false);
    setDrillDownLoading(true);
    try {
      const data = await getDayDrillDown(seller.name, date);
      setDrillDownData(data);
      setExpandedSms(true);
    } catch (error) {
      console.error('Failed to fetch drill-down:', error);
    } finally {
      setDrillDownLoading(false);
    }
  };
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <span className="text-accent font-bold">
              {seller.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{seller.name}</h3>
            <span className="text-sm text-gray-400">{seller.role}</span>
            {/* Signal Badges */}
            <div className="flex items-center gap-1 mt-1">
              {todayMissedCalls > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  {todayMissedCalls} missed calls
                </span>
              )}
              {unansweredSms > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  {unansweredSms} unanswered SMS
                </span>
              )}
              {unansweredEmails > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Mail size={10} />
                  {unansweredEmails} unanswered emails
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
            {seller.role}
          </span>
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-700">
        {/* Period/Today Column */}
        <div>
          {period === 'today' ? (
            <>
              <h4 className="text-sm font-medium text-gray-300 mb-2">TODAY</h4>
              <div className="space-y-2">
                {hasPhoneData ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Phone size={14} />
                      <button 
                        onClick={handleCallsClick}
                        className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted"
                        disabled={drillDownLoading}
                      >
                        {seller.today!.calls} calls
                      </button>
                      {drillDownLoading && <span className="text-xs text-slate-500">loading...</span>}
                      <ActivityComparison today={seller.today!.calls} yesterday={seller.yesterday!.calls} type="calls" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock size={14} />
                      <span>{seller.today!.callMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <MessageSquare size={14} />
                      <button 
                        onClick={handleSmsClick}
                        className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted"
                        disabled={drillDownLoading}
                      >
                        {seller.today!.smsOut} SMS sent
                      </button>
                      <ActivityComparison today={seller.today!.smsOut} yesterday={seller.yesterday!.smsOut} type="sms" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Download size={14} />
                      <button 
                        onClick={handleSmsClick}
                        className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted"
                        disabled={drillDownLoading}
                      >
                        {seller.today!.smsIn} SMS received
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">No phone activity tracked</div>
                )}
              </div>
            </>
          ) : (
            <>
              <h4 className="text-sm font-medium text-gray-300 mb-2">{seller.period?.label || 'PERIOD'}</h4>
              <div className="space-y-2">
                {seller.period ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Phone size={14} />
                      <button onClick={() => handleCallsClick()} className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted" disabled={drillDownLoading}>
                        {seller.period.calls} calls
                      </button>
                      <span className="text-xs text-gray-500">({seller.period.avgCallsPerDay}/day)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock size={14} />
                      <span>{seller.period.callMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <MessageSquare size={14} />
                      <button onClick={() => handleSmsClick()} className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted" disabled={drillDownLoading}>
                        {seller.period.smsOut + seller.period.smsIn} messages
                      </button>
                      <span className="text-xs text-gray-500">({seller.period.avgSmsPerDay}/day)</span>
                    </div>
                    <DailyBreakdown dailyBreakdown={seller.period.dailyBreakdown} />
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">No historical data</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Yesterday/Today Column */}
        <div>
          {period === 'today' ? (
            <>
              <h4 className="text-sm font-medium text-gray-300 mb-2">YESTERDAY</h4>
              <div className="space-y-2">
                {hasPhoneData ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone size={14} />
                      <button onClick={() => handleCallsClick(getDateForPeriod('yesterday'))} className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted" disabled={drillDownLoading}>
                        {seller.yesterday!.calls} calls
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={14} />
                      <span>{seller.yesterday!.callMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MessageSquare size={14} />
                      <button onClick={() => handleSmsClick(getDateForPeriod('yesterday'))} className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted" disabled={drillDownLoading}>
                        {seller.yesterday!.smsOut} SMS sent
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Download size={14} />
                      <button onClick={() => handleSmsClick(getDateForPeriod('yesterday'))} className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted" disabled={drillDownLoading}>
                        {seller.yesterday!.smsIn} SMS received
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">-</div>
                )}
              </div>
            </>
          ) : (
            <>
              <h4 className="text-sm font-medium text-gray-300 mb-2">TODAY</h4>
              <div className="space-y-2">
                {hasPhoneData ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone size={14} />
                      <span>{seller.today!.calls} calls</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={14} />
                      <span>{seller.today!.callMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MessageSquare size={14} />
                      <span>{seller.today!.smsOut + seller.today!.smsIn} messages</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">-</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pipeline Column */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">PIPELINE</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle size={14} />
              <span>{seller.pipeline.activeDeals} deals</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-green-400 font-medium">{formatCurrency(seller.pipeline.pipelineValue)}</span>
              <span>value</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>{seller.pipeline.newLeads} new leads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Activity & Responsiveness */}
      <div className="space-y-3">
        {hasPhoneData && seller.today?.lastActivityText && (
          <div className="flex items-start gap-2">
            <span className="text-accent text-sm">⚡</span>
            <div className="flex-1 text-sm text-gray-300">
              <span className="font-medium">Last: </span>
              <span>{seller.today.lastActivityText}</span>
              {lastActivityTime && (
                <span className="text-gray-400 ml-1">— {lastActivityTime}</span>
              )}
            </div>
          </div>
        )}
        
        {hasPhoneData && seller.responsiveness && (
          <ResponsivenessBadge 
            avgResponseTimeHours={seller.responsiveness.avgResponseTimeHours}
            unansweredCount={seller.responsiveness.unansweredCount}
          />
        )}
        
        {seller.error && (
          <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">
            Error: {seller.error}
          </div>
        )}
      </div>

      {/* Signals Section */}
      <SignalsSection signals={seller.signals} />
      
      {/* Loading indicator */}
      {drillDownLoading && (
        <div className="border-t border-slate-800 mt-3 pt-3 text-xs text-slate-400 animate-pulse">
          Loading call/SMS details...
        </div>
      )}

      {/* Drill-down Panels */}
      {drillDownData && expandedCalls && !drillDownLoading && (
        <CallDetailPanel 
          drillDown={drillDownData}
          isExpanded={true}
          onToggle={() => setExpandedCalls(false)}
        />
      )}
      
      {drillDownData && expandedSms && !drillDownLoading && (
        <SmsDetailPanel 
          drillDown={drillDownData}
          isExpanded={true}
          onToggle={() => setExpandedSms(false)}
        />
      )}
      
      {/* Debug: show if data loaded but nothing expanded */}
      {drillDownData && !expandedCalls && !expandedSms && !drillDownLoading && (
        <div className="border-t border-slate-800 mt-3 pt-3 text-[10px] text-slate-600">
          Data loaded for {drillDownData.date}: {drillDownData.calls?.length || 0} calls, {drillDownData.sms?.length || 0} SMS
          <button onClick={() => setExpandedCalls(true)} className="ml-2 text-accent underline">Show calls</button>
          <button onClick={() => setExpandedSms(true)} className="ml-2 text-accent underline">Show SMS</button>
        </div>
      )}
    </div>
  );
}

function isPhoneDay(day: HistoryDayPhone | HistoryDaySDR): day is HistoryDayPhone {
  return 'calls' in day;
}

function HistorySellerCard({ seller }: { seller: HistorySeller }) {
  const hasPhoneDays = seller.days.length > 0 && isPhoneDay(seller.days[0]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<DayDrillDown | null>(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  
  // Compute averages for phone sellers
  let avgCalls = 0, avgSms = 0;
  if (hasPhoneDays) {
    const phoneDays = seller.days as HistoryDayPhone[];
    const weekdays = phoneDays.filter(d => !['Sat', 'Sun'].includes(d.dayOfWeek));
    if (weekdays.length > 0) {
      avgCalls = weekdays.reduce((s, d) => s + d.calls, 0) / weekdays.length;
      avgSms = weekdays.reduce((s, d) => s + d.smsOut, 0) / weekdays.length;
    }
  }
  
  const fetchDrillDown = async (date: string) => {
    if (expandedRow === date) {
      setExpandedRow(null);
      setDrillDownData(null);
      return;
    }
    
    setDrillDownLoading(true);
    setExpandedRow(date);
    try {
      const data = await getDayDrillDown(seller.name, date);
      setDrillDownData(data);
    } catch (error) {
      console.error('Failed to fetch drill-down:', error);
      setDrillDownData(null);
    } finally {
      setDrillDownLoading(false);
    }
  };
  
  const getRowColor = (day: HistoryDayPhone | HistoryDaySDR) => {
    const isWeekend = ['Sat', 'Sun'].includes(day.dayOfWeek);
    if (isWeekend) return 'bg-slate-800/40 text-slate-500';
    if (isPhoneDay(day)) {
      const totalActivity = day.calls + day.smsOut + day.smsIn + ((day as any).dealsCreated || 0);
      if (totalActivity === 0) return 'bg-red-500/10 text-red-400';
      if (day.calls > avgCalls && day.smsOut > avgSms) return 'bg-green-500/10 text-green-300';
    } else {
      if (day.dealsCreated === 0) return 'bg-red-500/10 text-red-400';
      if (day.dealsCreated > 1) return 'bg-green-500/10 text-green-300';
    }
    return 'text-slate-300';
  };
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <span className="text-accent font-bold">{seller.name[0]}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{seller.name}</h3>
            <span className="text-sm text-gray-400">{seller.role}</span>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
          {seller.role}
        </span>
      </div>
      
      {/* Pipeline Summary */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700 text-sm text-gray-300">
        <span><CheckCircle size={14} className="inline mr-1" />{seller.pipeline.activeDeals} deals</span>
        <span className="text-green-400 font-medium">{formatCurrency(seller.pipeline.pipelineValue)}</span>
        <span>{seller.pipeline.newLeads} leads</span>
      </div>
      
      {/* Daily Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left py-1.5 pr-2">Date</th>
              <th className="text-left py-1.5 pr-2">Day</th>
              <>
                <th className="text-right py-1.5 px-1">📞 Calls</th>
                <th className="text-right py-1.5 px-1">⏱ Min</th>
                <th className="text-right py-1.5 px-1">💬 Out</th>
                <th className="text-right py-1.5 px-1">📥 In</th>
                <th className="text-right py-1.5 px-1">👥</th>
                {seller.role === 'SDR' && <th className="text-right py-1.5 px-1">🆕 Deals</th>}
              </>
            </tr>
          </thead>
          <tbody>
            {seller.days.map((day) => (
              <>
                <tr key={day.date} className={`border-b border-slate-800/50 ${getRowColor(day)}`}>
                  <td className="py-1.5 pr-2 font-mono">{day.date.slice(5)}</td>
                  <td className="py-1.5 pr-2">{day.dayOfWeek}</td>
                  <>
                    <td className="text-right py-1.5 px-1">
                      {isPhoneDay(day) && day.calls > 0 ? (
                        <button 
                          onClick={() => fetchDrillDown(day.date)}
                          className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted"
                          disabled={drillDownLoading && expandedRow === day.date}
                        >
                          {day.completedCalls}/{day.calls}
                        </button>
                      ) : (
                        isPhoneDay(day) ? `${day.completedCalls}/${day.calls}` : '0/0'
                      )}
                    </td>
                    <td className="text-right py-1.5 px-1">{isPhoneDay(day) ? day.callMinutes : 0}</td>
                    <td className="text-right py-1.5 px-1">
                      {isPhoneDay(day) && (day.smsOut + day.smsIn) > 0 ? (
                        <button 
                          onClick={() => fetchDrillDown(day.date)}
                          className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted"
                          disabled={drillDownLoading && expandedRow === day.date}
                        >
                          {day.smsOut}
                        </button>
                      ) : (
                        isPhoneDay(day) ? day.smsOut : 0
                      )}
                    </td>
                    <td className="text-right py-1.5 px-1">
                      {isPhoneDay(day) && (day.smsOut + day.smsIn) > 0 ? (
                        <button 
                          onClick={() => fetchDrillDown(day.date)}
                          className="hover:text-accent transition-colors cursor-pointer underline decoration-dotted"
                          disabled={drillDownLoading && expandedRow === day.date}
                        >
                          {day.smsIn}
                        </button>
                      ) : (
                        isPhoneDay(day) ? day.smsIn : 0
                      )}
                    </td>
                    <td className="text-right py-1.5 px-1">{isPhoneDay(day) ? day.uniqueContacts : 0}</td>
                    {seller.role === 'SDR' && <td className="text-right py-1.5 px-1">{(day as any).dealsCreated || 0}</td>}
                  </>
                </tr>
                
                {/* Expanded drill-down row */}
                {expandedRow === day.date && (
                  <tr>
                    <td colSpan={seller.role === 'SDR' ? 8 : 7} className="py-0 px-4 bg-slate-800/30">
                      <div className="py-3">
                        {drillDownLoading ? (
                          <div className="text-center text-slate-400 text-sm py-4">
                            Loading...
                          </div>
                        ) : drillDownData ? (
                          <div className="space-y-3">
                            {drillDownData.calls.length > 0 && (
                              <CallDetailPanel 
                                drillDown={drillDownData}
                                isExpanded={true}
                                onToggle={() => {}}
                              />
                            )}
                            {drillDownData.sms.length > 0 && (
                              <SmsDetailPanel 
                                drillDown={drillDownData}
                                isExpanded={true}
                                onToggle={() => {}}
                              />
                            )}
                            {drillDownData.calls.length === 0 && drillDownData.sms.length === 0 && (
                              <div className="text-center text-slate-500 text-sm py-2">
                                No call or SMS details available for this date.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-red-400 text-sm py-2">
                            Failed to load drill-down data.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
          {hasPhoneDays && (
            <tfoot>
              <tr className="border-t border-slate-700 text-slate-400 font-semibold">
                <td className="py-2 pr-2" colSpan={2}>Total / Avg</td>
                <td className="text-right py-2 px-1">
                  {(seller.days as HistoryDayPhone[]).reduce((s, d) => s + d.completedCalls, 0)}/
                  {(seller.days as HistoryDayPhone[]).reduce((s, d) => s + d.calls, 0)}
                </td>
                <td className="text-right py-2 px-1">
                  {(seller.days as HistoryDayPhone[]).reduce((s, d) => s + d.callMinutes, 0)}
                </td>
                <td className="text-right py-2 px-1">
                  {(seller.days as HistoryDayPhone[]).reduce((s, d) => s + d.smsOut, 0)}
                </td>
                <td className="text-right py-2 px-1">
                  {(seller.days as HistoryDayPhone[]).reduce((s, d) => s + d.smsIn, 0)}
                </td>
                <td className="text-right py-2 px-1">—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      
      {seller.error && (
        <div className="mt-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">
          Error: {seller.error}
        </div>
      )}
    </div>
  );
}

function getTodayET(): string {
  // Get today's date in US Eastern time
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return et.toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayET();
  const yesterday = shiftDate(today, -1);
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (dateStr === today) return `Today — ${weekday}, ${month}`;
  if (dateStr === yesterday) return `Yesterday — ${weekday}, ${month}`;
  return `${weekday}, ${month}`;
}

export default function Team() {
  const [historyData, setHistoryData] = useState<TeamHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayET());

  const isToday = selectedDate === getTodayET();

  const fetchData = async (date: string = selectedDate) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getTeamHistory(date, date);
      if (result) {
        setHistoryData(result);
      } else {
        setError('Failed to load team data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navigateDate = (days: number) => {
    const newDate = shiftDate(selectedDate, days);
    // Don't go into the future
    if (newDate > getTodayET()) return;
    setSelectedDate(newDate);
    fetchData(newDate);
  };

  const jumpToToday = () => {
    const today = getTodayET();
    setSelectedDate(today);
    fetchData(today);
  };

  const handleDatePick = (dateStr: string) => {
    if (dateStr > getTodayET()) return;
    setSelectedDate(dateStr);
    fetchData(dateStr);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error is shown inline below the period selector instead of replacing the page

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Activity</h1>
            <p className="text-gray-400 mt-1">Real-time activity monitoring for all sales team members</p>
          </div>
          <div className="flex items-center gap-4">
            {historyData?.updatedAt && (
              <span className="text-sm text-gray-400">
                Updated {timeAgo(historyData.updatedAt)}
              </span>
            )}
            <button 
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors"
            title="Previous day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              max={getTodayET()}
              onChange={(e) => handleDatePick(e.target.value)}
              className="bg-slate-800 text-sm text-slate-300 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-accent [color-scheme:dark]"
            />
            <span className="text-lg font-semibold text-white">
              {formatDateLabel(selectedDate)}
            </span>
          </div>

          <button
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className={`p-2 rounded-lg transition-colors ${
              isToday 
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' 
                : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
            }`}
            title="Next day"
          >
            <ChevronRight size={18} />
          </button>

          {!isToday && (
            <button
              onClick={jumpToToday}
              className="px-3 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-sm font-medium transition-colors border border-accent/30"
            >
              Today
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-red-400 font-medium">Error: </span>
              <span className="text-red-300">{error}</span>
            </div>
            <button onClick={() => { setError(null); fetchData(selectedDate); }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Seller Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {historyData?.sellers?.map((seller) => (
            <HistorySellerCard key={seller.id} seller={seller} />
          ))}
          {!historyData?.sellers?.length && !loading && (
            <div className="text-center py-12 text-gray-400 col-span-2">
              <p>No team data available for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}