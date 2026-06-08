import { useState } from "react";

export default function InputBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form
      onSubmit={submit}
      className="border-t border-gray-200 px-4 py-3 flex items-end gap-2 bg-white"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder="Message MarketMyBusiness..."
        className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 max-h-28"
        style={{ minHeight: "42px" }}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="bg-green-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-40 transition-colors flex-shrink-0"
      >
        Send
      </button>
    </form>
  );
}
