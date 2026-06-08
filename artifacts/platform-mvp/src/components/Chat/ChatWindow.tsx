import type { Business } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";
import ActionCard from "./ActionCard";

export default function ChatWindow({ business }: { business: Business | null }) {
  const { messages, loading, pendingAction, setPendingAction, send, approve, bottomRef } =
    useChat(business);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        {pendingAction && (
          <ActionCard
            action={pendingAction}
            onApprove={() => approve(pendingAction.campaign_id!)}
            onReject={() => {
              setPendingAction(null);
              send("Let me rewrite that message.");
            }}
          />
        )}
        <div ref={bottomRef} />
      </div>
      <InputBar onSend={send} disabled={loading} />
    </div>
  );
}
