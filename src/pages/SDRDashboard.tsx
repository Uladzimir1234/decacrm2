import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Search,
} from 'lucide-react';
import Header from '../components/Header';
import { SkeletonCard, SkeletonList } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import SDRStatusFilter from '../components/sdr/SDRStatusFilter';
import SDRContactCard from '../components/sdr/SDRContactCard';
import SDRContactDrawer from '../components/sdr/SDRContactDrawer';
import { getSellerContacts } from '../services/contacts';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import type { Seller, SDRContact, SDRContactStatus } from '../types';

interface SDRDashboardProps {
  seller: Seller;
}

type SortKey = 'riskLevel' | 'created' | 'lastContacted' | 'name';

export default function SDRDashboard({ seller }: SDRDashboardProps) {
  const { refreshKey } = useApp();
  const [contacts, setContacts] = useState<SDRContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SDRContactStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('riskLevel');
  const [selectedContact, setSelectedContact] = useState<SDRContact | null>(null);
  const closeDrawer = useCallback(() => setSelectedContact(null), []);

  useEffect(() => {
    loadContacts();
  }, [seller.id, refreshKey]);

  async function loadContacts() {
    try {
      setError(false);
      const data = await getSellerContacts(seller.id);
      setContacts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<SDRContactStatus, number> = { new: 0, contacted: 0, assigned: 0 };
    contacts.forEach((ct) => {
      if (ct.status in c) c[ct.status]++;
    });
    return c;
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.company.toLowerCase().includes(s)
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    const riskOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
    switch (sortBy) {
      case 'riskLevel':
        result.sort((a, b) => (riskOrder[a.riskLevel] ?? 3) - (riskOrder[b.riskLevel] ?? 3));
        break;
      case 'created':
        result.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;
      case 'lastContacted':
        result.sort((a, b) => {
          if (!a.lastContacted && !b.lastContacted) return 0;
          if (!a.lastContacted) return -1;
          if (!b.lastContacted) return 1;
          return new Date(a.lastContacted).getTime() - new Date(b.lastContacted).getTime();
        });
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [contacts, search, statusFilter, sortBy]);

  if (error) return <ErrorState onRetry={loadContacts} />;

  return (
    <div>
      <Header
        title={seller.name}
        subtitle={`SDR -- ${contacts.length} contacts`}
      />

      {loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonList count={5} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={Users}
              label="Total Contacts"
              value={contacts.length.toString()}
              color="text-accent-light"
            />
            <StatCard
              icon={AlertCircle}
              label="New (Uncontacted)"
              value={counts.new.toString()}
              color="text-red-400"
            />
            <StatCard
              icon={MessageSquare}
              label="In Progress"
              value={counts.contacted.toString()}
              color="text-amber-400"
            />
            <StatCard
              icon={ArrowRight}
              label="Assigned"
              value={counts.assigned.toString()}
              color="text-emerald-400"
            />
          </div>

          <SDRStatusFilter
            active={statusFilter}
            counts={counts}
            onSelect={setStatusFilter}
          />

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search contacts by name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark w-full pl-8 text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="input-dark text-sm"
            >
              <option value="riskLevel">Sort: Risk Level</option>
              <option value="created">Sort: Date Created</option>
              <option value="lastContacted">Sort: Last Contacted</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <SDRContactCard
                key={contact.id}
                contact={contact}
                onClick={() => setSelectedContact(contact)}
              />
            ))}
            {filteredContacts.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-sm text-gray-500">
                  No contacts match your filters
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <SDRContactDrawer contact={selectedContact} onClose={closeDrawer} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={cn(color)} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold text-gray-100">{value}</span>
    </div>
  );
}
