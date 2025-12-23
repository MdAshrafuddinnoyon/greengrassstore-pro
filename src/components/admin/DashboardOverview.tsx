import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, TrendingUp, ShoppingBag, Package, Receipt, Plus, Eye, BarChart3, MessageSquare, FolderOpen, Megaphone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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

interface DashboardOverviewProps {
  onNavigate?: (tab: string) => void;
}

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
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
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

        // Fetch profiles count (as proxy for users)
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch products count
        const { count: totalProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        // Fetch orders count
        const { count: totalOrders } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });

        const { count: pendingOrders } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Fetch categories count
        const { count: totalCategories } = await supabase
          .from("categories")
          .select("*", { count: "exact", head: true });

        // Fetch recent orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, order_number, customer_name, total, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch recent requests
        const { data: requestsData } = await supabase
          .from("custom_requirements")
          .select("id, title, name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

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
        });

        setRecentOrders(ordersData || []);
        setRecentRequests(requestsData || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      subtext: "Active products",
      icon: Package,
      color: "bg-emerald-500",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      subtext: `${stats.pendingOrders} pending`,
      icon: Receipt,
      color: "bg-blue-500",
      bgGradient: "from-blue-500/10 to-blue-500/5",
    },
    {
      title: "Blog Posts",
      value: stats.totalPosts,
      subtext: `${stats.publishedPosts} published`,
      icon: FileText,
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
      title: "Categories",
      value: stats.totalCategories,
      subtext: "Active categories",
      icon: FolderOpen,
      color: "bg-teal-500",
      bgGradient: "from-teal-500/10 to-teal-500/5",
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      title: "Add Product",
      description: "Create new product",
      tab: "products",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      icon: FileText,
      title: "New Blog Post",
      description: "Write article",
      tab: "blog",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      icon: Eye,
      title: "View Orders",
      description: `${stats.pendingOrders} pending`,
      tab: "orders",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: MessageSquare,
      title: "View Requests",
      description: `${stats.pendingRequests} pending`,
      tab: "requests",
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      icon: FolderOpen,
      title: "Categories",
      description: "Manage categories",
      tab: "categories",
      color: "bg-teal-500 hover:bg-teal-600",
    },
    {
      icon: Megaphone,
      title: "Announcements",
      description: "Update top bar",
      tab: "announcements",
      color: "bg-amber-500 hover:bg-amber-600",
    },
  ];

  const handleQuickAction = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'completed': case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
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
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stat.value}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.tab)}
                className={`flex flex-col items-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl ${action.color} text-white transition-all hover:scale-105 shadow-lg`}
              >
                <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                <div className="text-center">
                  <span className="text-xs md:text-sm font-semibold block">{action.title}</span>
                  <span className="text-[10px] md:text-xs text-white/80 hidden sm:block">{action.description}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {recentOrders.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <Receipt className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 md:p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge className={`text-[10px] ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                      <span className="text-xs font-semibold">AED {Number(order.total).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleQuickAction("orders")}
                  className="w-full mt-2 text-sm text-primary hover:underline flex items-center justify-center gap-1"
                >
                  View All Orders →
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
              Custom Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {recentRequests.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 md:p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{request.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{request.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(request.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
                <button
                  onClick={() => handleQuickAction("requests")}
                  className="w-full mt-2 text-sm text-primary hover:underline flex items-center justify-center gap-1"
                >
                  View All Requests →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};