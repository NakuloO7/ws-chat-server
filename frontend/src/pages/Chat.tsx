import { useEffect, useRef, useState } from "react";
import { useWebSocket, type UIMessage } from "../hooks/useWebSocket";
import { useNavigate } from "react-router-dom";

export const Chat = () => {
  const navigate = useNavigate();
  const roomId = "general"; // hardcoded for now
  const { messages, sendMessage, connected, fatalError } = useWebSocket(roomId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (fatalError) {
      navigate("/login");
    }
  }, [fatalError, navigate]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">general</h1>
          <p className="text-xs text-zinc-400">
            {connected ? "Online" : "Connecting..."}
          </p>
        </div>
        <div className="w-3 h-3 rounded-full bg-pink-500" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg: UIMessage, i: number) => {
          const isMe = msg.userName === "You"; // later we’ll replace this properly

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
              >
                {!isMe && (
                  <p className="text-xs text-zinc-400 mb-1">{msg.userName}</p>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="text-pink-500 font-semibold text-sm hover:opacity-80"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
