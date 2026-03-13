import { api } from '../lib/api';

export interface HubContact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  source_account: string | null;
  lifecycle_stage: string | null;
  contact_type: string | null;
  current_owner_id: number | null;
  owner_name: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  last_contact_date: string | null;
  last_inbound_date: string | null;
  last_outbound_date: string | null;
  total_communications: number | null;
  first_activity_date: string | null;
  call_count: string;
  email_count: string;
  sms_count: string;
  deal_count: number;
  deal_value: number;
  current_stage: string;
  engagement_count: number;
  note_count: number;
  invoice_count: number;
  invoice_total: number;
  invoice_paid: number;
  invoice_due: number;
  invoice_status: string | null;
  last_action_type: string | null;
  last_action_at: string | null;
  first_touch_date: string | null;
  hs_create_date: string | null;
  last_contacted: string | null;
}

export interface ContactsListResponse {
  ok: boolean;
  contacts: HubContact[];
  total: number;
  page: number;
  limit: number;
}

export interface PulseData {
  ok: boolean;
  scoreboard: {
    new_leads_24h: string;
    comms_24h: string;
    total_debt: string;
    orders_in_production: string;
    missed_calls_24h: string;
    active_contacts_1h: string;
  };
  topDebtors: Array<{ id: number; name: string; total_owed: string }>;
  recentActivity: Array<{
    contact_id: number;
    contact_name: string;
    event_type: string;
    event_date: string;
    title: string;
    detail: string;
    amount: string | null;
  }>;
  production: Array<{
    id_doc: number;
    docnum: string;
    syma: string;
    status: number;
    docdate: string;
    client_name: string | null;
  }>;
}

export interface ContactCard {
  ok: boolean;
  contact: HubContact & { address: string | null; mobilephone: string | null };
  communications: {
    total: number;
    last_contact: string | null;
    breakdown: Record<string, number>;
  };
  deals: {
    items: Array<{
      id: number;
      title: string;
      stage: string;
      amount: string;
      close_date: string | null;
      created_at: string;
    }>;
    total_value: number;
    count: number;
  };
  finance: {
    wave: { invoices: unknown[]; total: number; paid: number; due: number };
    quickbooks: { invoices: unknown[]; total: number; balance: number };
    total_invoiced: number;
    total_outstanding: number;
  };
  orders: {
    items: Array<{
      id_doc: number;
      docnum: string;
      docdate: string;
      syma: string;
      status: number;
      adres_dest: string | null;
      komment: string | null;
    }>;
    total_value: number;
    count: number;
  };
  forms: Array<{
    id: number;
    source: string;
    color_preference: string;
    timeline: string;
    window_count: string;
    glazing_type: string;
    frame_color: string;
    needs_visit: string;
    created_at: string;
  }>;
  timeline: Array<{
    event_type: string;
    event_date: string;
    title: string;
    detail: string;
    amount: string | null;
    status_val: string | null;
    source: string;
  }>;
}

export interface ListParams {
  search?: string;
  owner?: string;
  stage?: string;
  hasDebt?: string;
  contactType?: string;
  sort?: string;
  page?: number;
  limit?: number;
  filter?: string;
  city?: string;
  state?: string;
  color_pref?: string;
  timeline?: string;
  seller?: string;
  category?: string;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface FilterValues {
  ok: boolean;
  cities: string[];
  stages: string[];
  colors: string[];
  timelines: string[];
  sellers: Array<{ id: number; name: string }>;
  states: string[];
}

export async function fetchContactsLive(params: ListParams): Promise<ContactsListResponse> {
  const { data } = await api.get('/api/contact360/list', { params });
  return data;
}

export async function fetchFilterValues(): Promise<FilterValues> {
  const { data } = await api.get('/api/contact360/filter-values');
  return data;
}

export async function fetchCategories(): Promise<{ ok: boolean; categories: CategoryCount[] }> {
  const { data } = await api.get('/api/contact360/categories');
  return data;
}

export async function fetchContactCard(id: number): Promise<ContactCard> {
  const { data } = await api.get(`/api/contact360/${id}/card`);
  return data;
}

export async function fetchContactTimeline(id: number, page = 1, limit = 20, type = 'all') {
  const { data } = await api.get(`/api/contact360/${id}/timeline`, {
    params: { page, limit, type }
  });
  return data;
}

export async function fetchPulse(): Promise<PulseData> {
  const { data } = await api.get('/api/contact360/pulse');
  return data;
}

export interface SellerBoardData {
  ok: boolean;
  seller_id: number;
  doNow: Array<{
    contact_id: string;
    contact_name: string;
    deal_title: string;
    amount: string;
    stage: string;
    close_date: string | null;
    phone: string | null;
    email: string | null;
    balance_due: string;
    days_silent: number;
    priority_score: number;
    next_action: string;
  }>;
  pipeline: Array<{ stage: string; count: string; total: string }>;
  stats: {
    total_contacts: string;
    total_deals: string;
    total_pipeline: string;
    comms_24h: string;
  };
  liveFeed: Array<{
    contact_id: number;
    contact_name: string;
    event_type: string;
    event_date: string;
    title: string;
    detail: string;
  }>;
}

export async function updateContact(id: number, fields: Record<string, string | null>): Promise<{ ok: boolean; updated: number }> {
  const { data } = await api.patch(`/api/contact360/${id}`, fields);
  return data;
}

/* ─── Seller Metrics & Notifications ─── */

export interface SellerMetrics {
  ok: boolean;
  date: string;
  seller_id: number;
  metrics: {
    calls_made: string;
    calls_received: string;
    calls_missed: string;
    emails_sent: string;
    emails_received: string;
    sms_total: string;
    total_comms: string;
    contacts_touched: string;
    new_leads: string;
  };
}

export interface SellerNotification {
  id: number;
  seller_id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  contact_id: number | null;
  deal_id: number | null;
  created_at: string;
}

export interface SellerNotificationsResponse {
  ok: boolean;
  notifications: SellerNotification[];
  live_alerts: Array<{
    type: string;
    contact_id: number;
    contact_name: string;
    phone: string | null;
    date: string;
  }>;
}

export interface CallBriefing {
  ok: boolean;
  briefing: {
    contact: {
      name: string;
      phone: string | null;
      email: string | null;
      company: string | null;
      city: string | null;
      state: string | null;
      lead_status: string | null;
      fb_color_preference: string | null;
      fb_timeline: string | null;
      fb_glazing: string | null;
      fb_needs_visit: string | null;
      balance_due: string;
    };
    summary: string;
    ai_summary: string;
    customer_quote: {
      text: string;
      date: string;
      source: string;
    } | null;
    next_step: string;
    interaction_breakdown: Record<string, number>;
    total_interactions: number;
    last_contact: {
      type: string;
      direction: string | null;
      date: string;
      summary: string;
      days_ago: number;
    } | null;
    active_deal: {
      title: string;
      stage: string;
      amount: string;
      close_date: string | null;
    } | null;
    preferences: {
      color: string | null;
      timeline: string | null;
      glazing: string | null;
      needs_visit: string | null;
    };
    balance_due: number;
    recent_comms: Array<{
      comm_type: string;
      direction: string | null;
      date: string;
      subject: string | null;
      preview: string | null;
      ai_summary: string | null;
      duration_seconds: number | null;
    }>;
    talking_points: string[];
  };
}

export interface ContactNote {
  id: number;
  contact_id: number;
  author: string;
  note_type: string;
  content: string;
  pinned: boolean;
  created_at: string;
}

export async function fetchSellerMetrics(sellerId: number): Promise<SellerMetrics> {
  const { data } = await api.get(`/api/contact360/seller-metrics/${sellerId}`);
  return data;
}

export async function fetchSellerNotifications(sellerId: number): Promise<SellerNotificationsResponse> {
  const { data } = await api.get(`/api/contact360/seller-notifications/${sellerId}`);
  return data;
}

export async function markNotificationRead(notifId: number): Promise<{ ok: boolean }> {
  const { data } = await api.patch(`/api/contact360/seller-notifications/${notifId}/read`);
  return data;
}

export async function fetchCallBriefing(contactId: number): Promise<CallBriefing> {
  const { data } = await api.get(`/api/contact360/${contactId}/call-briefing`);
  return data;
}

export async function fetchContactNotes(contactId: number): Promise<{ ok: boolean; notes: ContactNote[] }> {
  const { data } = await api.get(`/api/contact360/${contactId}/notes`);
  return data;
}

export async function addContactNote(contactId: number, content: string, noteType = 'general', author = 'admin'): Promise<{ ok: boolean; note: ContactNote }> {
  const { data } = await api.post(`/api/contact360/${contactId}/notes`, { content, note_type: noteType, author });
  return data;
}

/* ─── Dealer Portal ─── */

export interface DealerSummary {
  id: number;
  name: string;
  contact_name: string | null;
  dealer_type: string;
  tier: string;
  status: string;
  territory: string | null;
  commission_rate: string | null;
  balance_due: string | null;
  total_orders: string;
  active_orders: string;
  total_revenue: string;
  pipeline_value: string;
  last_order_date: string | null;
  open_tickets: string;
}

export interface DealerDetail {
  ok: boolean;
  dealer: {
    id: number;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    website: string | null;
    territory: string | null;
    dealer_type: string;
    tier: string;
    commission_rate: string | null;
    credit_limit: string | null;
    balance_due: string | null;
    status: string;
    notes: string | null;
    created_at: string;
  };
  orders: Array<{
    id: number;
    dealer_id: number;
    order_number: string | null;
    amount: string | null;
    status: string;
    product_config: Record<string, unknown> | null;
    created_at: string;
  }>;
  communications: Array<{
    id: number;
    dealer_id: number;
    type: string;
    direction: string;
    subject: string | null;
    body: string | null;
    date: string;
  }>;
}

export interface CreateDealerPayload {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  territory?: string;
  dealer_type?: string;
  tier?: string;
  commission_rate?: number;
  credit_limit?: number;
}

export async function fetchDealers(): Promise<{ ok: boolean; dealers: DealerSummary[] }> {
  const { data } = await api.get('/api/contact360/dealers');
  return data;
}

export async function fetchDealerDetail(id: number): Promise<DealerDetail> {
  const { data } = await api.get(`/api/contact360/dealers/${id}`);
  return data;
}

export async function createDealer(payload: CreateDealerPayload): Promise<{ ok: boolean; dealer: DealerDetail['dealer'] }> {
  const { data } = await api.post('/api/contact360/dealers', payload);
  return data;
}

/* ─── Contact Communications (full body/content) ─── */

export interface CommItem {
  id: string;
  comm_type: string;
  direction: string | null;
  subject: string | null;
  body: string | null;
  date: string;
  from_addr: string | null;
  to_addr: string | null;
  metadata: Record<string, unknown> | null;
  account: string | null;
  phone_line: string | null;
  duration_seconds: number | null;
}

export interface CommsResponse {
  ok: boolean;
  timeline: CommItem[];
  total: number;
  page: number;
}

export async function fetchContactComms(contactId: number, type = 'all', page = 1, limit = 50): Promise<CommsResponse> {
  const { data } = await api.get(`/api/contact360/${contactId}/timeline`, {
    params: { type, page, limit }
  });
  return data;
}

export async function fetchRecentSms(contactId: number): Promise<{ ok: boolean; messages: Array<{ id: string; direction: string; date: string; body: string; phone_line: string | null; phone: string | null }> }> {
  const { data } = await api.get(`/api/contact360/${contactId}/recent-sms`);
  return data;
}

/* ─── Email Templates ─── */

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body_html: string;
  category: string;
  variables: string[];
  usage_count: number;
  is_active: boolean;
}

export interface RenderedEmail {
  ok: boolean;
  template: EmailTemplate;
  rendered: { subject: string; body_html: string };
  contact: { name: string; email: string | null };
}

export async function fetchEmailTemplates(): Promise<{ ok: boolean; templates: EmailTemplate[] }> {
  const { data } = await api.get('/api/contact360/email-templates');
  return data;
}

export async function renderEmailTemplate(templateId: number, contactId: number): Promise<RenderedEmail> {
  const { data } = await api.get(`/api/contact360/email-templates/${templateId}/render/${contactId}`);
  return data;
}

/* ─── Seller SMS Inbox ─── */

export interface InboundSmsMessage {
  id: string;
  contact_id: number;
  contact_name: string;
  direction: string;
  date: string;
  body: string;
  phone: string | null;
  phone_line: string | null;
}

export async function fetchRecentInboundSms(sellerId: number): Promise<{ ok: boolean; messages: InboundSmsMessage[] }> {
  const { data } = await api.get('/api/contact360/recent-inbound-sms', { params: { seller_id: sellerId } });
  return data;
}

/* ─── Production Status ─── */

export interface ProductionOrder {
  id_doc: number;
  docnum: string;
  docdate: string;
  syma: string;
  status: number;
  status_label: string;
  adres_dest: string | null;
  komment: string | null;
  item_count: number;
}

export interface ProductionResponse {
  ok: boolean;
  orders: ProductionOrder[];
  shipments: unknown[];
  summary: { total_orders: number; in_production: number; total_value: number };
}

export async function fetchProductionStatus(contactId: number): Promise<ProductionResponse> {
  const { data } = await api.get(`/api/contact360/${contactId}/production`);
  return data;
}

export async function fetchSellerBoard(sellerId?: number, sellerName?: string): Promise<SellerBoardData> {
  const params: Record<string, string | number> = {};
  if (sellerId) params.seller_id = sellerId;
  if (sellerName) params.seller_name = sellerName;
  const { data } = await api.get('/api/contact360/seller-board', { params });
  return data;
}

export interface StageContact {
  deal_id: string;
  deal_title: string;
  amount: string;
  stage: string;
  close_date: string | null;
  contact_id: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  lead_status: string | null;
  fb_color_preference: string | null;
  fb_timeline: string | null;
  fb_glazing: string | null;
  last_comm_date: string | null;
  days_silent: number | null;
  total_comms: number;
  balance_due: string;
}

export interface StageContactsResponse {
  ok: boolean;
  mode: 'stage_contacts';
  stage: string;
  owner_id: number;
  contacts: StageContact[];
  count: number;
}

export async function fetchStageContacts(stage: string, sellerName?: string, limit = 50): Promise<StageContactsResponse> {
  const params: Record<string, string | number> = { stage, limit };
  if (sellerName) params.seller_name = sellerName;
  const { data } = await api.get('/api/contact360/stage-contacts', { params });
  return data;
}

/* ─── Smart Inbox (unified unanswered items) ─── */

export interface InboxItem {
  type: 'sms' | 'missed_call' | 'email';
  contact_id: string;
  contact_name: string;
  email?: string;
  phone?: string;
  subject?: string;
  preview?: string;
  date: string;
  comm_id?: string;
  body?: string;
}

export interface SmartInboxResponse {
  ok: boolean;
  total: number;
  sms: InboxItem[];
  missed_calls: InboxItem[];
  emails: InboxItem[];
}

export async function fetchSellerInbox(sellerId: number): Promise<SmartInboxResponse> {
  const { data } = await api.get(`/api/contact360/seller-inbox/${sellerId}`);
  return data;
}

/* ─── Email Template Suggestions ─── */

export interface TemplateSuggestion {
  template: EmailTemplate;
  contacts: Array<{ contact_id: number; contact_name: string; email: string | null }>;
  count: number;
  glowing: boolean;
}

export interface TemplateSuggestionsResponse {
  ok: boolean;
  suggestions: TemplateSuggestion[];
}

export async function fetchTemplateSuggestions(sellerId: number): Promise<TemplateSuggestionsResponse> {
  const { data } = await api.get(`/api/contact360/email-templates/suggestions/${sellerId}`);
  return data;
}

/* ─── Send Draft Email ─── */

export async function sendDraftEmail(templateId: number, contactId: number): Promise<{ ok: boolean; draft_id?: number }> {
  const { data } = await api.post(`/api/contact360/email-templates/${templateId}/send-draft`, { contact_id: contactId });
  return data;
}

/* ─── Seller Production (all orders for seller's contacts) ─── */

export interface SellerProductionResponse {
  ok: boolean;
  orders: Array<ProductionOrder & { contact_id: number; contact_name: string }>;
  summary: { total: number; active: number; total_value: number };
}

export async function fetchSellerProduction(sellerId: number): Promise<SellerProductionResponse> {
  const { data } = await api.get(`/api/contact360/seller-production/${sellerId}`);
  return data;
}

/* ─── Deals Board (Kanban) ─── */

export interface BoardDeal {
  id: number;
  title: string;
  amount: number;
  stage: string;
  board_stage: string;
  close_date: string | null;
  close_reason: string | null;
  contract_date: string | null;
  products: string | null;
  created_at: string;
  updated_at: string;
  contact_id: number;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_city: string | null;
  owner_name: string | null;
}

export interface DealsBoardResponse {
  ok: boolean;
  board: Record<string, { deals: BoardDeal[]; count: number; total: number }>;
  total_deals: number;
  total_value: number;
}

export async function fetchDealsBoard(seller?: string): Promise<DealsBoardResponse> {
  const params: Record<string, string> = {};
  if (seller) params.seller = seller;
  const { data } = await api.get('/api/contact360/deals-board', { params });
  return data;
}

export async function moveDealStage(dealId: number, stage: string): Promise<{ ok: boolean }> {
  const { data } = await api.post(`/api/contact360/deals/${dealId}/move`, { stage });
  return data;
}
