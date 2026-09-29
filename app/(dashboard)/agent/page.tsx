import { getAgentConversations, getConversationDetail } from '@/lib/data/agent';
import { AgentChatInterface } from './agent-chat-interface';

export default async function AgentPage(props: {
  searchParams: Promise<{ conversationId?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const conversationId = searchParams.conversationId;
  const initialQuery = searchParams.q;

  const conversations = await getAgentConversations();

  let activeConversation = null;
  let initialMessages: any[] = [];

  if (conversationId) {
    const detail = await getConversationDetail(conversationId);
    if (detail) {
      activeConversation = detail.conversation;
      initialMessages = detail.messages;
    }
  } else if (conversations.length > 0) {
    // Default to most recent conversation if none specified in query string
    const latest = conversations[0];
    const detail = await getConversationDetail(latest.id);
    if (detail) {
      activeConversation = detail.conversation;
      initialMessages = detail.messages;
    }
  }

  return (
    <div className="space-y-4">
      <AgentChatInterface
        conversations={conversations}
        activeConversation={activeConversation}
        initialMessages={initialMessages}
        initialQuery={initialQuery}
      />
    </div>
  );
}
