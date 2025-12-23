import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, FileText, Eye, MessageSquare, FolderOpen, Megaphone, 
  Receipt, Activity, Clock, ShoppingBag, Users, Package,
  TrendingUp, RefreshCw, ArrowRight, Zap, Target, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface QuickActionsPanelProps {
  onNavigate?: (tab: string) => void;
}

interface Stats {
  pendingOrders: number;
  pendingRequests: number;
  totalCategories: number;
  totalProducts: number;
  todayOrders: number;
  newCustomers: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface RecentRequest {
  id: string;
  title: string;
  name: string;
  status: string;
  created_at: string;
}

export const QuickActionsPanel = ({ onNavigate }: QuickActionsPanelProps) => {
  const [stats, setStats] = useState<Stats>({
    pendingOrders: 0,
    pendingRequests: 0,
    totalCategories: 0,
    totalProducts: 0,
    todayOrders: 0,
    newCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time subscriptions
    const ordersChannel = supabase
      .channel('quick-actions-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('quick-actions-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_requests' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Pending requests - handle potential table issues
      let pendingRequests = 0;
      try {
        const result = await (supabase as any)
          .from('custom_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress']);
        pendingRequests = result.count || 0;
      } catch (e) {
        console.log('Custom requests table may not exist');
      }

      // Categories
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Recent requests - handle potential table issues
      let requests: RecentRequest[] = [];
      try {
        const result = await (supabase as any)
          .from('custom_requests')
          .select('id, title, name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(3);
        if (result.data) requests = result.data;
      } catch (e) {
        console.log('Custom requests table may not exist');
      }

      setStats({
        pendingOrders: pendingOrders || 0,
        pendingRequests: pendingRequests || 0,
        totalCategories: totalCategories || 0,
        totalProducts: totalProducts || 0,
        todayOrders: 0,
        newCustomers: 0
      });

      setRecentOrders(orders || []);
      setRecentRequests(requests || []);
    } catch (error) {
      console.error('Error fetching quick actions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Plus,
      title: "Add Product",
      description: "Create new product",
      tab: "products",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      shadowColor: "shadow-emerald-500/30",
    },
    {
      icon: FileText,
      title: "New Blog Post",
      description: "Write article",
      tab: "blog",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      shadowColor: "shadow-purple-500/30",
    },
    {
      icon: Eye,
      title: "View Orders",
      description: `${stats.pendingOrders} pending`,
      tab: "orders",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/30",
    },
    {
      icon: MessageSquare,
      title: "View Requests",
      description: `${stats.pendingRequests} pending`,
      tab: "requests",
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
      shadowColor: "shadow-pink-500/30",
    },
    {
      icon: FolderOpen,
      title: "Categories",
      description: `${stats.totalCategories} active`,
      tab: "categories",
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
      shadowColor: "shadow-teal-500/30",
    },
    {
      icon: Megaphone,
      title: "Announcements",
      description: "Update top bar",
      tab: "announcements",
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
      shadowColor: "shadow-amber-500/30",
    },
  ];

  const handleQuickAction = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'processing': case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Quick Actions
          </h2>
          <p className="text-sm text-muted-foreground">Fast access to common tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Action Buttons */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuickAction(action.tab)}
                className={`flex flex-col items-center gap-2 md:gap-3 p-4 md:p-5 rounded-2xl ${action.color} text-white transition-all hover:scale-105 shadow-xl ${action.shadowColor}`}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="text-center">
                  <span className="text-xs md:text-sm font-bold block">{action.title}</span>
                  <span className="text-[10px] md:text-xs text-white/80">{action.description}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                Recent Orders
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order, idx) => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all cursor-pointer group"
                    onClick={() => handleQuickAction('orders')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <Badge className={`text-[10px] border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">AED {Number(order.total).toFixed(0)}</span>
                    </div>
                  </motion.div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 text-sm text-muted-foreground hover:text-primary"
                  onClick={() => handleQuickAction('orders')}
                >
                  View All Orders <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-pink-600" />
                </div>
                Custom Requests
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((request, idx) => (
                  <motion.div 
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all cursor-pointer group"
                    onClick={() => handleQuickAction('requests')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {request.title || 'Custom Request'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{request.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(request.created_at), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                    <Badge className={`text-[10px] border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </motion.div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 text-sm text-muted-foreground hover:text-primary"
                  onClick={() => handleQuickAction('requests')}
                >
                  View All Requests <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-xs text-muted-foreground">Pending Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950 dark:to-pink-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
