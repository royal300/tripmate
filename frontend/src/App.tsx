import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatWindow, type ChatMessage } from './components/ChatWindow';
import { ChatInputBar } from './components/ChatInputBar';
import { QuickReplyChips } from './components/QuickReplyChips';
import { getMockResponse } from './data/mockConversation';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);

  // Initial greeting
  useEffect(() => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages([
        {
          id: 'init',
          isUser: false,
          text: 'Hi there! I am TripMate AI, your personal travel assistant. 🌴 How can I help you plan your next adventure today?'
        }
      ]);
      setIsTyping(false);
    }, 1000);
  }, []);

  const handleSendMessage = (text: string) => {
    // Add user message
    const newUserMsg: ChatMessage = { id: Date.now().toString(), isUser: true, text };
    setMessages(prev => [...prev, newUserMsg]);
    
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);
    setIsTyping(true);

    // Simulate network delay and get mock AI response
    setTimeout(() => {
      const response = getMockResponse(text, newCount);
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        ...response
      };
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleLeadSubmit = (name: string, phone: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        isUser: false,
        text: `Got it, ${name}! One of our travel experts will contact you at ${phone} shortly with your personalized itinerary.`
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#064E3B] to-[#0F172A] overflow-hidden font-sans">
      
      {/* Decorative SVG Background (Flight paths pattern) */}
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

        <div className="fixed bottom-[88px] left-0 right-0 z-40 max-w-3xl mx-auto flex flex-col justify-end pointer-events-none pb-safe">
          <div className="pointer-events-auto">
            {userMessageCount === 0 && !isTyping && messages.length > 0 && (
              <QuickReplyChips 
                chips={["Kerala packages", "Honeymoon trips", "Under ₹20,000"]}
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
