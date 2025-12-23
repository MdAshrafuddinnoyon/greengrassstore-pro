import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppSettings {
  enabled: boolean;
  demoMode: boolean;
  phoneNumber: string;
  defaultMessage: string;
  defaultMessageAr: string;
}

const defaultWhatsAppSettings: WhatsAppSettings = {
  enabled: true,
  demoMode: true,
  phoneNumber: "+971547751901",
  defaultMessage: "Hello! I'm interested in your products. Can you help me?",
  defaultMessageAr: "مرحبًا! أنا مهتم بمنتجاتكم."
};

interface WhatsAppButtonProps {
  message?: string;
}

export const WhatsAppButton = ({ message }: WhatsAppButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [settings, setSettings] = useState<WhatsAppSettings>(defaultWhatsAppSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'social_integrations')
          .maybeSingle();
        
        if (data?.setting_value) {
          const socialSettings = data.setting_value as any;
          if (socialSettings?.whatsapp) {
            setSettings({ ...defaultWhatsAppSettings, ...socialSettings.whatsapp });
          }
        }
      } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const WHATSAPP_URL = `https://wa.me/${settings.phoneNumber.replace(/[^0-9+]/g, '')}`;
  
  const handleSendMessage = () => {
    const messageToSend = customMessage.trim() || message || settings.defaultMessage;
    const encodedMessage = encodeURIComponent(messageToSend);
    const whatsappUrl = `${WHATSAPP_URL}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setCustomMessage("");
    setIsOpen(false);
  };

  const openWhatsAppDirectly = () => {
    const messageToSend = message || settings.defaultMessage;
    const encodedMessage = encodeURIComponent(messageToSend);
    const whatsappUrl = `${WHATSAPP_URL}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const quickMessages = [
    "I need help with my order",
    "Product availability inquiry",
    "Delivery time question",
    "Return/Exchange request",
  ];

  // Don't render if WhatsApp is disabled
  if (!settings.enabled) {
    return null;
  }

  return (
    <>
      {/* Chat Widget - Mobile Responsive */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-32 z-[60] w-auto sm:w-80 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-[#25D366] p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Green Grass Store</h3>
                    <p className="text-xs text-white/80">
                      {settings.demoMode ? "Demo Mode" : "Usually replies instantly"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-3 sm:p-4 bg-[#E5DDD5] min-h-[140px] sm:min-h-[180px]">
              {/* Welcome Message */}
              <div className="bg-white rounded-lg p-2.5 sm:p-3 shadow-sm max-w-[85%]">
                <p className="text-xs sm:text-sm text-gray-700">
                  👋 Hello! Welcome to Green Grass Store. How can we help you today?
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">Just now</span>
              </div>

              {/* Quick Messages */}
              <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                <p className="text-xs text-gray-500 text-center">Quick messages:</p>
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {quickMessages.map((msg, index) => (
                    <button
                      key={index}
                      onClick={() => setCustomMessage(msg)}
                      className="text-[10px] sm:text-xs bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:bg-[#20BD5A] transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button - Positioned above bottom nav on mobile */}
      <motion.button
        onClick={() => isOpen ? setIsOpen(false) : openWhatsAppDirectly()}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-[60] flex items-center group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        title="Click to chat on WhatsApp"
      >
        {/* Tooltip */}
        <span className="mr-3 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
          Chat on WhatsApp
        </span>
        
        <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-5 h-5 sm:w-7 sm:h-7"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
      </motion.button>
    </>
  );
};

// WhatsApp Order Button for product pages
interface WhatsAppOrderButtonProps {
  productName: string;
  productPrice: string;
  variant?: string;
  quantity?: number;
  className?: string;
}

export const WhatsAppOrderButton = ({ 
  productName, 
  productPrice, 
  variant, 
  quantity = 1,
  className = "" 
}: WhatsAppOrderButtonProps) => {
  const [phoneNumber, setPhoneNumber] = useState("+971547751901");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'social_integrations')
          .maybeSingle();
        
        if (data?.setting_value) {
          const socialSettings = data.setting_value as any;
          if (socialSettings?.whatsapp?.phoneNumber) {
            setPhoneNumber(socialSettings.whatsapp.phoneNumber);
          }
        }
      } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleClick = () => {
    const message = `Hi! I want to order:\n\n🛒 Product: ${productName}\n${variant ? `📦 Variant: ${variant}\n` : ''}💰 Price: ${productPrice}\n📊 Quantity: ${quantity}\n\nPlease confirm availability and process my order.`;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-[#25D366]/20 transition-colors ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      Order via WhatsApp
    </motion.button>
  );
};