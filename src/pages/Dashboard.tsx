import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import IntelSummaryRow from '../components/intelligence/IntelSummaryRow';
import InsightSection from '../components/intelligence/InsightSection';
import SellerScoreCards from '../components/intelligence/SellerScoreCards';
import SellerCard from '../components/dashboard/SellerCard';
import AlertFeed from '../components/dashboard/AlertFeed';
import DealDrawer from '../components/deal/DealDrawer';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import { getSellers } from '../services/sellers';
import { getAlerts } from '../services/alerts';
import { getIntelligence } from '../services/intelligence';
import { getDealById } from '../services/deals';
import { useApp } from '../context/AppContext';
import type { Seller, Alert, IntelligenceData, Deal } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { refreshKey, setAlertCount } = useApp();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drawerDeal, setDrawerDeal] = useState<Deal | null>(null);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  async function loadData() {
    try {
      setError(false);
      const [sellersData, alertsData, intelData] = await Promise.all([
        getSellers(),
        getAlerts(),
        getIntelligence(),
      ]);
      setSellers(sellersData);
      setAlerts(alertsData);
      setIntel(intelData);
      setAlertCount(alertsData.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDeal(dealId: string) {
    const deal = await getDealById(dealId);
    if (deal) setDrawerDeal(deal);
  }

  if (error) return <ErrorState onRetry={loadData} />;

  return (
    <div>
      <Header title="Intelligence" subtitle="DECA Euro Windows - Actionable Sales Insights" />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : intel ? (
        <IntelSummaryRow summary={intel.summary} winsCount={intel.wins.length} />
      ) : null}

      {loading ? (
        <div className="space-y-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      ) : intel ? (
        <div className="space-y-4 mb-6">
          <InsightSection
            title="Urgent -- Act Now"
            icon={Flame}
            insights={intel.urgent}
            accentColor="red"
            bgTint="bg-red-950/20"
            onViewDeal={handleViewDeal}
          />
          <InsightSection
            title="Opportunities"
            icon={DollarSign}
            insights={intel.opportunities}
            accentColor="emerald"
            bgTint="bg-emerald-950/20"
            onViewDeal={handleViewDeal}
          />
          <InsightSection
            title="At Risk"
            icon={AlertTriangle}
            insights={intel.risks}
            accentColor="amber"
            bgTint="bg-amber-950/20"
            onViewDeal={handleViewDeal}
          />
          <InsightSection
            title="Positive Momentum"
            icon={TrendingUp}
            insights={intel.wins}
            accentColor="sky"
            bgTint="bg-sky-950/20"
            onViewDeal={handleViewDeal}
            defaultCollapsed
          />
        </div>
      ) : null}

      {!loading && intel && Object.keys(intel.sellerScores).length > 0 && (
        <div className="mb-6">
          <SellerScoreCards scores={intel.sellerScores} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} className="h-52" />
            ))
          : sellers.map((seller) => (
              <SellerCard
                key={seller.id}
                seller={seller}
                onClick={() => navigate(`/sellers/${seller.id}`)}
              />
            ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent Alerts
        </h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <AlertFeed
            alerts={alerts.slice(0, 8)}
            onAlertClick={(alert) => {
              if (alert.deal_id) handleViewDeal(alert.deal_id);
            }}
          />
        )}
      </div>

      <DealDrawer deal={drawerDeal} onClose={() => setDrawerDeal(null)} />
    </div>
  );
}
