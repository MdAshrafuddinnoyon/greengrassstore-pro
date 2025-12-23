import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MessengerSettings {
  enabled: boolean;
  messengerChatEnabled: boolean;
  pageId: string;
  messengerLink: string;
}

export const MessengerButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<MessengerSettings | null>(null);

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
          if (socialSettings?.facebook) {
            setSettings(socialSettings.facebook);
          }
        }
      } catch (error) {
        console.error('Error fetching Messenger settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Don't render if Messenger chat is disabled
  if (!settings?.enabled || !settings?.messengerChatEnabled || !settings?.pageId) {
    return null;
  }

  const openMessenger = () => {
    // Open Messenger link
    const messengerUrl = settings.messengerLink || `https://m.me/${settings.pageId}`;
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-32 z-[60] w-auto sm:w-80 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-[#0084FF] p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Chat with us</h3>
                    <p className="text-xs text-white/80">via Facebook Messenger</p>
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
            <div className="p-4 bg-gray-50 min-h-[120px]">
              <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                <p className="text-sm text-gray-700">
                  👋 Hello! Click below to chat with us on Facebook Messenger.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-3 bg-white border-t">
              <button
                onClick={openMessenger}
                className="w-full py-2.5 bg-[#0084FF] hover:bg-[#006ADF] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Open Messenger
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-24 left-3 sm:left-6 z-[60] flex items-center group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.7 }}
        title="Chat on Messenger"
      >
        <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#0084FF] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200">
          <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        {/* Tooltip */}
        <span className="ml-3 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
          Chat on Messenger
        </span>
      </motion.button>
    </>
  );
};
