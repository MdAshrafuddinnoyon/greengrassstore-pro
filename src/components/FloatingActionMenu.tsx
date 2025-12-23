import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, MessageSquare, FileText, Send, Bot, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { CustomRequestModal } from "@/components/custom-request/CustomRequestModal";

const WHATSAPP_URL = "https://wa.me/+971547751901";

export const FloatingActionMenu = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showCustomRequest, setShowCustomRequest] = useState(false);
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);
  const [showSalesAgent, setShowSalesAgent] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");

  // Hide on admin page
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't render on admin pages
  if (isAdminRoute) {
    return null;
  }

  const handleWhatsApp = () => {
    setIsOpen(false);
    const message = "Hello! I'm interested in your products. Can you help me?";
    const encodedMessage = encodeURIComponent(message);
    window.open(`${WHATSAPP_URL}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
  };

  const handleCustomRequest = () => {
    setIsOpen(false);
    if (!user) {
      toast.error(isArabic ? "يرجى تسجيل الدخول أولاً" : "Please login first to submit a custom request");
      return;
    }
    setShowCustomRequest(true);
  };

  const handleSalesAgent = () => {
    setIsOpen(false);
    setShowSalesAgent(true);
  };

  const menuItems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      label: "WhatsApp",
      color: "bg-[#25D366]",
      onClick: handleWhatsApp,
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: isArabic ? "مساعد المبيعات" : "Sales Agent",
      color: "bg-[#2d5a3d]",
      onClick: handleSalesAgent,
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: isArabic ? "طلب مخصص" : "Custom Request",
      color: "bg-primary",
      onClick: handleCustomRequest,
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-3 sm:bottom-8 sm:right-6 z-50 lg:hidden">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/20 -z-10"
              />
              
              {/* Menu Items - Vertical aligned */}
              <div className="absolute bottom-16 right-0 flex flex-col items-end gap-3">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={item.onClick}
                    className="flex items-center gap-3"
                  >
                    <span className="bg-background text-foreground text-sm font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      {item.label}
                    </span>
                    <div className={`w-12 h-12 rounded-full ${item.color} text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.5)",
          }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Desktop floating buttons - shown on larger screens */}
      <div className="hidden lg:block">
        {/* WhatsApp Button */}
        <motion.button
          onClick={handleWhatsApp}
          className="fixed bottom-24 right-6 z-50 flex items-center group"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        >
          <span className="mr-3 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
            Chat on WhatsApp
          </span>
          <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
        </motion.button>

        {/* Sales Agent Button */}
        <motion.button
          onClick={handleSalesAgent}
          className="fixed bottom-8 right-6 z-50 w-14 h-14 rounded-full bg-[#2d5a3d] flex items-center justify-center shadow-lg shadow-[#2d5a3d]/30 text-white hover:scale-110 transition-transform"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.8 }}
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>

        {/* Custom Request Button */}
        <motion.button
          onClick={handleCustomRequest}
          className="fixed bottom-8 left-8 z-50 flex items-center gap-2 h-14 px-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 transition-transform"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
          style={{
            boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.5)",
          }}
        >
          <FileText className="w-6 h-6" />
          <span className="font-medium hidden xl:inline">
            {isArabic ? "طلب مخصص" : "Custom Request"}
          </span>
        </motion.button>
      </div>

      {/* Sales Agent Modal */}
      <SalesAgentModal isOpen={showSalesAgent} onClose={() => setShowSalesAgent(false)} />

      {/* Custom Request Modal */}
      <CustomRequestModal
        isOpen={showCustomRequest}
        onClose={() => setShowCustomRequest(false)}
        user={user ? { id: user.id, email: user.email || "" } : null}
      />
    </>
  );
};

// Sales Agent Modal Component
const SalesAgentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: "user" | "agent"; timestamp: Date }>>([
    {
      id: "1",
      text: "Hello! 👋 Welcome to Green Grass Store. I'm your virtual assistant. How can I help you today?",
      sender: "agent",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "🌿 What plants do you have?",
    "🚚 Delivery info",
    "💰 Pricing",
    "🏺 Pots collection",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAgentResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("plant") || message.includes("monstera") || message.includes("snake") || message.includes("🌿")) {
      return "We have a wonderful collection of plants! 🌿\n\n• Snake Plants - AED 45\n• Monstera Deliciosa - AED 120\n• Peace Lily - AED 65\n• Ficus Lyrata - AED 180\n• Pothos - AED 35\n\nWould you like to see our full catalog or need help choosing the perfect plant for your space?";
    }
    if (message.includes("pot") || message.includes("vase") || message.includes("ceramic") || message.includes("🏺")) {
      return "Our pot collection is amazing! 🏺\n\n• Ceramic Pots - from AED 35\n• Terracotta Pots - from AED 25\n• Modern Planters - from AED 55\n• Decorative Vases - from AED 45\n\nAll come in various sizes and colors. Would you like recommendations based on your plant type?";
    }
    if (message.includes("deliver") || message.includes("shipping") || message.includes("dubai") || message.includes("🚚")) {
      return "Great question about delivery! 🚚\n\n✅ We deliver across all UAE emirates\n✅ FREE delivery on orders above AED 200\n✅ Standard delivery: 2-3 business days\n✅ Express delivery available (AED 25)\n✅ Careful packaging for all plants\n\nNeed help placing an order?";
    }
    if (message.includes("price") || message.includes("cost") || message.includes("how much") || message.includes("💰")) {
      return "Here's our pricing guide! 💰\n\n🌱 Small Plants: AED 25-50\n🌿 Medium Plants: AED 60-150\n🌳 Large Plants: AED 180-500\n🏺 Pots: AED 25-200\n\nWe also have combo offers:\n• Plant + Pot: Save 15%\n• 3 Plants Bundle: Save 20%\n\nWant me to suggest something within your budget?";
    }
    if (message.includes("hello") || message.includes("hi") || message.includes("hey") || message.includes("সালাম") || message.includes("হ্যালো")) {
      return "Hello! 👋 Welcome to Green Grass Store!\n\nI'm here to help you find the perfect plants and pots for your space. What can I assist you with today?\n\n🌿 Browse Plants\n🏺 Explore Pots\n🚚 Delivery Info\n💰 Pricing Guide";
    }
    if (message.includes("thank") || message.includes("ধন্যবাদ")) {
      return "You're welcome! 😊\n\nIt was my pleasure helping you. Don't hesitate to reach out if you have more questions!\n\n🌱 Happy planting! 🌱\n\nYou can also:\n• Visit our shop: /shop\n• WhatsApp us: +971 54 775 1901";
    }
    if (message.includes("order") || message.includes("buy") || message.includes("purchase")) {
      return "Ready to place an order? Great! 🛒\n\nYou can:\n1️⃣ Add items to cart & checkout online\n2️⃣ WhatsApp us at +971 54 775 1901\n3️⃣ Visit our store in Dubai\n\nFor bulk orders or corporate gifts, we offer special discounts! 🎁";
    }
    if (message.includes("care") || message.includes("water") || message.includes("sunlight")) {
      return "Plant care tips! 🌱\n\n☀️ Light: Most plants love indirect sunlight\n💧 Water: Check soil before watering (usually weekly)\n🌡️ Temp: Keep away from AC vents\n🪴 Soil: Well-draining potting mix\n✂️ Pruning: Remove yellow leaves\n\nNeed specific care tips for a plant?";
    }
    if (message.includes("location") || message.includes("store") || message.includes("visit") || message.includes("address")) {
      return "Come visit us! 📍\n\n🏪 Dubai Store:\nAl Quoz Industrial Area 3\nDubai, UAE\n\n⏰ Timings:\nMon-Sat: 9 AM - 9 PM\nSunday: 10 AM - 6 PM\n\n📞 Call: +971 54 775 1901\n\nWe look forward to seeing you!";
    }
    
    return "I'd be happy to help! 🌿\n\nHere's what I can assist you with:\n• 🌱 Plant recommendations\n• 🏺 Pot selection\n• 🚚 Delivery information\n• 💰 Pricing & offers\n• 🌿 Plant care tips\n\nJust ask away!";
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        text: getAgentResponse(text),
        sender: "agent" as const,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 sm:left-auto z-[60] w-full sm:w-[400px] h-[100dvh] sm:h-[600px] sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border sm:border-gray-100"
        >
          {/* Header - Modern Gradient */}
          <div className="bg-gradient-to-r from-[#2d5a3d] via-[#3d7a4d] to-[#2d5a3d] px-4 py-4 flex items-center justify-between relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="flex items-center gap-3 relative z-10">
              <motion.div 
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-white text-lg">Sales Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-xs text-white/90">Online • Ready to help</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-all relative z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index === messages.length - 1 ? 0.1 : 0 }}
                className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "agent" && (
                  <div className="w-8 h-8 rounded-full bg-[#2d5a3d] flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.sender === "user"
                        ? "bg-gradient-to-br from-[#2d5a3d] to-[#234830] text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>
                  <span className={`text-[10px] text-gray-400 ${message.sender === "user" ? "text-right" : "text-left"}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <div className="w-8 h-8 rounded-full bg-[#2d5a3d] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 items-center">
                    <motion.span 
                      className="w-2 h-2 bg-[#2d5a3d] rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    />
                    <motion.span 
                      className="w-2 h-2 bg-[#2d5a3d] rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    />
                    <motion.span 
                      className="w-2 h-2 bg-[#2d5a3d] rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickReplies.map((reply) => (
                  <motion.button
                    key={reply}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(reply)}
                    className="px-3 py-2 text-xs bg-gray-100 hover:bg-[#2d5a3d] hover:text-white rounded-full whitespace-nowrap transition-all duration-200 font-medium"
                  >
                    {reply}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <div className="flex-1 relative">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/30 focus:border-[#2d5a3d] transition-all bg-gray-50"
                />
              </div>
              <motion.button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2d5a3d] to-[#234830] hover:from-[#234830] hover:to-[#1a3a24] text-white flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-[#2d5a3d]/20"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
            {/* Powered by */}
            <p className="text-center text-xs text-gray-400 mt-3">
              Powered by{" "}
              <a
                href="https://www.websearchbd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2d5a3d] hover:underline font-medium"
              >
                Web Search BD
              </a>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
