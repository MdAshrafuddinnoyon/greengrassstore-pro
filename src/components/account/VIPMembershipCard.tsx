import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Star, Sparkles, TrendingUp, Calendar, Gift, Percent, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface VIPTier {
  id: string;
  name: string;
  name_ar: string | null;
  discount_percent: number;
  min_spend: number;
  max_spend: number | null;
  color_gradient: string | null;
  icon: string | null;
  benefits: unknown;
  benefits_ar: unknown;
}

interface VIPMember {
  id: string;
  user_id: string;
  tier_id: string | null;
  total_spend: number;
  points_earned: number;
  points_redeemed: number;
  is_active: boolean;
  joined_at: string;
  tier_updated_at: string | null;
}

interface VIPMembershipCardProps {
  userId: string;
}

export const VIPMembershipCard = ({ userId }: VIPMembershipCardProps) => {
  const [member, setMember] = useState<VIPMember | null>(null);
  const [tier, setTier] = useState<VIPTier | null>(null);
  const [nextTier, setNextTier] = useState<VIPTier | null>(null);
  const [allTiers, setAllTiers] = useState<VIPTier[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const isArabic = language === "ar";

  useEffect(() => {
    fetchVIPData();
  }, [userId]);

  const fetchVIPData = async () => {
    try {
      // Fetch all tiers
      const { data: tiersData } = await supabase
        .from("vip_tiers")
        .select("*")
        .eq("is_active", true)
        .order("min_spend", { ascending: true });

      setAllTiers(tiersData || []);

      // Fetch member data
      const { data: memberData } = await supabase
        .from("vip_members")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (memberData) {
        setMember(memberData);

        // Find current tier
        if (memberData.tier_id && tiersData) {
          const currentTier = tiersData.find(t => t.id === memberData.tier_id);
          setTier(currentTier || null);

          // Find next tier
          if (currentTier) {
            const currentIndex = tiersData.findIndex(t => t.id === currentTier.id);
            if (currentIndex < tiersData.length - 1) {
              setNextTier(tiersData[currentIndex + 1]);
            }
          }
        } else if (tiersData && tiersData.length > 0) {
          // Determine tier based on total spend
          const currentTier = tiersData.find(t => 
            memberData.total_spend >= t.min_spend && 
            (!t.max_spend || memberData.total_spend < t.max_spend)
          );
          setTier(currentTier || tiersData[0]);
          
          const currentIndex = tiersData.findIndex(t => t.id === currentTier?.id);
          if (currentIndex < tiersData.length - 1) {
            setNextTier(tiersData[currentIndex + 1]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching VIP data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('vip-member-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vip_members',
          filter: `user_id=eq.${userId}`
        },
        () => fetchVIPData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!member || !tier) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isArabic ? "انضم لبرنامج VIP" : "Join VIP Program"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isArabic ? "احصل على خصومات ومزايا حصرية" : "Get exclusive discounts and benefits"}
            </p>
          </div>
        </div>
        <a 
          href="/vip" 
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {isArabic ? "اعرف المزيد" : "Learn More"} →
        </a>
      </motion.div>
    );
  }

  const tierName = isArabic && tier.name_ar ? tier.name_ar : tier.name;
  const progressToNext = nextTier 
    ? Math.min(((member.total_spend - tier.min_spend) / (nextTier.min_spend - tier.min_spend)) * 100, 100)
    : 100;
  const amountToNextTier = nextTier ? Math.max(nextTier.min_spend - member.total_spend, 0) : 0;

  // Calculate expiry date (1 year from tier update)
  const tierUpdateDate = member.tier_updated_at ? new Date(member.tier_updated_at) : new Date(member.joined_at);
  const expiryDate = new Date(tierUpdateDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const expiryMonth = expiryDate.toLocaleString('default', { month: '2-digit' });
  const expiryYear = expiryDate.getFullYear().toString().slice(-2);

  // Card number format (using member id)
  const cardNumber = member.id.replace(/-/g, '').slice(0, 16).toUpperCase();
  const formattedCardNumber = cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber;

  const getTierGradient = () => {
    const gradients: Record<string, string> = {
      'Green': 'from-emerald-600 via-emerald-500 to-green-400',
      'Gold': 'from-amber-600 via-yellow-500 to-amber-400',
      'Platinum': 'from-slate-700 via-slate-500 to-slate-400',
    };
    return gradients[tier.name] || 'from-primary via-primary/80 to-primary/60';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.5 }}
      className="relative perspective-1000"
    >
      {/* Main Card - Credit Card Style */}
      <div className={cn(
        "relative w-full max-w-md aspect-[1.6/1] rounded-2xl overflow-hidden shadow-2xl",
        "bg-gradient-to-br",
        getTierGradient()
      )}>
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
        </div>

        {/* Card Content */}
        <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-lg sm:text-xl font-bold tracking-wide">{tierName}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider">
                {isArabic ? "عضوية VIP" : "VIP Membership"}
              </p>
            </div>
            <div className="flex gap-1">
              {[...Array(tier.name === 'Platinum' ? 3 : tier.name === 'Gold' ? 2 : 1)].map((_, i) => (
                <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-white/80" />
              ))}
            </div>
          </div>

          {/* Card Number */}
          <div className="my-4 sm:my-6">
            <p className="font-mono text-lg sm:text-xl tracking-[0.15em] text-white/90">
              {formattedCardNumber}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60 uppercase mb-0.5">
                {isArabic ? "صالح حتى" : "Valid Thru"}
              </p>
              <p className="font-mono text-sm sm:text-base">{expiryMonth}/{expiryYear}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-white/60 uppercase mb-0.5">
                {isArabic ? "الخصم" : "Discount"}
              </p>
              <p className="text-xl sm:text-2xl font-bold">{tier.discount_percent}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {isArabic ? "الإنفاق" : "Total Spend"}
          </p>
          <p className="font-semibold text-foreground">AED {member.total_spend.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
          <Gift className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {isArabic ? "النقاط" : "Points"}
          </p>
          <p className="font-semibold text-foreground">{member.points_earned - member.points_redeemed}</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
          <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {isArabic ? "المستوى" : "Level"}
          </p>
          <p className="font-semibold text-foreground">{tier.name}</p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="mt-4 bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {isArabic ? "التقدم للمستوى التالي" : "Progress to Next Tier"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isArabic ? nextTier.name_ar || nextTier.name : nextTier.name}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isArabic 
              ? `أنفق AED ${amountToNextTier.toFixed(0)} أكثر للترقية`
              : `Spend AED ${amountToNextTier.toFixed(0)} more to upgrade`
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};