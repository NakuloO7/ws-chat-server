import { useEffect, useRef, useState } from "react";
import { useWebSocket, type UIMessage } from "../hooks/useWebSocket";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export const Chat = () => {
  const navigate = useNavigate();
  const roomId = "general"; // hardcoded for now
  const { messages, sendMessage, connected, fatalError } = useWebSocket(roomId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { user, loading } = useUser();

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

  if (loading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">General</h1>
          <p className="text-xs text-zinc-400">
            {connected ? "Online" : "Connecting..."}
          </p>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            connected ? "bg-green-500" : "bg-zinc-500"
          }`}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.userId;

          // 🧠 Group messages (WhatsApp style)
          const prev = messages[i - 1];
          const showName = !isMe && (!prev || prev.userId !== msg.userId);

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[72%]">
                {/* Show name ONLY when sender changes */}
                {showName && (
                  <p className="text-xs text-zinc-400 mb-1 ml-1">
                    {msg.userName}
                  </p>
                )}

                {/* Message bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-br-md"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3 bg-zinc-800 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Message…"
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
