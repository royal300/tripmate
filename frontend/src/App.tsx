import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import type { ChatMessage } from './components/ChatWindow';
import { ChatInputBar } from './components/ChatInputBar';
import { QuickReplyChips } from './components/QuickReplyChips';
import { sendChatMessage, generateSessionId } from './api/chat';

const SESSION_KEY = 'tripmate_session_id';

function getOrCreateSession(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const newId = generateSessionId();
  sessionStorage.setItem(SESSION_KEY, newId);
  return newId;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showChips, setShowChips] = useState(false);
  const sessionId = useRef<string>(getOrCreateSession());

  // Initial greeting from AI
  useEffect(() => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages([{
        id: 'init',
        isUser: false,
        text: "Hi there! 👋 I'm Riya, your personal travel consultant. I can help you find the perfect tour package for any destination, budget, or occasion. What kind of trip are you dreaming of? 🌴",
      }]);
      setIsTyping(false);
      setShowChips(true);
    }, 800);
  }, []);

  const handleSendMessage = async (text: string) => {
    setShowChips(false);
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);

    // Add user message immediately
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, isUser: true, text }]);
    setIsTyping(true);

    // Create placeholder for streaming AI response
    const aiMsgId = (Date.now() + 1).toString();
    let streamedText = '';

    // Parse SSE events
    await sendChatMessage(text, sessionId.current, {
      onToken: (token) => {
        streamedText += token;
        setIsTyping(false);
        setMessages(prev => {
          const exists = prev.find(m => m.id === aiMsgId);
          if (exists) {
            return prev.map(m => m.id === aiMsgId ? { ...m, text: streamedText } : m);
          }
          return [...prev, { id: aiMsgId, isUser: false, text: streamedText }];
        });
      },
      onDone: (meta) => {
        setIsTyping(false);
        // Session ID from server (use it for subsequent requests)
        if (meta.sessionId) {
          sessionId.current = meta.sessionId;
          sessionStorage.setItem(SESSION_KEY, meta.sessionId);
        }
        // Update the AI message with package cards if needed
        if (meta.responseType === 'packages' && meta.packages && meta.packages.length > 0) {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, packages: meta.packages } : m
          ));
        }
        if (meta.responseType === 'lead_form') {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, showLeadForm: true } : m
          ));
        }
      },
      onError: (errMsg) => {
        setIsTyping(false);
        setMessages(prev => {
          const exists = prev.find(m => m.id === aiMsgId);
          const errorMsg = errMsg || "I'm having a small hiccup — please try again in a moment.";
          if (exists) {
            return prev.map(m => m.id === aiMsgId ? { ...m, text: errorMsg } : m);
          }
          return [...prev, { id: aiMsgId, isUser: false, text: errorMsg }];
        });
      },
    });
  };

  const handleLeadSubmit = (name: string, phone: string) => {
    // The lead was already saved by the backend via capture_lead tool.
    // Just confirm to the user.
    handleSendMessage(`My name is ${name} and my WhatsApp number is ${phone}`);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#064E3B] to-[#0F172A] overflow-hidden font-sans">
      {/* Decorative background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotted-curve" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M 0,100 C 50,0 150,200 200,100" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotted-curve)" />
        </svg>
      </div>

      <Header />

      <main className="relative z-10 flex flex-col h-screen max-w-3xl mx-auto">
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onLeadSubmit={handleLeadSubmit}
        />

        {/* Quick reply chips - shown after first greeting */}
        <div className="fixed bottom-[88px] left-0 right-0 z-40 max-w-3xl mx-auto pointer-events-none">
          <div className="pointer-events-auto">
            {showChips && !isTyping && (
              <QuickReplyChips
                chips={["Kerala packages", "Honeymoon trips", "Under ₹20,000", "Goa beach holiday"]}
                onSelect={handleSendMessage}
              />
            )}
          </div>
        </div>

        <ChatInputBar
          onSendMessage={handleSendMessage}
          disabled={isTyping}
        />
      </main>
    </div>
  );
}

export default App;
