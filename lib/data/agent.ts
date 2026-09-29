import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type AgentConversationRow = Database['public']['Tables']['agent_conversations']['Row'];
export type AgentMessageRow = Database['public']['Tables']['agent_messages']['Row'];

export interface ConversationWithMessages {
  conversation: AgentConversationRow;
  messages: AgentMessageRow[];
}

/**
 * Server function: Fetches all agent conversations.
 */
export async function getAgentConversations(): Promise<AgentConversationRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Server function: Fetches a single conversation with its message trajectory.
 */
export async function getConversationDetail(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const supabase = await createClient();

  const { data: conv, error: convErr } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convErr || !conv) return null;

  const { data: messages, error: msgErr } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return {
    conversation: conv,
    messages: messages || [],
  };
}

/**
 * Server function: Creates a new conversation.
 */
export async function createConversation(title: string = 'New Conversation'): Promise<AgentConversationRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({ title })
    .select('*')
    .single();

  if (error) return null;
  return data;
}

/**
 * Server function: Deletes a conversation and its messages.
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('agent_conversations')
    .delete()
    .eq('id', conversationId);

  return !error;
}
