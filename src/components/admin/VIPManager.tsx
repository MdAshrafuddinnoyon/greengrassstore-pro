import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, Crown, Users, Settings, Star, Edit, Ban, UserCheck, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Json } from "@/integrations/supabase/types";

interface VIPTier {
  id: string;
  name: string;
  name_ar: string;
  min_spend: number;
  max_spend: number | null;
  discount_percent: number;
  color_gradient: string;
  benefits: Json;
  benefits_ar: Json;
  is_active: boolean;
  display_order: number;
  is_best_value: boolean;
}

interface EditingTier {
  id?: string;
  name?: string;
  name_ar?: string;
  min_spend?: number;
  max_spend?: number | null;
  discount_percent?: number;
  color_gradient?: string;
  benefits?: string[];
  benefits_ar?: string[];
  is_active?: boolean;
  display_order?: number;
  is_best_value?: boolean;
}

interface VIPMember {
  id: string;
  user_id: string;
  tier_id: string | null;
  total_spend: number;
  points_earned: number;
  points_redeemed: number;
  joined_at: string;
  is_active: boolean;
  tier?: VIPTier;
}

interface VIPSettings {
  id: string;
  program_name: string;
  program_name_ar: string;
  program_description: string;
  program_description_ar: string;
  hero_title: string;
  hero_title_ar: string;
  hero_subtitle: string;
  hero_subtitle_ar: string;
  is_enabled: boolean;
  points_per_aed: number;
}

const defaultTier: EditingTier = {
  name: "",
  name_ar: "",
  min_spend: 0,
  max_spend: null,
  discount_percent: 0,
  color_gradient: "from-green-400 to-green-600",
  benefits: [],
  benefits_ar: [],
  is_active: true,
  display_order: 0,
  is_best_value: false,
};

export const VIPManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<VIPTier[]>([]);
  const [members, setMembers] = useState<VIPMember[]>([]);
  const [settings, setSettings] = useState<VIPSettings | null>(null);
  const [editingTier, setEditingTier] = useState<EditingTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [benefitInput, setBenefitInput] = useState("");
  const [benefitInputAr, setBenefitInputAr] = useState("");
  
  // Member management states
  const [editingMember, setEditingMember] = useState<VIPMember | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { full_name: string; phone: string | null }>>({});

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('vip-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_tiers' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_members' }, fetchData)
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

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('vip_members')
        .select('*')
        .order('total_spend', { ascending: false });

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch profiles for member names
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', userIds);
        
        if (profilesData) {
          const profileMap: Record<string, { full_name: string; phone: string | null }> = {};
          profilesData.forEach(p => {
            profileMap[p.user_id] = { full_name: p.full_name || 'Unknown', phone: p.phone };
          });
          setMemberProfiles(profileMap);
        }
      }

    } catch (error) {
      console.error('Error fetching VIP data:', error);
      toast.error('Failed to load VIP data');
    } finally {
      setLoading(false);
    }
  };

  const saveTier = async () => {
    if (!editingTier?.name) {
      toast.error('Please enter tier name');
      return;
    }

    setSaving(true);
    try {
      const tierData = {
        name: editingTier.name,
        name_ar: editingTier.name_ar || '',
        min_spend: editingTier.min_spend || 0,
        max_spend: editingTier.max_spend,
        discount_percent: editingTier.discount_percent || 0,
        color_gradient: editingTier.color_gradient || 'from-green-400 to-green-600',
        benefits: editingTier.benefits || [],
        benefits_ar: editingTier.benefits_ar || [],
        is_active: editingTier.is_active ?? true,
        display_order: editingTier.display_order || 0,
        is_best_value: editingTier.is_best_value || false,
      };

      if (editingTier.id) {
        const { error } = await supabase
          .from('vip_tiers')
          .update(tierData)
          .eq('id', editingTier.id);
        if (error) throw error;
        toast.success('Tier updated successfully');
      } else {
        const { error } = await supabase
          .from('vip_tiers')
          .insert(tierData);
        if (error) throw error;
        toast.success('Tier created successfully');
      }

      setIsDialogOpen(false);
      setEditingTier(null);
      fetchData();
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error('Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const deleteTier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;

    try {
      const { error } = await supabase
        .from('vip_tiers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Tier deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete tier');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vip_settings')
        .update({
          program_name: settings.program_name,
          program_name_ar: settings.program_name_ar,
          program_description: settings.program_description,
          program_description_ar: settings.program_description_ar,
          hero_title: settings.hero_title,
          hero_title_ar: settings.hero_title_ar,
          hero_subtitle: settings.hero_subtitle,
          hero_subtitle_ar: settings.hero_subtitle_ar,
          is_enabled: settings.is_enabled,
          points_per_aed: settings.points_per_aed,
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('VIP settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    if (!benefitInput.trim()) return;
    setEditingTier(prev => ({
      ...prev,
      benefits: [...(prev?.benefits || []), benefitInput.trim()]
    }));
    setBenefitInput("");
  };

  const addBenefitAr = () => {
    if (!benefitInputAr.trim()) return;
    setEditingTier(prev => ({
      ...prev,
      benefits_ar: [...(prev?.benefits_ar || []), benefitInputAr.trim()]
    }));
    setBenefitInputAr("");
  };

  const removeBenefit = (index: number) => {
    setEditingTier(prev => ({
      ...prev,
      benefits: prev?.benefits?.filter((_, i) => i !== index) || []
    }));
  };

  const removeBenefitAr = (index: number) => {
    setEditingTier(prev => ({
      ...prev,
      benefits_ar: prev?.benefits_ar?.filter((_, i) => i !== index) || []
    }));
  };

  // Member management functions
  const toggleMemberStatus = async (member: VIPMember) => {
    try {
      const { error } = await supabase
        .from('vip_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      
      if (error) throw error;
      toast.success(member.is_active ? 'Member deactivated' : 'Member activated');
      fetchData();
    } catch (error) {
      console.error('Error toggling member status:', error);
      toast.error('Failed to update member status');
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this VIP member?')) return;
    
    try {
      const { error } = await supabase
        .from('vip_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      toast.success('Member removed from VIP program');
      fetchData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to remove member');
    }
  };

  const updateMemberTier = async (memberId: string, tierId: string | null) => {
    try {
      const { error } = await supabase
        .from('vip_members')
        .update({ 
          tier_id: tierId, 
          tier_updated_at: new Date().toISOString() 
        })
        .eq('id', memberId);
      
      if (error) throw error;
      toast.success('Member tier updated');
      setIsMemberDialogOpen(false);
      setEditingMember(null);
      fetchData();
    } catch (error) {
      console.error('Error updating member tier:', error);
      toast.error('Failed to update tier');
    }
  };

  const updateMemberPoints = async (memberId: string, pointsEarned: number, pointsRedeemed: number) => {
    try {
      const { error } = await supabase
        .from('vip_members')
        .update({ points_earned: pointsEarned, points_redeemed: pointsRedeemed })
        .eq('id', memberId);
      
      if (error) throw error;
      toast.success('Points updated');
      fetchData();
    } catch (error) {
      console.error('Error updating points:', error);
      toast.error('Failed to update points');
    }
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
      <Tabs defaultValue="tiers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Tiers</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Tiers Tab */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>VIP Tiers</CardTitle>
                <CardDescription>Manage membership tiers and benefits</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTier(defaultTier)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTier?.id ? 'Edit Tier' : 'Add New Tier'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name (EN)</Label>
                        <Input
                          value={editingTier?.name || ''}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name (AR)</Label>
                        <Input
                          value={editingTier?.name_ar || ''}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, name_ar: e.target.value }))}
                          placeholder="e.g., ذهبي"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Min Spend (AED)</Label>
                        <Input
                          type="number"
                          value={editingTier?.min_spend || 0}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, min_spend: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Spend (AED)</Label>
                        <Input
                          type="number"
                          value={editingTier?.max_spend || ''}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, max_spend: e.target.value ? Number(e.target.value) : null }))}
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount %</Label>
                        <Input
                          type="number"
                          value={editingTier?.discount_percent || 0}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, discount_percent: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Color Gradient</Label>
                        <Input
                          value={editingTier?.color_gradient || ''}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, color_gradient: e.target.value }))}
                          placeholder="from-green-400 to-green-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={editingTier?.display_order || 0}
                          onChange={(e) => setEditingTier(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingTier?.is_active ?? true}
                          onCheckedChange={(checked) => setEditingTier(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label>Active</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingTier?.is_best_value ?? false}
                          onCheckedChange={(checked) => setEditingTier(prev => ({ ...prev, is_best_value: checked }))}
                        />
                        <Label>Best Value Badge</Label>
                      </div>
                    </div>

                    {/* Benefits EN */}
                    <div className="space-y-2">
                      <Label>Benefits (EN)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={benefitInput}
                          onChange={(e) => setBenefitInput(e.target.value)}
                          placeholder="Add benefit..."
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                        />
                        <Button type="button" onClick={addBenefit} size="sm">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editingTier?.benefits?.map((b, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeBenefit(i)}>
                            {b} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Benefits AR */}
                    <div className="space-y-2">
                      <Label>Benefits (AR)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={benefitInputAr}
                          onChange={(e) => setBenefitInputAr(e.target.value)}
                          placeholder="إضافة ميزة..."
                          dir="rtl"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefitAr())}
                        />
                        <Button type="button" onClick={addBenefitAr} size="sm">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editingTier?.benefits_ar?.map((b, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeBenefitAr(i)}>
                            {b} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button onClick={saveTier} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Tier
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Spend Range</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${tier.color_gradient} flex items-center justify-center`}>
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{tier.name}</div>
                            <div className="text-xs text-muted-foreground">{tier.name_ar}</div>
                          </div>
                          {tier.is_best_value && <Badge variant="secondary">Best Value</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tier.min_spend} - {tier.max_spend || '∞'} AED
                      </TableCell>
                      <TableCell>{tier.discount_percent}%</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(tier.benefits as string[])?.slice(0, 2).map((b, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{b}</Badge>
                          ))}
                          {(tier.benefits as string[])?.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{(tier.benefits as string[]).length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tier.is_active ? "default" : "secondary"}>
                          {tier.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTier({
                                ...tier,
                                benefits: tier.benefits as string[],
                                benefits_ar: tier.benefits_ar as string[]
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTier(tier.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>VIP Members</CardTitle>
              <CardDescription>View and manage VIP program members</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No VIP members yet</p>
                  <p className="text-sm">Members will appear here when users join the VIP program</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Total Spend</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const memberTier = tiers.find(t => t.id === member.tier_id);
                      const profile = memberProfiles[member.user_id];
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{profile?.full_name || 'Unknown User'}</div>
                              <div className="text-xs text-muted-foreground">{profile?.phone || 'No phone'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {memberTier ? (
                              <Badge className={`bg-gradient-to-r ${memberTier.color_gradient} text-white`}>
                                {memberTier.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No Tier</Badge>
                            )}
                          </TableCell>
                          <TableCell>{member.total_spend} AED</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {member.points_earned - member.points_redeemed}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={member.is_active ? "default" : "destructive"}
                              className="cursor-pointer"
                              onClick={() => toggleMemberStatus(member)}
                            >
                              {member.is_active ? "Active" : "Banned"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingMember(member);
                                  setIsMemberDialogOpen(true);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Tier / Points
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleMemberStatus(member)}>
                                  {member.is_active ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Ban Member
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate Member
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteMember(member.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove from VIP
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Member Dialog */}
          <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit VIP Member</DialogTitle>
                <DialogDescription>
                  Update member's tier and points
                </DialogDescription>
              </DialogHeader>
              {editingMember && (
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">{memberProfiles[editingMember.user_id]?.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">Total Spend: {editingMember.total_spend} AED</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>VIP Tier</Label>
                    <Select 
                      value={editingMember.tier_id || 'none'} 
                      onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, tier_id: value === 'none' ? null : value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Tier</SelectItem>
                        {tiers.map(tier => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name} ({tier.discount_percent}% discount)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Points Earned</Label>
                      <Input
                        type="number"
                        value={editingMember.points_earned}
                        onChange={(e) => setEditingMember(prev => prev ? { ...prev, points_earned: Number(e.target.value) } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Points Redeemed</Label>
                      <Input
                        type="number"
                        value={editingMember.points_redeemed}
                        onChange={(e) => setEditingMember(prev => prev ? { ...prev, points_redeemed: Number(e.target.value) } : null)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        updateMemberTier(editingMember.id, editingMember.tier_id);
                        updateMemberPoints(editingMember.id, editingMember.points_earned, editingMember.points_redeemed);
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>VIP Program Settings</CardTitle>
                <CardDescription>Configure the VIP program details and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, is_enabled: checked } : null)}
                  />
                  <div>
                    <Label className="text-base font-medium">Enable VIP Program</Label>
                    <p className="text-sm text-muted-foreground">Show VIP program on the website</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Program Name (EN)</Label>
                    <Input
                      value={settings.program_name}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, program_name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Program Name (AR)</Label>
                    <Input
                      value={settings.program_name_ar}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, program_name_ar: e.target.value } : null)}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hero Title (EN)</Label>
                    <Input
                      value={settings.hero_title}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, hero_title: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Title (AR)</Label>
                    <Input
                      value={settings.hero_title_ar}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, hero_title_ar: e.target.value } : null)}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hero Subtitle (EN)</Label>
                    <Textarea
                      value={settings.hero_subtitle}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, hero_subtitle: e.target.value } : null)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle (AR)</Label>
                    <Textarea
                      value={settings.hero_subtitle_ar}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, hero_subtitle_ar: e.target.value } : null)}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Program Description (EN)</Label>
                    <Textarea
                      value={settings.program_description}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, program_description: e.target.value } : null)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Program Description (AR)</Label>
                    <Textarea
                      value={settings.program_description_ar}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, program_description_ar: e.target.value } : null)}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Points per AED Spent</Label>
                  <Input
                    type="number"
                    value={settings.points_per_aed}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, points_per_aed: Number(e.target.value) } : null)}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">How many points customers earn for each AED spent</p>
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};