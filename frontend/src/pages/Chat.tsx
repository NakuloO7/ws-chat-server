import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";

export const Chat = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialLoadRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const isPrependingRef = useRef(false);

  const { roomId } = useParams<{ roomId: string }>();
  if (!roomId) {
    return <div className="text-white p-6">Invalid room</div>;
  }

  const {
    messages,
    sendMessage,
    connected,
    fatalError,
    leaveRoom,
    hasMore,
    cursor,
    loadOlderMessages,
  } = useWebSocket(roomId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { user, loading } = useUser();

  useEffect(() => {
    if (fatalError) {
      navigate("/login");
    }
  }, [fatalError, navigate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = async () => {
      // Just detect, don’t load yet
      if (el.scrollTop < 80 && hasMore && !loadingOlderRef.current) {
        isPrependingRef.current = true;
        loadingOlderRef.current = true;

        const prevScrollHeight = el.scrollHeight;
        await loadOlderMessages();
        // ⛓ preserve scroll position
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
          loadingOlderRef.current = false;

          // keep this TRUE until next render cycle
          setTimeout(() => {
            isPrependingRef.current = false;
          }, 0);
        });
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, loadOlderMessages]);

  useEffect(() => {
    if (!messages.length) return;

    // Never auto-scroll during prepend
    if (isPrependingRef.current) return;

    //only on initial load
    if (initialLoadRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      initialLoadRef.current = false;
      return;
    }
    // New live message: only scroll if user is near bottom
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceFromBottom < 120) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  // Utility function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // 🔹 EDIT MESSAGE STATE (ADD HERE)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const updateMessage = async (id: string, text: string) => {
    await axios.patch(
      `http://localhost:3000/messages/${id}`,
      { text },
      { withCredentials: true },
    );
  };

  if (loading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-zinc-950 text-white flex items-center justify-center antialiased overflow-hidden">
      {/* Chat Container - Full width on mobile/tablet, constrained on desktop */}
      <div className="w-full h-full md:h-[90vh] md:max-w-4xl lg:max-w-3xl xl:max-w-2xl md:rounded-lg md:shadow-2xl md:border md:border-zinc-800/50 flex flex-col overflow-hidden">
        {/* Header: Instagram-style clean and minimal - Fully responsive */}
        <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-12 sm:h-14 border-b border-zinc-800/50 bg-zinc-950 flex-shrink-0 safe-top md:rounded-t-lg">
          {/* Left side - Room info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm md:text-base font-normal text-white truncate">
              {capitalizeFirstLetter(roomId)}
            </h1>
            {/* Online status indicator */}
            <span
              className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0 ${
                connected ? "bg-emerald-500" : "bg-zinc-500"
              }`}
              title={connected ? "Connected" : "Disconnected"}
            />
          </div>

          {/* Right side - Leave button (Instagram style options button) */}
          <button
            onClick={() => {
              leaveRoom();
              navigate("/rooms");
            }}
            className="p-1.5 sm:p-2 hover:bg-zinc-800/50 active:bg-zinc-800/70 rounded-full transition-colors duration-150 flex-shrink-0 touch-manipulation"
            aria-label="Leave room"
            title="Leave room"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Messages Container - Fully responsive with proper spacing */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 space-y-2 sm:space-y-2.5 md:space-y-3 custom-scrollbar min-h-0"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-50">
              <p className="text-xs sm:text-sm md:text-base text-zinc-500/70 text-center px-4">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.userId === user?.userId;
            const isEditing = editingId === msg.id;

            // Group messages (WhatsApp style)
            const prev = messages[i - 1];
            const showName = !isMe && (!prev || prev.userId !== msg.userId);
            const isGrouped = prev && prev.userId === msg.userId && !isMe;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5 sm:mt-1" : "mt-1 sm:mt-1.5 md:mt-2"}`}
              >
                <div className="max-w-[90%] xs:max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%]">
                  {/* Show name ONLY when sender changes */}
                  {showName && (
                    <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-zinc-400/80 mb-0.5 sm:mb-1 ml-2 sm:ml-3.5 font-medium">
                      {capitalizeFirstLetter(msg.userName)}
                    </p>
                  )}

                  {/* Message bubble */}
                  <div
                    onDoubleClick={() => {
                      if (!isMe) return;
                      setEditingId(msg.id);
                      setEditText(msg.text);
                    }}
                    className={`px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 rounded-2xl shadow-md cursor-${isMe ? "text" : "default"} ${
                      isMe
                        ? "bg-linear-to-br from-pink-600 to-purple-600 text-white rounded-br-sm"
                        : "bg-zinc-800/90 text-zinc-100 rounded-bl-sm border border-zinc-700/50"
                    }`}
                  >
                    {isEditing ? (
                      <input
                        value={editText}
                        autoFocus
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateMessage(msg.id, editText);
                            setEditingId(null);
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        className="w-full bg-transparent outline-none border-b border-zinc-400 text-white"
                      />
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Area - Instagram-style minimal footer - Fully responsive */}
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-t border-zinc-800/50 bg-zinc-950 flex-shrink-0 safe-bottom md:rounded-b-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Message..."
              className="flex-1 bg-transparent text-xs sm:text-sm md:text-base outline-none placeholder:text-zinc-500 text-white resize-none touch-manipulation"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="text-pink-500 font-semibold text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150 active:opacity-70 touch-manipulation"
              disabled={!text.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
