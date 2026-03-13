import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import ContactInfoCard from '../components/deal/ContactInfoCard';
import InteractionTimeline from '../components/deal/InteractionTimeline';
import AdminNotesSection from '../components/deal/AdminNotesSection';
import AnalysisCard from '../components/deal/AnalysisCard';
import QuickActionsCard from '../components/deal/QuickActionsCard';
import RemindersCard from '../components/deal/RemindersCard';
import DeepDiveButton from '../components/deal/DeepDiveButton';
import EnrichedContactCard from '../components/deal/EnrichedContactCard';
import EnrichedSummaryBar from '../components/deal/EnrichedSummaryBar';
import EnrichedTimeline from '../components/deal/EnrichedTimeline';
import CallHistoryAccordion from '../components/deal/CallHistoryAccordion';
import NurtureStatusBadge from '../components/nurture/NurtureStatusBadge';
import NurtureHistory from '../components/nurture/NurtureHistory';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import {
  getDealById,
  getDealInteractions,
  getDealAnalysis,
  getDealNotes,
  getDealReminders,
} from '../services/deals';
import { useApp } from '../context/AppContext';
import type {
  Deal,
  Interaction,
  DealAnalysis,
  AdminNote,
  Reminder,
  EnrichedProfile,
  LastContact,
} from '../types';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const { refreshKey } = useApp();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [lastContact, setLastContact] = useState<LastContact | null>(null);
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id, refreshKey]);

  async function loadData() {
    try {
      setError(false);
      const [dealData, interactionsResult, analysisData, notesData, remindersData] =
        await Promise.all([
          getDealById(id!),
          getDealInteractions(id!),
          getDealAnalysis(id!),
          getDealNotes(id!),
          getDealReminders(id!),
        ]);
      setDeal(dealData);
      setInteractions(interactionsResult.interactions);
      setLastContact(interactionsResult.lastContact);
      setAnalysis(analysisData);
      setNotes(notesData);
      setReminders(remindersData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (error) return <ErrorState onRetry={loadData} />;

  return (
    <div>
      <Header
        title={deal?.contact_name || 'Deal'}
        subtitle={deal?.company_name || undefined}
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-40" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-32" />
          </div>
        </div>
      ) : (
        deal && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <DeepDiveButton
                dealId={deal.id}
                onLoaded={setEnriched}
                onClear={() => setEnriched(null)}
              />
              <NurtureStatusBadge dealId={deal.id} />
            </div>

            {enriched && (
              <div className="space-y-4">
                <EnrichedContactCard
                  contact={enriched.contact}
                  company={enriched.company}
                  existingDeal={deal}
                />
                <EnrichedSummaryBar summary={enriched.summary} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 space-y-4">
                <ContactInfoCard deal={deal} lastContact={lastContact} onStageChange={loadData} />
                <CallHistoryAccordion dealId={deal.id} />
                {enriched ? (
                  <EnrichedTimeline profile={enriched} />
                ) : (
                  <InteractionTimeline interactions={interactions} />
                )}
                <NurtureHistory dealId={deal.id} />
                <AdminNotesSection
                  dealId={deal.id}
                  notes={notes}
                  onNoteAdded={loadData}
                />
              </div>
              <div className="lg:col-span-2 space-y-4">
                {analysis && <AnalysisCard analysis={analysis} />}
                <QuickActionsCard deal={deal} onAction={loadData} />
                <RemindersCard reminders={reminders} />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
