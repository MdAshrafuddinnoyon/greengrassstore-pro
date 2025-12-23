import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  RefreshCw,
  Calendar,
  Download,
  FileText
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  avgOrderValue: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCategories: { category: string; count: number }[];
}

const COLORS = ['#2d5a3d', '#4f8a5c', '#7bb982', '#a8d8a8', '#d5f0d5'];

export const AnalyticsReport = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch profiles (customers)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const totalCustomers = profiles?.length || 0;
      const totalProducts = products?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Orders by status
      const statusCounts: Record<string, number> = {};
      orders?.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Revenue by day
      const revenueByDayMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        revenueByDayMap[dateStr] = { revenue: 0, orders: 0 };
      }
      orders?.forEach(o => {
        const dateStr = new Date(o.created_at).toISOString().split('T')[0];
        if (revenueByDayMap[dateStr]) {
          revenueByDayMap[dateStr].revenue += o.total || 0;
          revenueByDayMap[dateStr].orders += 1;
        }
      });
      const revenueByDay = Object.entries(revenueByDayMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top products from orders
      const productCounts: Record<string, { quantity: number; revenue: number }> = {};
      orders?.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const name = item.name || item.title || 'Unknown';
            if (!productCounts[name]) {
              productCounts[name] = { quantity: 0, revenue: 0 };
            }
            productCounts[name].quantity += item.quantity || 1;
            productCounts[name].revenue += (item.total || item.price || 0);
          });
        }
      });
      const topProducts = Object.entries(productCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top categories
      const categoryCounts: Record<string, number> = {};
      products?.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        avgOrderValue,
        ordersByStatus,
        revenueByDay,
        topProducts,
        topCategories
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportJSON = () => {
    if (!data) return;

    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalOrders: data.totalOrders,
        totalRevenue: data.totalRevenue,
        totalCustomers: data.totalCustomers,
        totalProducts: data.totalProducts,
        avgOrderValue: data.avgOrderValue
      },
      ordersByStatus: data.ordersByStatus,
      topProducts: data.topProducts,
      topCategories: data.topCategories,
      revenueByDay: data.revenueByDay
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - Green Grass Store</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2d5a3d; padding-bottom: 20px; }
          .header h1 { color: #2d5a3d; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 10px 0 0; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .meta-item { text-align: center; }
          .meta-item label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; }
          .meta-item value { font-size: 14px; font-weight: bold; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 40px; }
          .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-card .value { font-size: 28px; font-weight: bold; color: #2d5a3d; }
          .stat-card .label { font-size: 12px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 40px; }
          .section h2 { color: #2d5a3d; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f8f9fa; font-weight: 600; color: #374151; }
          .footer { text-align: center; margin-top: 50px; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { padding: 20px; } .stats-grid { grid-template-columns: repeat(5, 1fr); } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Analytics Report</h1>
          <p>Green Grass Store - Performance Overview</p>
        </div>

        <div class="meta">
          <div class="meta-item">
            <label>Report Generated</label>
            <value>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</value>
          </div>
          <div class="meta-item">
            <label>Time Period</label>
            <value>Last ${dateRange} Days</value>
          </div>
          <div class="meta-item">
            <label>Store</label>
            <value>Green Grass Store</value>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${data.totalOrders}</div>
            <div class="label">Total Orders</div>
          </div>
          <div class="stat-card">
            <div class="value">AED ${data.totalRevenue.toFixed(0)}</div>
            <div class="label">Total Revenue</div>
          </div>
          <div class="stat-card">
            <div class="value">${data.totalCustomers}</div>
            <div class="label">Customers</div>
          </div>
          <div class="stat-card">
            <div class="value">${data.totalProducts}</div>
            <div class="label">Products</div>
          </div>
          <div class="stat-card">
            <div class="value">AED ${data.avgOrderValue.toFixed(0)}</div>
            <div class="label">Avg Order</div>
          </div>
        </div>

        <div class="section">
          <h2>📦 Orders by Status</h2>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${data.ordersByStatus.map(s => `
                <tr>
                  <td style="text-transform: capitalize;">${s.status}</td>
                  <td>${s.count}</td>
                  <td>${data.totalOrders > 0 ? ((s.count / data.totalOrders) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏆 Top Selling Products</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${data.topProducts.length > 0 ? data.topProducts.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.name}</td>
                  <td>${p.quantity}</td>
                  <td>AED ${p.revenue.toFixed(2)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align: center; color: #666;">No sales data available</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📂 Products by Category</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Product Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${data.topCategories.map(c => `
                <tr>
                  <td style="text-transform: capitalize;">${c.category}</td>
                  <td>${c.count}</td>
                  <td>${data.totalProducts > 0 ? ((c.count / data.totalProducts) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generated by Green Grass Store Admin Dashboard</p>
          <p>© ${new Date().getFullYear()} Green Grass Store. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Report</h2>
          <p className="text-gray-600">Track your store performance and sales</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportJSON}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF Report
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{data.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">AED {data.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold">{data.totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Products</p>
                    <p className="text-2xl font-bold">{data.totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order</p>
                    <p className="text-2xl font-bold">AED {data.avgOrderValue.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        formatter={(value: number) => [`AED ${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#2d5a3d" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Orders by Status</CardTitle>
                <CardDescription>Distribution of orders by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.ordersByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2d5a3d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Products</CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {data.topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center gap-4">
                        <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                        </div>
                        <span className="font-semibold text-[#2d5a3d]">
                          AED {product.revenue.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No sales data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Products by Category</CardTitle>
                <CardDescription>Distribution of products across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.topCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.topCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
