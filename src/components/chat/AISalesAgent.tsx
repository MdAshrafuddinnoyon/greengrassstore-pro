import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
}

interface ChatbotSettings {
  enabled: boolean;
  aiEnabled: boolean;
  aiProvider: 'openai' | 'gemini' | 'lovable';
  apiKey: string;
  model: string;
  welcomeMessage: string;
  welcomeMessageAr: string;
  botName: string;
  botNameAr: string;
  systemPrompt: string;
  quickReplies: { id: string; text: string }[];
  trainingDocuments: { id: string; name: string; content: string }[];
  maxTokens: number;
  temperature: number;
  collectProductInfo: boolean;
  collectOrderInfo: boolean;
  fallbackMessage: string;
  fallbackMessageAr: string;
}

const defaultSettings: ChatbotSettings = {
  enabled: true,
  aiEnabled: false,
  aiProvider: 'lovable',
  apiKey: '',
  model: 'google/gemini-2.5-flash',
  welcomeMessage: "Hello! 👋 Welcome to our store. I'm your virtual assistant. How can I help you today?",
  welcomeMessageAr: "مرحباً! 👋 مرحباً بك في متجرنا. كيف يمكنني مساعدتك اليوم؟",
  botName: "Sales Assistant",
  botNameAr: "مساعد المبيعات",
  systemPrompt: `You are a helpful sales assistant for an e-commerce plant store. Be friendly and helpful.`,
  quickReplies: [
    { id: '1', text: 'What plants do you have?' },
    { id: '2', text: 'Do you deliver to my area?' },
    { id: '3', text: 'What are your prices?' },
    { id: '4', text: 'How to care for plants?' },
  ],
  trainingDocuments: [],
  maxTokens: 500,
  temperature: 0.7,
  collectProductInfo: true,
  collectOrderInfo: true,
  fallbackMessage: "I'd be happy to help! Could you please provide more details?",
  fallbackMessageAr: "سأكون سعيداً بمساعدتك! هل يمكنك تقديم المزيد من التفاصيل؟",
};

// Fallback keyword-based responses
const keywordResponses: Record<string, string> = {
  plants: "We have a wonderful collection including Snake Plants, Monstera, Peace Lily, Ficus, and more! 🌿 All plants come with care instructions.",
  pots: "Our pot collection includes ceramic pots, terracotta pots, modern planters, and decorative vases. 🏺 We have various sizes available!",
  delivery: "Yes! We deliver across Dubai and all UAE emirates. 🚚 Free delivery on orders above AED 200. Standard delivery takes 2-3 business days.",
  price: "Our prices start from AED 25 for small plants and AED 35 for basic pots. 💰 Check our Sale section for deals!",
  care: "Plant care tips:\n🌞 Most plants need indirect sunlight\n💧 Water when soil is dry\n🌡️ Keep away from AC vents\n🪴 Use well-draining soil",
  order: "To place an order:\n1️⃣ Add items to cart and checkout\n2️⃣ Order via WhatsApp\n3️⃣ Visit our store",
  hello: "Hello! 👋 Welcome! How can I assist you today?",
  thanks: "You're welcome! 😊 Feel free to ask if you have more questions. Happy shopping! 🌱",
};

const getKeywordResponse = (message: string, fallbackMsg: string): string => {
  const msg = message.toLowerCase();
  
  for (const [keyword, response] of Object.entries(keywordResponses)) {
    if (msg.includes(keyword)) return response;
  }
  
  // Check for common greetings
  if (/^(hi|hello|hey|salam|مرحبا)/i.test(msg)) return keywordResponses.hello;
  if (/thank/i.test(msg)) return keywordResponses.thanks;
  
  return fallbackMsg;
};

export const AISalesAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings>(defaultSettings);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [productContext, setProductContext] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch settings and product data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'chatbot_settings')
          .maybeSingle();

        if (data?.setting_value) {
          const loadedSettings = { ...defaultSettings, ...(data.setting_value as unknown as ChatbotSettings) };
          setSettings(loadedSettings);
          
          // Set initial welcome message
          setMessages([{
            id: '1',
            text: loadedSettings.welcomeMessage,
            sender: 'agent',
            timestamp: new Date()
          }]);
        } else {
          setMessages([{
            id: '1',
            text: defaultSettings.welcomeMessage,
            sender: 'agent',
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Error fetching chatbot settings:', error);
      }
    };

    const fetchProductContext = async () => {
      try {
        const { data: products } = await supabase
          .from('products')
          .select('name, price, category, description')
          .limit(50);

        if (products) {
          const productList = products.map(p => 
            `- ${p.name}: ${p.price} AED (${p.category || 'General'})`
          ).join('\n');
          setProductContext(`Our products:\n${productList}`);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchSettings();
    fetchProductContext();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    if (!settings.aiEnabled) {
      return getKeywordResponse(userMessage, settings.fallbackMessage);
    }

    try {
      // Build context from training documents
      const trainingContext = settings.trainingDocuments
        .map(doc => doc.content)
        .join('\n\n');

      const systemPrompt = `${settings.systemPrompt}

${productContext ? `\n\nProduct Information:\n${productContext}` : ''}
${trainingContext ? `\n\nAdditional Information:\n${trainingContext}` : ''}

Always be helpful, friendly, and provide accurate information based on the store's data.
If you don't know something, suggest contacting customer service.`;

      const response = await supabase.functions.invoke('chat-with-ai', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            { role: 'user', content: userMessage }
          ],
          model: settings.model,
          maxTokens: settings.maxTokens,
          temperature: settings.temperature,
          provider: settings.aiProvider,
          apiKey: settings.aiProvider !== 'lovable' ? settings.apiKey : undefined
        }
      });

      if (response.error) {
        console.error('AI Response error:', response.error);
        return getKeywordResponse(userMessage, settings.fallbackMessage);
      }

      return response.data?.response || getKeywordResponse(userMessage, settings.fallbackMessage);
    } catch (error) {
      console.error('AI Error:', error);
      return getKeywordResponse(userMessage, settings.fallbackMessage);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const responseText = await getAIResponse(text);
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: settings.fallbackMessage,
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  // Don't render if disabled
  if (!settings.enabled) return null;

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#2d5a3d] flex items-center justify-center shadow-lg shadow-[#2d5a3d]/30 text-white hover:scale-110 transition-transform"
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.8 }}
        title={`Chat with ${settings.botName}`}
      >
        {settings.aiEnabled ? (
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 sm:left-auto z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[550px] sm:max-h-[80vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border sm:border-gray-200"
          >
            {/* Header */}
            <div className="bg-[#2d5a3d] px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {settings.aiEnabled ? (
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                    {settings.botName}
                    {settings.aiEnabled && (
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">AI</span>
                    )}
                  </h3>
                  <p className="text-xs text-white/80">Online • Ready to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "agent" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2d5a3d] flex items-center justify-center flex-shrink-0">
                      {settings.aiEnabled ? (
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-[#2d5a3d] text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-line">{message.text}</p>
                    <p className={`text-[10px] sm:text-xs mt-1 ${message.sender === "user" ? "text-white/70" : "text-gray-400"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2d5a3d] flex items-center justify-center">
                    {settings.aiEnabled ? (
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                  <div className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && settings.quickReplies.length > 0 && (
              <div className="px-3 sm:px-4 py-2 bg-white border-t flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                {settings.quickReplies.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleQuickReply(reply.text)}
                    className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs bg-gray-100 hover:bg-gray-200 rounded-full whitespace-nowrap transition-colors text-gray-700"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 bg-white border-t safe-area-bottom">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border-gray-200 text-sm h-10 sm:h-auto"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isTyping}
                  className="rounded-full bg-[#2d5a3d] hover:bg-[#234830] w-10 h-10 flex-shrink-0"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3">
                {settings.aiEnabled ? '✨ Powered by AI' : 'Powered by'}{' '}
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
    </>
  );
};
