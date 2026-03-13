export interface Seller {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  created_at: string;
  role?: 'seller' | 'SDR';
  active_deals?: number;
  pipeline_value?: number;
  alert_count?: number;
  avg_response_time?: number;
  calls_this_week?: number[];
  close_rate?: number;
}

export type SDRContactStatus = 'new' | 'contacted' | 'assigned';

export interface SDRContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  state: string;
  source: string;
  sourceDetail: string;
  status: SDRContactStatus;
  riskLevel: 'red' | 'yellow' | 'green';
  assignedTo: string | null;
  assignedDealId: string | null;
  assignedDealStage: string | null;
  created: string;
  lastContacted: string | null;
  daysSinceCreated: number;
  daysSinceContact: number;
  numContactedNotes: number;
}

export interface SDRContactInteraction {
  id: string;
  type: 'call' | 'sms' | 'email' | 'note';
  icon: string;
  label: string;
  direction: 'inbound' | 'outbound';
  summary: string;
  callSummary?: string;
  duration?: number;
  date: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface SDRContactInteractionsResponse {
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  totalInteractions: number;
  breakdown: { calls: number; sms: number; emails: number; notes: number };
  interactions: SDRContactInteraction[];
}

export interface Deal {
  id: string;
  seller_id: string;
  contact_name: string;
  company_name: string | null;
  phone: string;
  email: string;
  amount: number;
  stage: string;
  risk_level: 'green' | 'yellow' | 'red';
  days_in_pipeline: number;
  days_in_stage: number;
  last_contact_date: string;
  last_interaction_type: string;
  created_at: string;
  updated_at: string;
  seller_name?: string;
}

export interface Interaction {
  id: string;
  deal_id: string;
  type: 'call' | 'sms' | 'email' | 'note';
  direction: 'inbound' | 'outbound';
  summary: string;
  callSummary?: string | null;
  duration: number | null;
  created_at: string;
}

export interface LastContact {
  date: string;
  type: 'call' | 'sms' | 'email';
  direction: 'inbound' | 'outbound';
  label: string;
  summary: string | null;
  duration: number | null;
}

export interface Alert {
  id: string;
  seller_id: string;
  deal_id: string | null;
  severity: 'red' | 'yellow';
  alert_type: 'no_response' | 'stale_deal' | 'stuck_stage';
  message: string;
  dismissed: boolean;
  created_at: string;
  seller_name?: string;
  deal_name?: string;
}

export interface AdminNote {
  id: string;
  deal_id: string;
  text: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  deal_id: string;
  reminder_date: string;
  text: string;
  status: 'active' | 'completed' | 'dismissed';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DashboardStats {
  total_active_deals: number;
  total_pipeline_value: number;
  alert_count: number;
  avg_response_time: number;
  calls_this_week: number;
  deals_closed_this_week: number;
}

export interface DealAnalysis {
  risk_score: 'green' | 'yellow' | 'red';
  days_since_contact: number;
  suggested_action: string;
  signals: string[];
}

export type Stage =
  | 'New Lead'
  | 'No Response'
  | 'Appointment Scheduled / Qualified'
  | 'Quote Sent'
  | 'Negotiating'
  | 'Decision Maker Brought In'
  | 'Contract Sent'
  | 'Closed Won'
  | 'Closed Lost';

export interface EnrichedDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  created: string;
  lastModified: string;
  riskLevel: 'green' | 'yellow' | 'red';
  daysInPipeline: number;
  daysInStage: number;
  owner: string;
}

export interface EnrichedContact {
  fullName: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  company: string | null;
}

export interface EnrichedCompany {
  name: string;
  domain: string | null;
  city: string | null;
  state: string | null;
}

export interface EnrichedNote {
  id: string;
  date: string;
  text: string;
}

export interface EnrichedEmail {
  id: string;
  date: string;
  subject: string;
  from: string;
  to: string;
  direction: string;
  body: string;
}

export interface EnrichedMeeting {
  id: string;
  title: string;
  startTime: string;
  body: string;
}

export interface EnrichedTask {
  id: string;
  subject: string;
  status: string;
  priority: string;
}

export interface EnrichedCall {
  id: string;
  date: string;
  direction: string;
  duration: number;
  status: string;
}

export interface EnrichedSMS {
  id: string;
  date: string;
  direction: string;
  text: string;
}

export interface EnrichedSummary {
  totalNotes: number;
  totalEmails: number;
  totalCalls: number;
  totalSMS: number;
  totalMeetings: number;
  totalTasks: number;
  enrichedAt: string;
}

export interface EnrichedProfile {
  deal: EnrichedDeal;
  contact: EnrichedContact;
  company: EnrichedCompany | null;
  notes: EnrichedNote[];
  emails: EnrichedEmail[];
  meetings: EnrichedMeeting[];
  tasks: EnrichedTask[];
  calls: EnrichedCall[];
  sms: EnrichedSMS[];
  summary: EnrichedSummary;
}

export interface NurtureSequence {
  id: string;
  name: string;
  steps: number;
  description?: string;
}

export interface EmailStatus {
  email: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
}

export interface EmailStats {
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
}

export interface NurtureEnrollment {
  dealId: string;
  sequence: string;
  step: number;
  totalSteps: number;
  enrolledAt: string;
  paused: boolean;
  contactName: string;
  completedSteps: string[];
  emailStatus?: EmailStatus;
  phone?: string;
  dealAmount?: number;
}

export interface NurtureCampaign {
  subject: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

export interface NurtureStatus {
  activeEnrollments: number;
  enrollments: NurtureEnrollment[];
  totalSent: number;
  processedDeals: number;
  optOuts: number;
  lastScan: string;
  sequences: NurtureSequence[];
  emailStats?: EmailStats;
  totalDelivered?: number;
  totalOpened?: number;
  totalClicked?: number;
  totalBounced?: number;
  totalUnsubscribed?: number;
  openRate?: number;
  clickRate?: number;
  campaigns?: NurtureCampaign[];
}

export interface NurtureHistoryItem {
  id: string;
  dealId: string;
  sequence: string;
  step: string;
  type: string;
  sentAt: string;
  subject?: string;
  body?: string;
  status: string;
}

export interface CallRecord {
  id: string;
  date: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  status: string;
  summary: string | null;
  hasTranscript: boolean;
}

export interface CallHistoryResponse {
  dealId: string;
  contactName: string;
  contactPhone: string;
  calls: CallRecord[];
  totalCalls: number;
  source: string;
}

export interface IntelligenceInsight {
  type: string;
  severity: 'red' | 'yellow' | 'green';
  dealId: string;
  dealName: string;
  amount: number;
  seller: string;
  sellerId: string;
  stage: string;
  daysSinceContact: number;
  message: string;
  lastCallSummary?: string;
  suggestion: string;
}

export interface SellerScore {
  name: string;
  activeDeals: number;
  totalValue: number;
  contacted3d: number;
  contactRate3d: number;
  grade: string;
  summary: string;
  urgentCount?: number;
}

export interface IntelligenceSummary {
  totalUrgent: number;
  totalRisks: number;
  urgentValue: number;
  atRiskValue: number;
  opportunityValue: number;
}

export interface IntelligenceData {
  urgent: IntelligenceInsight[];
  opportunities: IntelligenceInsight[];
  risks: IntelligenceInsight[];
  wins: IntelligenceInsight[];
  sellerScores: Record<string, SellerScore>;
  summary: IntelligenceSummary;
}

export interface EmailTrackingContact {
  email: string;
  opens: number;
  clicks: number;
  delivered: number;
  bounces: number;
  engagementLevel: 'hot' | 'warm' | 'interested' | 'delivered' | 'bounced' | 'none';
  engagementScore: number;
  lastEvent: string | null;
  emailCount: number;
}

export interface EmailTrackingBulk {
  totalContacts: number;
  totalEvents: number;
  contacts: EmailTrackingContact[];
}

export interface EmailTrackingDetail extends EmailTrackingContact {
  subject?: string;
}

export interface FeedItem {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  sellerId: string | null;
  sellerName: string | null;
  dealId: string | null;
  contactName: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface FeedResponse {
  items: FeedItem[];
  total: number;
  scannedAt: string;
}
