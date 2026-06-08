interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const text = message.content.replace(/\*\*(.*?)\*\*/g, "$1");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 mr-2 mt-1 overflow-hidden bg-green-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">G</span>
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-green-700 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
        <p className={`text-xs mt-1 ${isUser ? "text-green-200" : "text-gray-400"}`}>
          {new Date(message.time).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
