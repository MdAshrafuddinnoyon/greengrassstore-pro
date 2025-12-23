import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Crown, Gift, Percent, Truck, Star, Sparkles, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface VIPTier {
  id: string;
  name: string;
  name_ar: string;
  min_spend: number;
  max_spend: number | null;
  discount_percent: number;
  color_gradient: string;
  benefits: any;
  benefits_ar: any;
  is_best_value: boolean;
  display_order: number;
}

interface VIPSettings {
  program_name: string;
  program_name_ar: string;
  program_description: string;
  program_description_ar: string;
  hero_title: string;
  hero_title_ar: string;
  hero_subtitle: string;
  hero_subtitle_ar: string;
  is_enabled: boolean;
}

interface VIPMembership {
  id: string;
  tier_id: string | null;
  total_spend: number;
  points_earned: number;
  points_redeemed: number;
}

const VIPProgram = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tiers, setTiers] = useState<VIPTier[]>([]);
  const [settings, setSettings] = useState<VIPSettings | null>(null);
  const [membership, setMembership] = useState<VIPMembership | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();

    // Check auth state
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchMembership(data.user.id);
      }
    });

    // Real-time subscription
    const channel = supabase
      .channel('vip-public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_tiers' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_settings' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('vip_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (tiersError) throw tiersError;
      setTiers(tiersData || []);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('vip_settings')
        .select('*')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching VIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vip_members')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMembership(data);
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  const handleJoinVIP = async () => {
    if (!user) {
      toast.info(isArabic ? 'يرجى تسجيل الدخول للانضمام' : 'Please login to join');
      navigate('/auth');
      return;
    }

    if (membership) {
      toast.info(isArabic ? 'أنت عضو بالفعل!' : 'You are already a member!');
      return;
    }

    setJoining(true);
    try {
      // Get the first tier (lowest tier)
      const firstTier = tiers.length > 0 ? tiers[0] : null;

      const { error } = await supabase
        .from('vip_members')
        .insert({
          user_id: user.id,
          tier_id: firstTier?.id || null,
          total_spend: 0,
          points_earned: 0,
          points_redeemed: 0,
        });

      if (error) throw error;
      
      toast.success(isArabic ? 'مرحباً بك في برنامج VIP!' : 'Welcome to the VIP Program!');
      fetchMembership(user.id);
    } catch (error: any) {
      console.error('Error joining VIP:', error);
      if (error.code === '23505') {
        toast.info(isArabic ? 'أنت عضو بالفعل!' : 'You are already a member!');
      } else {
        toast.error(isArabic ? 'فشل الانضمام' : 'Failed to join');
      }
    } finally {
      setJoining(false);
    }
  };

  const currentTier = membership && tiers.find(t => t.id === membership.tier_id);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!settings?.is_enabled) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">
              {isArabic ? 'برنامج VIP غير متاح حالياً' : 'VIP Program Coming Soon'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'يرجى التحقق لاحقاً' : 'Please check back later'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isArabic ? "rtl" : "ltr"}>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2d5a3d] via-[#3d7a52] to-[#1a3d28] text-white py-24">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">
                  {isArabic ? 'عضوية حصرية' : 'Exclusive Membership'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
                {isArabic ? settings.hero_title_ar : settings.hero_title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                {isArabic ? settings.hero_subtitle_ar : settings.hero_subtitle}
              </p>
              
              {membership ? (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentTier?.color_gradient || 'from-green-400 to-green-600'} flex items-center justify-center`}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-white/70">{isArabic ? 'مستواك الحالي' : 'Your Current Tier'}</p>
                      <p className="text-xl font-bold">{isArabic ? currentTier?.name_ar : currentTier?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{membership.total_spend}</p>
                      <p className="text-sm text-white/70">AED {isArabic ? 'إجمالي الإنفاق' : 'Total Spend'}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{membership.points_earned - membership.points_redeemed}</p>
                      <p className="text-sm text-white/70">{isArabic ? 'النقاط المتاحة' : 'Points Available'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-6 text-lg rounded-xl"
                  onClick={handleJoinVIP}
                  disabled={joining}
                >
                  {joining ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  {isArabic ? 'انضم لبرنامج VIP' : 'Join VIP Program'}
                </Button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Benefits */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-[#2d5a3d] font-semibold text-sm uppercase tracking-wider">
                {isArabic ? 'مزايا حصرية' : 'Exclusive Benefits'}
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mt-3">
                {isArabic ? 'لماذا تنضم لبرنامج VIP؟' : 'Why Join Our VIP Program?'}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { icon: Percent, title: isArabic ? "خصومات حصرية" : "Exclusive Discounts", desc: isArabic ? "خصم يصل إلى 15% على جميع المشتريات" : "Up to 15% off on all purchases" },
                { icon: Truck, title: isArabic ? "توصيل مجاني" : "Free Delivery", desc: isArabic ? "شحن مجاني على جميع الطلبات" : "Free shipping on all orders" },
                { icon: Gift, title: isArabic ? "مكافآت عيد الميلاد" : "Birthday Rewards", desc: isArabic ? "هدية خاصة في عيد ميلادك" : "Special gift on your birthday" },
                { icon: Clock, title: isArabic ? "وصول مبكر" : "Early Access", desc: isArabic ? "تسوق الجديد قبل الجميع" : "Shop new arrivals before anyone" },
              ].map((benefit, idx) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-2xl bg-[#2d5a3d]/10 flex items-center justify-center group-hover:bg-[#2d5a3d] transition-colors">
                    <benefit.icon className="w-7 h-7 md:w-8 md:h-8 text-[#2d5a3d] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm md:text-base">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-[#2d5a3d] font-semibold text-sm uppercase tracking-wider">
                {isArabic ? 'مستويات العضوية' : 'Membership Tiers'}
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mt-3">
                {isArabic ? 'اختر مستواك' : 'Choose Your Level'}
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                {isArabic 
                  ? 'كلما تسوقت أكثر، كلما ربحت أكثر. تقدم عبر المستويات بناءً على إنفاقك السنوي.'
                  : 'The more you shop, the more you earn. Progress through tiers based on your annual spending.'}
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              {tiers.map((tier, idx) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative bg-white rounded-3xl shadow-lg overflow-hidden ${tier.is_best_value ? 'ring-2 ring-[#2d5a3d]' : ''} ${currentTier?.id === tier.id ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  {tier.is_best_value && (
                    <div className="absolute top-4 right-4 bg-[#2d5a3d] text-white text-xs font-bold px-3 py-1 rounded-full">
                      {isArabic ? 'أفضل قيمة' : 'BEST VALUE'}
                    </div>
                  )}
                  {currentTier?.id === tier.id && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      {isArabic ? 'مستواك' : 'YOUR TIER'}
                    </div>
                  )}
                  <div className={`h-2 bg-gradient-to-r ${tier.color_gradient}`} />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${tier.color_gradient} flex items-center justify-center`}>
                        <Crown className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                          {isArabic ? tier.name_ar : tier.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isArabic ? 'الإنفاق السنوي:' : 'Annual Spend:'} {tier.min_spend} - {tier.max_spend || '∞'} AED
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-2xl md:text-3xl font-bold text-[#2d5a3d] mb-4">
                      {tier.discount_percent}% {isArabic ? 'خصم' : 'OFF'}
                    </div>
                    
                    <ul className="space-y-3 md:space-y-4 mt-6 md:mt-8">
                      {((isArabic ? tier.benefits_ar : tier.benefits) as string[])?.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#2d5a3d]/10 flex items-center justify-center flex-shrink-0">
                            <Star className="w-3 h-3 text-[#2d5a3d]" />
                          </div>
                          <span className="text-gray-700 text-sm md:text-base">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {!membership && (
                      <Button 
                        className={`w-full mt-6 md:mt-8 ${tier.is_best_value ? 'bg-[#2d5a3d] hover:bg-[#234830]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                        onClick={handleJoinVIP}
                        disabled={joining}
                      >
                        {idx === 0 ? (isArabic ? 'ابدأ هنا' : 'Start Here') : (isArabic ? 'ترقية الآن' : 'Upgrade Now')}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-[#f8f7f4]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-[#2d5a3d] font-semibold text-sm uppercase tracking-wider">
                {isArabic ? 'عملية بسيطة' : 'Simple Process'}
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mt-3">
                {isArabic ? 'كيف يعمل' : 'How It Works'}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "01", title: isArabic ? "سجل" : "Sign Up", desc: isArabic ? "أنشئ حساب VIP مجاني في ثوانٍ" : "Create your free VIP account in seconds" },
                { step: "02", title: isArabic ? "تسوق واكسب" : "Shop & Earn", desc: isArabic ? "كل عملية شراء تقربك من المستوى التالي" : "Every purchase moves you closer to the next tier" },
                { step: "03", title: isArabic ? "استمتع بالمزايا" : "Enjoy Benefits", desc: isArabic ? "افتح الامتيازات والمكافآت الحصرية" : "Unlock exclusive perks and rewards" },
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl md:text-6xl font-bold text-[#2d5a3d]/20 mb-4">{item.step}</div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        {!membership && (
          <section className="py-20 bg-gradient-to-br from-[#2d5a3d] to-[#1a3d28] text-white">
            <div className="container mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6 text-yellow-400" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
                  {isArabic ? 'هل أنت مستعد لتصبح VIP؟' : 'Ready to Become a VIP?'}
                </h2>
                <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  {isArabic 
                    ? 'انضم اليوم وابدأ في كسب المكافآت مع أول عملية شراء.'
                    : 'Join today and start earning rewards with your very first purchase.'}
                </p>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-10 py-6 text-lg rounded-xl"
                  onClick={handleJoinVIP}
                  disabled={joining}
                >
                  {joining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {isArabic ? 'انضم الآن - مجاناً' : "Join Now – It's Free"}
                </Button>
              </motion.div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default VIPProgram;