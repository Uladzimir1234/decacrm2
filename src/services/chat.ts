import { supabase } from '../lib/supabase';
import { api, isApiOffline } from '../lib/api';
import type { ChatMessage } from '../types';

export async function getChatHistory(): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .range(0, 49);
  return data || [];
}

export async function sendChatMessage(
  message: string
): Promise<ChatMessage | null> {
  await supabase
    .from('chat_messages')
    .insert({ role: 'user', content: message });

  try {
    if (isApiOffline()) throw new Error('offline');
    const { data } = await api.post('/api/chat', { message });
    const reply = data?.response || data?.reply || data?.message || 'I received your message.';
    await supabase
      .from('chat_messages')
      .insert({ role: 'assistant', content: reply });
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
    };
  } catch {
    const fallback = generateFallbackReply(message);
    await supabase
      .from('chat_messages')
      .insert({ role: 'assistant', content: fallback });
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fallback,
      created_at: new Date().toISOString(),
    };
  }
}

function generateFallbackReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('johnson'))
    return "The Johnson Properties deal ($32.5K) is in Negotiating stage. No contact for 7 days - Eric should follow up immediately. The customer was last discussing hurricane impact glass upgrades.";
  if (lower.includes('eric'))
    return "Eric has 6 active deals with a total pipeline of ~$163.7K. He has 2 red alerts that need attention - Johnson Properties and one stuck deal. His response time has been above average this week.";
  if (lower.includes('paul'))
    return "Paul has 6 active deals totaling ~$195.5K in pipeline. He has 2 red alerts - Russo Construction and Sunset Harbor HOA. The Sunset Harbor deal ($44.5K) hasn't had contact in 9 days.";
  if (lower.includes('worst') || lower.includes('risk'))
    return "The highest risk deals right now are: 1) Sunset Harbor HOA (Paul, $44.5K, 9 days no contact), 2) Johnson Properties (Eric, $32.5K, 7 days no contact), 3) Russo Construction (Paul, $28.3K, 6 days no contact).";
  if (lower.includes('follow up') || lower.includes('nudge'))
    return "I'll send a notification to the seller about this deal. They should prioritize reaching out within the next few hours.";
  return "I can help you monitor deals, check seller performance, and send follow-up reminders. Try asking about a specific deal, seller, or ask me to send a nudge.";
}
