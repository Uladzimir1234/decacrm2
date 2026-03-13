import {
  User,
  Mail,
  Phone,
  Smartphone,
  Building2,
  MapPin,
  Globe,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { EnrichedContact, EnrichedCompany, Deal } from '../../types';

interface EnrichedContactCardProps {
  contact: EnrichedContact;
  company: EnrichedCompany | null;
  existingDeal: Deal;
}

function isNewInfo(enrichedVal: string | null, existingVal: string | null | undefined): boolean {
  if (!enrichedVal) return false;
  if (!existingVal) return true;
  return enrichedVal.toLowerCase().trim() !== existingVal.toLowerCase().trim();
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  isNew,
}: {
  icon: typeof User;
  label: string;
  value: string | null;
  href?: string;
  isNew?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 group">
      <Icon size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider block">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {href ? (
            <a
              href={href}
              className="text-sm text-accent-light hover:text-accent transition-colors truncate"
            >
              {value}
            </a>
          ) : (
            <span className="text-sm text-gray-300 truncate">{value}</span>
          )}
          {isNew && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
              New
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EnrichedContactCard({
  contact,
  company,
  existingDeal,
}: EnrichedContactCardProps) {
  const location = [company?.city, company?.state].filter(Boolean).join(', ');

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Enriched Contact
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <InfoRow
          icon={User}
          label="Full Name"
          value={contact.fullName}
          isNew={isNewInfo(contact.fullName, existingDeal.contact_name)}
        />
        <InfoRow
          icon={Mail}
          label="Email"
          value={contact.email}
          href={contact.email ? `mailto:${contact.email}` : undefined}
          isNew={isNewInfo(contact.email, existingDeal.email)}
        />
        <InfoRow
          icon={Phone}
          label="Phone"
          value={contact.phone}
          href={contact.phone ? `tel:${contact.phone}` : undefined}
          isNew={isNewInfo(contact.phone, existingDeal.phone)}
        />
        <InfoRow
          icon={Smartphone}
          label="Mobile"
          value={contact.mobilePhone}
          href={contact.mobilePhone ? `tel:${contact.mobilePhone}` : undefined}
          isNew={!!contact.mobilePhone}
        />
        <InfoRow
          icon={Building2}
          label="Company"
          value={contact.company || company?.name || null}
          isNew={isNewInfo(contact.company || company?.name || null, existingDeal.company_name)}
        />
        {company?.domain && (
          <InfoRow
            icon={Globe}
            label="Domain"
            value={company.domain}
            href={`https://${company.domain}`}
            isNew
          />
        )}
        {location && (
          <InfoRow
            icon={MapPin}
            label="Location"
            value={location}
            isNew
          />
        )}
      </div>
    </div>
  );
}
