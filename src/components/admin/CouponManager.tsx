import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Ticket, RefreshCw, Copy, Percent, DollarSign } from "lucide-react";
import { ExportButtons } from "./ExportButtons";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses?: number;
  used_count: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
}

export const CouponManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCoupons((data || []) as Coupon[]);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCoupons(); 

    // Real-time subscription for coupons
    const channel = supabase
      .channel('admin-coupons-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discount_coupons' },
        () => {
          fetchCoupons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditingCoupon({ ...editingCoupon, code });
  };

  const handleSave = async () => {
    if (!editingCoupon?.code) { 
      toast.error('Coupon code is required'); 
      return; 
    }
    if (!editingCoupon?.discount_value || editingCoupon.discount_value <= 0) { 
      toast.error('Discount value must be greater than 0'); 
      return; 
    }
    
    setSaving(true);
    try {
      const couponData = {
        code: editingCoupon.code.toUpperCase().trim(),
        description: editingCoupon.description || null,
        discount_type: editingCoupon.discount_type || 'percentage',
        discount_value: editingCoupon.discount_value || 0,
        min_order_amount: editingCoupon.min_order_amount || 0,
        max_uses: editingCoupon.max_uses || null,
        is_active: editingCoupon.is_active ?? true,
        starts_at: editingCoupon.starts_at || null,
        expires_at: editingCoupon.expires_at || null,
      };

      if (editingCoupon.id) {
        const { error } = await supabase
          .from('discount_coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('discount_coupons')
          .insert(couponData);
        if (error) throw error;
      }

      toast.success('Coupon saved successfully');
      setIsDialogOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Coupon code already exists');
      } else {
        toast.error('Failed to save coupon');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const { error } = await supabase.from('discount_coupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleDuplicate = (coupon: Coupon) => {
    setEditingCoupon({
      ...coupon,
      id: undefined,
      code: `${coupon.code}-COPY`,
      used_count: 0,
    });
    setIsDialogOpen(true);
  };

  const openNewCoupon = () => {
    setEditingCoupon({
      is_active: true,
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
    });
    setIsDialogOpen(true);
  };

  const filtered = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Discount Coupons ({coupons.length})
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchCoupons}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <ExportButtons 
              data={coupons.map(c => ({
                code: c.code,
                description: c.description || '',
                type: c.discount_type,
                value: c.discount_type === 'percentage' ? `${c.discount_value}%` : `AED ${c.discount_value}`,
                min_order: `AED ${c.min_order_amount}`,
                max_uses: c.max_uses || 'Unlimited',
                used: c.used_count,
                status: c.is_active ? 'Active' : 'Inactive',
                expires: c.expires_at ? format(new Date(c.expires_at), 'yyyy-MM-dd') : 'Never',
              }))} 
              filename={`coupons-${new Date().toISOString().split('T')[0]}`}
            />
            <Button size="sm" onClick={openNewCoupon}>
              <Plus className="w-4 h-4 mr-1" />
              Add Coupon
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Input 
          placeholder="Search coupons..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="mb-4" 
        />
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(coupon => (
                <TableRow key={coupon.id} className={isExpired(coupon) ? 'opacity-50' : ''}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {coupon.discount_type === 'percentage' ? (
                        <><Percent className="w-3 h-3" /> Percentage</>
                      ) : (
                        <><DollarSign className="w-3 h-3" /> Fixed</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `AED ${coupon.discount_value}`}
                  </TableCell>
                  <TableCell>AED {coupon.min_order_amount}</TableCell>
                  <TableCell>
                    {coupon.used_count} / {coupon.max_uses || '∞'}
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at 
                      ? format(new Date(coupon.expires_at), 'MMM dd, yyyy')
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {isExpired(coupon) ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : coupon.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditingCoupon(coupon); setIsDialogOpen(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(coupon)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(coupon.id)} 
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No coupons found. Create your first discount coupon!
          </div>
        )}
      </CardContent>

      {/* Coupon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCoupon?.id ? 'Edit' : 'Add'} Coupon</DialogTitle>
          </DialogHeader>
          
          {editingCoupon && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input 
                    value={editingCoupon.code || ''} 
                    onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER20"
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={editingCoupon.description || ''} 
                  onChange={e => setEditingCoupon({...editingCoupon, description: e.target.value})}
                  placeholder="Summer sale discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select 
                    value={editingCoupon.discount_type} 
                    onValueChange={v => setEditingCoupon({...editingCoupon, discount_type: v as 'percentage' | 'fixed'})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={editingCoupon.discount_value || ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, discount_value: parseFloat(e.target.value) || 0})}
                      placeholder={editingCoupon.discount_type === 'percentage' ? '10' : '50'}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {editingCoupon.discount_type === 'percentage' ? '%' : 'AED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Order Amount</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={editingCoupon.min_order_amount || ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, min_order_amount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">AED</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Uses (leave empty for unlimited)</Label>
                  <Input 
                    type="number" 
                    value={editingCoupon.max_uses || ''} 
                    onChange={e => setEditingCoupon({...editingCoupon, max_uses: parseInt(e.target.value) || undefined})}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="datetime-local" 
                    value={editingCoupon.starts_at ? editingCoupon.starts_at.slice(0, 16) : ''} 
                    onChange={e => setEditingCoupon({...editingCoupon, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input 
                    type="datetime-local" 
                    value={editingCoupon.expires_at ? editingCoupon.expires_at.slice(0, 16) : ''} 
                    onChange={e => setEditingCoupon({...editingCoupon, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch 
                  checked={editingCoupon.is_active} 
                  onCheckedChange={c => setEditingCoupon({...editingCoupon, is_active: c})} 
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Coupon
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
