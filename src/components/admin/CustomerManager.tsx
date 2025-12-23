import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Users, Search, Eye, Phone, MapPin, Calendar, ShoppingBag, 
  Trash2, UserPlus, Download, Upload, FileSpreadsheet, RefreshCw, Crown,
  Edit, Mail, Key, Copy, MessageSquare, Send
} from "lucide-react";
import { ExportButtons } from "./ExportButtons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
  is_vip?: boolean;
  vip_tier?: string;
}

interface VIPTier {
  id: string;
  name: string;
  color_gradient: string;
}

export const CustomerManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Add customer dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    country: ""
  });
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // CSV Import
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // VIP Management
  const [vipTiers, setVipTiers] = useState<VIPTier[]>([]);
  const [vipDialogOpen, setVipDialogOpen] = useState(false);
  const [customerForVip, setCustomerForVip] = useState<Customer | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("");

  // Edit Customer Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerForEdit, setCustomerForEdit] = useState<Customer | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Password Reset Dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [customerForReset, setCustomerForReset] = useState<Customer | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [passwordChangeType, setPasswordChangeType] = useState<'link' | 'direct'>('link');
  const [newPassword, setNewPassword] = useState("");

  // Send Message Dialog
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [customerForMessage, setCustomerForMessage] = useState<Customer | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total');

      if (ordersError) throw ordersError;

      // Fetch VIP members
      const { data: vipMembers } = await supabase
        .from('vip_members')
        .select('user_id, tier_id, is_active');

      // Fetch VIP tiers
      const { data: tiersData } = await supabase
        .from('vip_tiers')
        .select('id, name, color_gradient')
        .eq('is_active', true)
        .order('display_order');

      if (tiersData) setVipTiers(tiersData);

      const statsMap = new Map<string, { count: number; total: number }>();
      orders?.forEach(order => {
        if (order.user_id) {
          const existing = statsMap.get(order.user_id) || { count: 0, total: 0 };
          statsMap.set(order.user_id, {
            count: existing.count + 1,
            total: existing.total + Number(order.total || 0)
          });
        }
      });

      const vipMap = new Map<string, { tier_id: string | null; is_active: boolean }>();
      vipMembers?.forEach(member => {
        vipMap.set(member.user_id, { tier_id: member.tier_id, is_active: member.is_active });
      });

      const customersWithStats = profiles?.map(profile => {
        const vipInfo = vipMap.get(profile.user_id);
        const tierInfo = vipInfo?.tier_id ? tiersData?.find(t => t.id === vipInfo.tier_id) : null;
        return {
          ...profile,
          email: '',
          orders_count: statsMap.get(profile.user_id)?.count || 0,
          total_spent: statsMap.get(profile.user_id)?.total || 0,
          is_vip: vipInfo?.is_active || false,
          vip_tier: tierInfo?.name || null
        };
      }) || [];

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    // Real-time subscription for customers
    const channel = supabase
      .channel('admin-customers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchCustomers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCustomers = customers.filter(c =>
    (c.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer.user_id);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.full_name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setAddLoading(true);
    try {
      const tempUserId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: tempUserId,
          full_name: newCustomer.full_name,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          city: newCustomer.city || null,
          country: newCustomer.country || null
        });

      if (error) throw error;

      toast.success("Customer added successfully");
      setIsAddDialogOpen(false);
      setNewCustomer({ full_name: "", phone: "", address: "", city: "", country: "" });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error("Failed to add customer");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success("Customer deleted successfully");
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error("Failed to delete customer");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) return;
    
    try {
      const { error } = await supabase.from('profiles').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} customers deleted`);
      setSelectedIds([]);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customers');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCustomers.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Edit Customer
  const handleEditCustomer = async () => {
    if (!customerForEdit) return;
    if (!customerForEdit.full_name?.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setEditLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: customerForEdit.full_name,
          phone: customerForEdit.phone || null,
          address: customerForEdit.address || null,
          city: customerForEdit.city || null,
          country: customerForEdit.country || null,
        })
        .eq('user_id', customerForEdit.user_id);

      if (profileError) throw profileError;

      toast.success('Customer updated successfully');
      setEditDialogOpen(false);
      setCustomerForEdit(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(error?.message || 'Failed to update customer');
    } finally {
      setEditLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!customerForReset?.user_id) return;

    setResetLoading(true);
    try {
      if (passwordChangeType === 'direct') {
        if (!newPassword || newPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          setResetLoading(false);
          return;
        }

        // Use edge function for admin password reset
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: { 
            action: 'update_password',
            user_id: customerForReset.user_id,
            password: newPassword
          }
        });

        if (error) throw error;
        toast.success(`Password updated successfully for ${customerForReset.full_name}`);
      } else {
        // Generate password reset link
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: { 
            action: 'generate_reset_link',
            user_id: customerForReset.user_id
          }
        });

        if (error) throw error;

        if (data?.reset_link) {
          await navigator.clipboard.writeText(data.reset_link);
          toast.success(`Password reset link copied to clipboard`);
        } else {
          toast.success(`Password reset link generated`);
        }
      }

      setResetPasswordDialogOpen(false);
      setCustomerForReset(null);
      setNewPassword('');
      setPasswordChangeType('link');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  // Send Message to Customer (placeholder - needs customer_messages table)
  const handleSendMessage = async () => {
    if (!customerForMessage || !adminMessage.trim()) {
      toast.error('Message is required');
      return;
    }

    setMessageLoading(true);
    try {
      // For now, show success - actual messaging requires customer_messages table migration
      toast.success('Message feature requires database setup. Please contact support.');
      setMessageDialogOpen(false);
      setCustomerForMessage(null);
      setAdminMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error?.message || 'Failed to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  // VIP Management
  const handleAddToVip = async () => {
    if (!customerForVip) return;
    
    try {
      const { data: existing } = await supabase
        .from('vip_members')
        .select('id')
        .eq('user_id', customerForVip.user_id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('vip_members')
          .update({ 
            tier_id: selectedTier || null, 
            is_active: true,
            tier_updated_at: new Date().toISOString()
          })
          .eq('user_id', customerForVip.user_id);
        
        if (error) throw error;
        toast.success('VIP membership updated');
      } else {
        const { error } = await supabase
          .from('vip_members')
          .insert({
            user_id: customerForVip.user_id,
            tier_id: selectedTier || null,
            is_active: true,
            total_spend: customerForVip.total_spent || 0
          });
        
        if (error) throw error;
        toast.success('Customer added to VIP program');
      }
      
      setVipDialogOpen(false);
      setCustomerForVip(null);
      setSelectedTier("");
      fetchCustomers();
    } catch (error) {
      console.error('Error adding to VIP:', error);
      toast.error('Failed to update VIP status');
    }
  };

  const handleRemoveFromVip = async (userId: string) => {
    if (!confirm('Remove this customer from VIP program?')) return;
    
    try {
      const { error } = await supabase
        .from('vip_members')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success('Customer removed from VIP program');
      fetchCustomers();
    } catch (error) {
      console.error('Error removing from VIP:', error);
      toast.error('Failed to remove from VIP');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const customersToImport = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const customer: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            customer[header] = values[index] || '';
          });

          if (customer.full_name || customer.name) {
            customersToImport.push({
              user_id: crypto.randomUUID(),
              full_name: customer.full_name || customer.name,
              phone: customer.phone || null,
              address: customer.address || null,
              city: customer.city || null,
              country: customer.country || null
            });
          }
        }

        if (customersToImport.length === 0) {
          toast.error("No valid customers found in CSV");
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .insert(customersToImport);

        if (error) throw error;

        toast.success(`${customersToImport.length} customers imported successfully`);
        setIsImportDialogOpen(false);
        fetchCustomers();
      } catch (error) {
        console.error('Error importing CSV:', error);
        toast.error("Failed to import customers");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getExportData = () => {
    return filteredCustomers.map(c => ({
      Name: c.full_name || '',
      Phone: c.phone || '',
      Address: c.address || '',
      City: c.city || '',
      Country: c.country || '',
      Orders: c.orders_count || 0,
      'Total Spent (AED)': (c.total_spent || 0).toFixed(2),
      'Joined Date': new Date(c.created_at).toLocaleDateString()
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Customer Management
              </CardTitle>
              <CardDescription>
                Manage your store customers, their profiles, passwords and communications
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fetchCustomers}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-1" />
                Add Customer
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Import from CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ExportButtons 
                data={getExportData()} 
                filename="customers" 
                label="Export"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedIds.length === paginatedCustomers.length && paginatedCustomers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>VIP Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No customers found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(customer.id)}
                          onCheckedChange={() => toggleSelectOne(customer.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.full_name || 'No name'}</div>
                        <div className="text-xs text-muted-foreground">{customer.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {customer.city || customer.country || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.is_vip ? (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white cursor-pointer" onClick={() => {
                            setCustomerForVip(customer);
                            setSelectedTier("");
                            setVipDialogOpen(true);
                          }}>
                            <Crown className="w-3 h-3 mr-1" />
                            {customer.vip_tier || 'VIP'}
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => {
                              setCustomerForVip(customer);
                              setSelectedTier("");
                              setVipDialogOpen(true);
                            }}
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Add VIP
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.orders_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          AED {(customer.total_spent || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomerForEdit({ ...customer });
                              setEditDialogOpen(true);
                            }}
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomerForReset(customer);
                              setResetPasswordDialogOpen(true);
                            }}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomerForMessage(customer);
                              setMessageDialogOpen(true);
                            }}
                            title="Send Message"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          {customer.is_vip && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700"
                              onClick={() => handleRemoveFromVip(customer.user_id)}
                              title="Remove from VIP"
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setCustomerToDelete(customer);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Full Name *</Label>
              <Input
                id="customer-name"
                value={newCustomer.full_name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-city">City</Label>
                <Input
                  id="customer-city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Dubai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-country">Country</Label>
                <Input
                  id="customer-country"
                  value={newCustomer.country}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="UAE"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={addLoading}>
              {addLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Customer
            </DialogTitle>
          </DialogHeader>
          {customerForEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={customerForEdit.full_name || ''}
                  onChange={(e) => setCustomerForEdit({ ...customerForEdit, full_name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={customerForEdit.phone || ''}
                  onChange={(e) => setCustomerForEdit({ ...customerForEdit, phone: e.target.value })}
                  placeholder="+971 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={customerForEdit.address || ''}
                  onChange={(e) => setCustomerForEdit({ ...customerForEdit, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={customerForEdit.city || ''}
                    onChange={(e) => setCustomerForEdit({ ...customerForEdit, city: e.target.value })}
                    placeholder="Dubai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={customerForEdit.country || ''}
                    onChange={(e) => setCustomerForEdit({ ...customerForEdit, country: e.target.value })}
                    placeholder="UAE"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCustomer} disabled={editLoading}>
              {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          {customerForReset && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{customerForReset.full_name || 'Unknown Customer'}</p>
              </div>
              
              <Tabs value={passwordChangeType} onValueChange={(v) => setPasswordChangeType(v as 'link' | 'direct')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="link">
                    <Mail className="w-4 h-4 mr-2" />
                    Reset Link
                  </TabsTrigger>
                  <TabsTrigger value="direct">
                    <Key className="w-4 h-4 mr-2" />
                    Set Password
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="link" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate a password reset link that you can send to the customer.
                  </p>
                </TabsContent>
                <TabsContent value="direct" className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResetPasswordDialogOpen(false);
              setNewPassword('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {passwordChangeType === 'link' ? 'Generate Link' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Send Message to Customer
            </DialogTitle>
          </DialogHeader>
          {customerForMessage && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{customerForMessage.full_name || 'Unknown Customer'}</p>
                <p className="text-sm text-muted-foreground">{customerForMessage.phone || 'No phone'}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageDialogOpen(false);
              setAdminMessage('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={messageLoading}>
              {messageLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedCustomer.full_name || 'No name'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedCustomer.address || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">City</Label>
                  <p className="font-medium">{selectedCustomer.city || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{selectedCustomer.country || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Order History ({customerOrders.length})</h4>
                {ordersLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No orders found</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge>{order.status}</Badge>
                          <p className="font-medium mt-1">AED {order.total?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Customers from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: full_name, phone, address, city, country
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* VIP Assignment Dialog */}
      <Dialog open={vipDialogOpen} onOpenChange={setVipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              {customerForVip?.is_vip ? 'Update VIP Membership' : 'Add to VIP Program'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">{customerForVip?.full_name || 'Unknown Customer'}</p>
              <p className="text-sm text-muted-foreground">Total Spent: AED {(customerForVip?.total_spent || 0).toFixed(2)}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Select VIP Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {vipTiers.map(tier => (
                    <SelectItem key={tier.id} value={tier.id}>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        {tier.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToVip} className="bg-gradient-to-r from-yellow-500 to-amber-600">
              <Crown className="w-4 h-4 mr-2" />
              {customerForVip?.is_vip ? 'Update VIP' : 'Add to VIP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};