import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, TrendingUp, ShoppingBag, Package, Receipt, BarChart3, MessageSquare, DollarSign, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  totalRequests: number;
  pendingRequests: number;
  totalUsers: number;
  totalViews: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCategories: number;
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
  completedOrders: number;
}


interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface DashboardOverviewProps {
  onNavigate?: (tab: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DashboardOverview = ({ onNavigate }: DashboardOverviewProps) => {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    totalRequests: 0,
    pendingRequests: 0,
    totalUsers: 0,
    totalViews: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCategories: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Fetch blog posts count
      const { count: totalPosts } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true });

      const { count: publishedPosts } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Fetch total views
      const { data: viewsData } = await supabase
        .from("blog_posts")
        .select("view_count");
      
      const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

      // Fetch custom requests count
      const { count: totalRequests } = await supabase
        .from("custom_requirements")
        .select("*", { count: "exact", head: true });

      const { count: pendingRequests } = await supabase
        .from("custom_requirements")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch profiles count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch products count
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Fetch orders count and revenue
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: completedOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["completed", "delivered"]);

      // Fetch total revenue
      const { data: revenueData } = await supabase
        .from("orders")
        .select("total")
        .in("status", ["completed", "delivered", "processing"]);
      
      const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;

      // Fetch today's orders and revenue
      const { data: todayOrdersData } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", startOfToday)
        .lte("created_at", endOfToday);

      const todayRevenue = todayOrdersData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
      const todayOrdersCount = todayOrdersData?.length || 0;

      // Fetch categories count
      const { count: totalCategories } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true });


      // Fetch last 7 days revenue data for chart
      const last7Days: DailyRevenue[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();
        
        const { data: dayOrders } = await supabase
          .from("orders")
          .select("total")
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);

        last7Days.push({
          date: format(date, 'MMM d'),
          revenue: dayOrders?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0,
          orders: dayOrders?.length || 0
        });
      }

      // Fetch order status distribution
      const { data: statusData } = await supabase
        .from("orders")
        .select("status");

      const statusCounts: Record<string, number> = {};
      statusData?.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusArray = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      setStats({
        totalPosts: totalPosts || 0,
        publishedPosts: publishedPosts || 0,
        totalRequests: totalRequests || 0,
        pendingRequests: pendingRequests || 0,
        totalUsers: totalUsers || 0,
        totalViews,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalCategories: totalCategories || 0,
        totalRevenue,
        todayRevenue,
        todayOrders: todayOrdersCount,
        completedOrders: completedOrders || 0,
      });

      setDailyRevenue(last7Days);
      setOrderStatus(statusArray);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchStats();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('dashboard-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_requirements' }, () => {
        fetchStats();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('dashboard-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchStats();
      })
      .subscribe();

    const usersChannel = supabase
      .channel('dashboard-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `AED ${stats.totalRevenue.toLocaleString()}`,
      subtext: `Today: AED ${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
      trend: stats.todayRevenue > 0 ? 'up' : 'neutral',
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      subtext: `${stats.pendingOrders} pending • ${stats.todayOrders} today`,
      icon: Receipt,
      color: "bg-blue-500",
      bgGradient: "from-blue-500/10 to-blue-500/5",
      trend: stats.todayOrders > 0 ? 'up' : 'neutral',
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      subtext: "Active products",
      icon: Package,
      color: "bg-purple-500",
      bgGradient: "from-purple-500/10 to-purple-500/5",
    },
    {
      title: "Registered Users",
      value: stats.totalUsers,
      subtext: "Total accounts",
      icon: Users,
      color: "bg-orange-500",
      bgGradient: "from-orange-500/10 to-orange-500/5",
    },
    {
      title: "Custom Requests",
      value: stats.totalRequests,
      subtext: `${stats.pendingRequests} pending`,
      icon: MessageSquare,
      color: "bg-pink-500",
      bgGradient: "from-pink-500/10 to-pink-500/5",
    },
    {
      title: "Blog Posts",
      value: stats.totalPosts,
      subtext: `${stats.publishedPosts} published • ${stats.totalViews} views`,
      icon: FileText,
      color: "bg-teal-500",
      bgGradient: "from-teal-500/10 to-teal-500/5",
    },
  ];


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'completed': case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time statistics and analytics</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`bg-gradient-to-br ${stat.bgGradient} border-0 shadow-sm hover:shadow-md transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-2xl font-bold">{loading ? "..." : stat.value}</span>
                {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="h-[200px] md:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                  <YAxis fontSize={12} tickMargin={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              Order Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="h-[200px] md:h-[250px]">
              {orderStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {orderStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Activity className="w-8 h-8 mr-2 opacity-50" />
                  No order data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Orders Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
            Daily Orders (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="h-[180px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} tickMargin={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};