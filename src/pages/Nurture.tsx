import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Loader2, Search, Filter } from 'lucide-react';
import Header from '../components/Header';
import NurtureStatsBar from '../components/nurture/NurtureStatsBar';
import CampaignTable from '../components/nurture/CampaignTable';
import TemperatureBar from '../components/nurture/TemperatureBar';
import LeadRow from '../components/nurture/LeadRow';
import DealDrawer from '../components/deal/DealDrawer';
import LeadProfile from '../components/nurture/LeadProfile';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import { getNurtureStatus, getNurtureLeads } from '../services/nurture';
import { getDealById } from '../services/deals';
import { useApp } from '../context/AppContext';
import type { NurtureStatus, Deal } from '../types';
import type { LeadRecoveryData, Lead } from '../services/nurture';

export default function Nurture() {
  const { setNurtureCount } = useApp();
  const [status, setStatus] = useState<NurtureStatus | null>(null);
  const [leadData, setLeadData] = useState<LeadRecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadLoading, setLeadLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedLeadEmail, setSelectedLeadEmail] = useState<string | null>(null);
  const [temperatureFilter, setTemperatureFilter] = useState<'all' | 'hot' | 'warm' | 'cooling' | 'cold'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const closeDrawer = useCallback(() => setSelectedDeal(null), []);
  const closeLeadProfile = useCallback(() => setSelectedLeadEmail(null), []);

  async function handleContactClick(dealId: string | null) {
    if (!dealId) return;
    const deal = await getDealById(dealId);
    if (deal) setSelectedDeal(deal);
  }

  function handleLeadClick(email: string) {
    setSelectedLeadEmail(email);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setLeadLoading(true);
    
    // Load both status (for stats) and leads data in parallel
    const [statusData, leadsData] = await Promise.all([
      getNurtureStatus(),
      getNurtureLeads()
    ]);
    
    setStatus(statusData);
    setLeadData(leadsData);
    
    if (statusData) {
      setNurtureCount(statusData.activeEnrollments);
    }
    
    setLoading(false);
    setLeadLoading(false);
  }

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    if (!leadData) return [];
    
    let leads = leadData.leads;
    
    // Apply temperature filter
    if (temperatureFilter !== 'all') {
      leads = leads.filter(lead => lead.temperature === temperatureFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      leads = leads.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query)
      );
    }
    
    return leads;
  }, [leadData, temperatureFilter, searchQuery]);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'hot', label: 'Hot' },
    { key: 'warm', label: 'Warm' },
    { key: 'cooling', label: 'Cooling' },
    { key: 'cold', label: 'Cold' },
  ] as const;

  return (
    <div>
      <Header title="Lead Recovery Dashboard" subtitle="Temperature-based lead engagement tracking" />

      {/* Refresh Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-accent/15 border border-accent/30 text-accent-light hover:bg-accent/25 hover:border-accent/50 transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {/* Temperature cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} className="h-20" />
            ))}
          </div>
          {/* Stats bar skeleton */}
          <SkeletonCard className="h-24" />
          {/* Leads table skeleton */}
          <SkeletonCard className="h-64" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Temperature Summary Bar */}
          {leadData && (
            <TemperatureBar
              summary={leadData.summary}
              onFilterChange={setTemperatureFilter}
              activeFilter={temperatureFilter}
            />
          )}

          {/* Email Stats Bar (from existing data) */}
          {status && (
            <NurtureStatsBar
              totalSent={status.totalSent || 0}
              totalDelivered={status.totalDelivered || 0}
              totalOpened={status.totalOpened || 0}
              totalClicked={status.totalClicked || 0}
              openRate={status.openRate || 0}
              clickRate={status.clickRate || 0}
              totalBounced={status.totalBounced || 0}
              totalUnsubscribed={status.totalUnsubscribed || 0}
            />
          )}

          {/* Lead Recovery Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Lead Recovery Board</h2>
              <div className="text-sm text-gray-400">
                {filteredLeads.length} of {leadData?.leads.length || 0} leads
              </div>
            </div>

            {leadLoading ? (
              <SkeletonCard className="h-64" />
            ) : leadData ? (
              <div className="card p-0 overflow-hidden">
                {/* Search and Filter Controls */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Box */}
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                      {filterTabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setTemperatureFilter(tab.key)}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                            temperatureFilter === tab.key
                              ? 'bg-accent text-white'
                              : 'text-gray-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leads List */}
                <div className="p-4">
                  {filteredLeads.length > 0 ? (
                    <div className="space-y-3">
                      {filteredLeads.map((lead) => (
                        <LeadRow
                          key={lead.email}
                          lead={lead}
                          onContactClick={handleContactClick}
                          onLeadClick={handleLeadClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Filter size={48} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400 mb-2">No leads found</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery ? 'Try a different search term' : 'Try adjusting your filters'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-500 mb-3">Unable to load lead data</p>
                <button
                  onClick={loadData}
                  className="text-sm text-accent-light hover:text-accent transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Campaign Analytics (existing CampaignTable) */}
          {status?.campaigns && status.campaigns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Campaign Analytics</h2>
              <CampaignTable campaigns={status.campaigns} onContactClick={handleContactClick} />
            </div>
          )}
        </div>
      )}

      <DealDrawer deal={selectedDeal} onClose={closeDrawer} />
      <LeadProfile email={selectedLeadEmail} onClose={closeLeadProfile} />
    </div>
  );
}