"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Send, 
  Trash2, 
  Menu, 
  X, 
  MessageSquare, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight, 
  CornerDownLeft 
} from "lucide-react";
import { ChatService } from "../../services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
}

// Inner Component that uses search params
function ChatContent() {
  const searchParams = useSearchParams();
  const triggerQuery = searchParams.get("trigger");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "🚔 File a Complaint",
    "🏠 Tenant Verification",
    "📜 Character Certificate",
    "🎭 Event Permission",
    "🔍 Track Application",
    "📍 Find Police Station",
  ]);

  const [history, setHistory] = useState<ChatSession[]>([
    { id: "sess-1", title: "Phone Stolen Complaint", date: "Today" },
    { id: "sess-2", title: "Tenant Verification Details", date: "Yesterday" },
    { id: "sess-3", title: "Character Certificate Info", date: "3 days ago" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session ID
  useEffect(() => {
    setSessionId(`session-${Math.random().toString(36).substring(7)}`);
    setMessages([
      {
        role: "assistant",
        text: "👮 Welcome to Rakku\n\nI'm your Digital Police Assistant.\n\nI can help you with:\n\n🚔 [Filing a Complaint](option:🚔 File a Complaint)\n🏠 [Tenant Verification](option:🏠 Tenant Verification)\n📜 [Character Certificate](option:📜 Character Certificate)\n🎭 [Event Permission](option:🎭 Event Permission)\n🔍 [Application Tracking](option:🔍 Track Application)\n\nPlease choose your preferred language:\n\n• [English](option:English)\n• [हिंदी](option:हिंदी)\n• [Hinglish](option:Hinglish)\n\nYou can also simply tell me what you need help with.\n\nExamples:\n\n\"My phone was stolen\"\n\n\"मुझे चरित्र प्रमाण पत्र चाहिए\"\n\n\"Tenant verification karna hai\"",
      },
    ]);
  }, []);

  // Handle triggered query from dashboard
  useEffect(() => {
    if (triggerQuery && sessionId && messages.length === 1) {
      handleSendMessage(triggerQuery);
    }
  }, [triggerQuery, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle typing effect for streaming
  const typeMessage = (fullText: string, msgIndex: number) => {
    let currentText = "";
    let i = 0;
    const speed = 10; // ms per char

    const interval = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setMessages((prev) => {
          const updated = [...prev];
          updated[msgIndex] = {
            role: "assistant",
            text: currentText,
            isStreaming: true,
          };
          return updated;
        });
        i++;
      } else {
        clearInterval(interval);
        setMessages((prev) => {
          const updated = [...prev];
          updated[msgIndex] = {
            role: "assistant",
            text: fullText,
            isStreaming: false,
          };
          return updated;
        });
      }
    }, speed);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend;
    setInput("");

    const cleanLower = userText.toLowerCase().trim();
    if (cleanLower.includes('nearest police station') || cleanLower.includes('police station near me') || cleanLower.includes('closest station') || cleanLower === 'find police station') {
      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", text: userText }]);
      
      if (typeof window === "undefined" || !navigator.geolocation) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "❌ Geolocation is not supported by your browser.",
          },
        ]);
        setLoading(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            const res = await fetch(`/api/citizen-assistance/police-stations/nearest?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const data = await res.json();
              const stationMsg = `🚔 **Nearest Police Station Found:**\n\n` +
                `- **Name:** **${data.station.name}**\n` +
                `- **Address:** ${data.station.address}\n` +
                `- **Phone Number:** [${data.station.phone}](tel:${data.station.phone})\n` +
                `- **Distance:** **${data.distanceKm} km** away\n\n` +
                `👉 [Open in Google Maps](${data.mapsUrl})`;
              
              setMessages((prev) => [...prev, { role: "assistant", text: stationMsg }]);
            } else {
              setMessages((prev) => [...prev, { role: "assistant", text: "❌ Failed to fetch nearest police station." }]);
            }
          } catch (e) {
            setMessages((prev) => [...prev, { role: "assistant", text: "❌ Error occurred while searching for police station." }]);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: `❌ Location access denied or unavailable. Falling back to default Hazratganj Central Station:\n\n` +
                `🚔 **Hazratganj Police Station**\n` +
                `- **Address:** Hazratganj, Lucknow, Uttar Pradesh 226001\n` +
                `- **Phone:** [0522-2200201](tel:0522-2200201)\n\n` +
                `👉 [Open in Google Maps](https://www.google.com/maps/search/?api=1&query=26.8467,80.9462)`,
            },
          ]);
          setLoading(false);
        }
      );
      return;
    }
    
    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    // Add empty assistant message for streaming placeholder
    const placeholderIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", text: "...", isStreaming: true }]);

    try {
      const data = await ChatService.sendMessage(userText, sessionId);
      
      // Remove loading status
      setLoading(false);
      
      // Update with typing effect
      typeMessage(data.response, placeholderIndex);

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      setLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[placeholderIndex] = {
          role: "assistant",
          text: "👮 **Rakku System:** Sorry, I encountered an error connecting to the server. Please check your network and try again.",
        };
        return updated;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const startNewChat = () => {
    setSessionId(`session-${Math.random().toString(36).substring(7)}`);
    setMessages([
      {
        role: "assistant",
        text: "👮 Welcome to Rakku\n\nI'm your Digital Police Assistant.\n\nI can help you with:\n\n🚔 [Filing a Complaint](option:🚔 File a Complaint)\n🏠 [Tenant Verification](option:🏠 Tenant Verification)\n📜 [Character Certificate](option:📜 Character Certificate)\n🎭 [Event Permission](option:🎭 Event Permission)\n🔍 [Application Tracking](option:🔍 Track Application)\n\nPlease choose your preferred language:\n\n• [English](option:English)\n• [हिंदी](option:हिंदी)\n• [Hinglish](option:Hinglish)\n\nYou can also simply tell me what you need help with.\n\nExamples:\n\n\"My phone was stolen\"\n\n\"मुझे चरित्र प्रमाण पत्र चाहिए\"\n\n\"Tenant verification karna hai\"",
      },
    ]);
    setSuggestions([
      "🚔 File a Complaint",
      "🏠 Tenant Verification",
      "📜 Character Certificate",
      "🎭 Event Permission",
      "🔍 Track Application",
      "📍 Find Police Station",
    ]);
  };

  const loadHistorySession = (sessionTitle: string) => {
    setSessionId(`session-${Math.random().toString(36).substring(7)}`);
    setMessages([
      {
        role: "assistant",
        text: `👮 **Welcome back. Loading session: ${sessionTitle}**\nHow can I assist you with this request? You can continue or ask something new.`,
      },
    ]);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg hover:text-white"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Panel */}
      <aside className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 z-40 transition-transform duration-300 absolute md:relative inset-y-0 left-0 transform md:transform-none ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-4 flex flex-col h-full">
          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-755 border border-slate-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center justify-center space-x-2 shadow hover:border-police-gold"
          >
            <span>+</span>
            <span>New Chat Session</span>
          </button>

          {/* History List */}
          <div className="mt-8 flex-1 overflow-y-auto">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">
              Conversation History
            </h4>
            <div className="space-y-1">
              {history.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => loadHistorySession(sess.title)}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs flex items-center space-x-2 transition-all group"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-police-gold transition-colors" />
                  <span className="truncate flex-1">{sess.title}</span>
                  <span className="text-[9px] text-slate-600 font-medium">{sess.date}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Info / Warning Panel */}
          <div className="mt-auto border-t border-slate-800 pt-4 bg-slate-900">
            <div className="bg-police-navy-light/40 border border-police-gold/15 rounded-lg p-3 text-[10px] text-slate-400 leading-relaxed">
              <div className="flex items-center space-x-1.5 text-police-gold font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rakku Guidelines</span>
              </div>
              <p>One question at a time. Cancel a workflow by typing <strong className="text-slate-200 font-mono">cancel</strong>. Emergency dial 112.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-police-navy-dark overflow-hidden h-full">
        {/* Workspace Header */}
        <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-police-navy/40">
          <div className="flex items-center space-x-2 pl-12 md:pl-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">Rakku Chat Assistant</span>
          </div>

          <button
            onClick={() => {
              setMessages([]);
              startNewChat();
            }}
            title="Clear chat history"
            className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-police-red rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div 
                  key={idx}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"} animate-fade-in-up`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${isAssistant ? "" : "flex-row-reverse space-x-reverse"}`}>
                    {/* Avatar */}
                    {isAssistant ? (
                      <img src="/rakku_officer.png" alt="Rakku" className="w-8 h-8 rounded-full object-cover object-top border border-police-gold/30 shadow flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow flex-shrink-0 bg-slate-800 text-slate-300">
                        👤
                      </div>
                    )}

                    {/* Text Container */}
                    <div className={`rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isAssistant 
                        ? "bubble-assistant glow-gold/5" 
                        : "bubble-user"
                    }`}>
                      {msg.text.split("\n").map((line, lIdx) => {
                        // For simplicity, if we have markdown bullets, indent them
                        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("👉") || line.trim().startsWith("•");

                        // Parse markdown elements: **bold** and [label](url-or-option)
                        const parseMarkdown = (text: string) => {
                          const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
                          const elements = text.split(regex);
                          
                          return elements.map((part, index) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={index} className="text-police-gold font-bold">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            } else if (part.startsWith('[') && part.endsWith(')')) {
                              const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                              if (linkMatch) {
                                const label = linkMatch[1];
                                const url = linkMatch[2];
                                if (url.startsWith('option:')) {
                                  const optionVal = url.substring(7);
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => handleSendMessage(optionVal)}
                                      className="text-police-gold hover:text-white underline font-semibold mx-1 cursor-pointer transition-colors text-left bg-transparent border-0 p-0 inline align-baseline"
                                    >
                                      {label}
                                    </button>
                                  );
                                } else {
                                  return (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-police-gold hover:underline font-semibold mx-1 inline"
                                    >
                                      {label}
                                    </a>
                                  );
                                }
                              }
                            }
                            return part;
                          });
                        };

                        return (
                          <p 
                            key={lIdx} 
                            className={`${isBullet ? "pl-4 py-0.5" : ""} ${line.trim() === "" ? "h-3" : ""}`}
                          >
                            {parseMarkdown(line)}
                          </p>
                        );
                      })}

                      {isAssistant && idx === 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
                          <button
                            onClick={() => handleSendMessage("🚔 File a Complaint")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
                          >
                            <span className="text-xl">🚔</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">File Complaint</span>
                          </button>
                          
                          <button
                            onClick={() => handleSendMessage("🏠 Tenant Verification")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
                          >
                            <span className="text-xl">🏠</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Tenant Verify</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("📜 Character Certificate")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
                          >
                            <span className="text-xl">📜</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Character Cert</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("🎭 Event Permission")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
                          >
                            <span className="text-xl">🎭</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Event Permit</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("🔍 Track Application")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
                          >
                            <span className="text-xl">🔍</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Track Status</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("nearest police station")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
                          >
                            <span className="text-xl">📍</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Find Station</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("Emergency Contacts")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer col-span-1"
                          >
                            <span className="text-xl">📞</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Emergency Helplines</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("I got scammed online")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer col-span-1"
                          >
                            <span className="text-xl">💻</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Cyber Crime Help</span>
                          </button>

                          <button
                            onClick={() => handleSendMessage("harass")}
                            className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer col-span-1"
                          >
                            <span className="text-xl">👩</span>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">Women Safety Help</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-[85%]">
                  <img src="/rakku_officer.png" alt="Rakku" className="w-8 h-8 rounded-full object-cover object-top border border-police-gold/30 shadow flex-shrink-0" />
                  <div className="bg-slate-900/80 border-slate-800 rounded-2xl p-4 border text-xs text-slate-400 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-police-gold animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-police-gold animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-police-gold animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input & Suggestions Pane */}
        <footer className="border-t border-slate-800 p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            {/* Suggested prompts list */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto py-1">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="px-3 py-1 bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700/80 hover:border-police-gold rounded-full transition-all flex items-center space-x-1.5 hover:text-white"
                  >
                    <span>✦</span>
                    <span className="truncate">{sug}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-xl focus-within:border-police-gold transition-colors p-1.5 shadow-lg">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message (e.g. 'My phone was stolen' or 'किरायेदार सत्यापन')"
                className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-500 text-xs sm:text-sm pl-3 pr-12 py-2 resize-none max-h-20 focus:ring-0 focus:outline-none"
                rows={1}
              />
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-police-gold hover:bg-police-gold-light text-police-navy-dark rounded-lg disabled:bg-slate-800 disabled:text-slate-600 transition-colors shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2 px-1">
              <span>Press <strong className="text-slate-400 font-mono">Enter</strong> to send, <strong className="text-slate-400 font-mono">Shift + Enter</strong> for line break.</span>
              <span className="hidden sm:inline">👮 Rakku Assitant V1 Prototype</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Main Page wrapper providing Suspense context for useSearchParams
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-police-navy-dark text-slate-400 text-sm">
        Loading Chat Workspace...
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
