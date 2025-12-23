import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, User, RefreshCw, Pencil, Trash2, Ban, Plus, ShieldX, Key, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExportButtons } from "./ExportButtons";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  email?: string;
  address?: string | null;
  created_at: string;
  role?: string;
  is_blocked?: boolean;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  is_active: boolean;
}

export const UsersManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Blocked IPs state (stored in site_settings)
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [newIP, setNewIP] = useState({ ip: "", reason: "" });

  // Password reset state
  const [passwordResetUser, setPasswordResetUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);

  // User emails from auth
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "blocked_ips")
        .single();

      if (data?.setting_value) {
        setBlockedIPs(data.setting_value as unknown as BlockedIP[]);
      }
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
    }
  };

  const fetchUserEmails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });

      if (response.data?.users) {
        const emailMap: Record<string, string> = {};
        response.data.users.forEach((u: { id: string; email: string }) => {
          emailMap[u.id] = u.email;
        });
        setUserEmails(emailMap);
      }
    } catch (error) {
      console.error("Error fetching user emails:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordResetUser) return;
    
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setResetLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'update_password',
          userId: passwordResetUser.user_id,
          password: newPassword
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success("Password updated successfully");
      setShowPasswordResetDialog(false);
      setPasswordResetUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUserViaAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;

    try {
      const response = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete_user',
          userId: userId
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success("User deleted successfully");
      fetchUsers();
      fetchUserEmails();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBlockedIPs();
    fetchUserEmails();

    // Real-time subscription for users and roles
    const channel = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (newRole === "user") {
        if (existingRole) {
          await supabase.from("user_roles").delete().eq("user_id", userId);
        }
      } else {
        const roleValue = newRole as "admin" | "moderator" | "store_manager" | "user";
        if (existingRole) {
          await supabase.from("user_roles").update({ role: roleValue }).eq("user_id", userId);
        } else {
          await supabase.from("user_roles").insert([{ user_id: userId, role: roleValue }]);
        }
      }

      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const updateUserProfile = async () => {
    if (!editingUser) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          city: editingUser.city,
          address: editingUser.address,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete their profile.")) return;

    try {
      // Delete from profiles first (this will cascade or fail if there are dependencies)
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;

      // Also delete role if exists
      await supabase.from("user_roles").delete().eq("user_id", userId);

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user. The user may have related data.");
    }
  };

  const saveBlockedIPs = async (ips: BlockedIP[]) => {
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "blocked_ips")
        .single();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ setting_value: JSON.parse(JSON.stringify(ips)) })
          .eq("setting_key", "blocked_ips");
      } else {
        await supabase
          .from("site_settings")
          .insert({ setting_key: "blocked_ips", setting_value: JSON.parse(JSON.stringify(ips)) });
      }

      setBlockedIPs(ips);
      toast.success("Blocked IPs updated");
    } catch (error) {
      console.error("Error saving blocked IPs:", error);
      toast.error("Failed to update blocked IPs");
    }
  };

  const addBlockedIP = () => {
    if (!newIP.ip) {
      toast.error("Please enter an IP address");
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipRegex.test(newIP.ip)) {
      toast.error("Please enter a valid IP address");
      return;
    }

    const newEntry: BlockedIP = {
      id: Date.now().toString(),
      ip_address: newIP.ip,
      reason: newIP.reason || "Manually blocked",
      blocked_at: new Date().toISOString(),
      is_active: true,
    };

    saveBlockedIPs([...blockedIPs, newEntry]);
    setNewIP({ ip: "", reason: "" });
  };

  const removeBlockedIP = (id: string) => {
    saveBlockedIPs(blockedIPs.filter((ip) => ip.id !== id));
  };

  const toggleBlockedIP = (id: string) => {
    saveBlockedIPs(
      blockedIPs.map((ip) => (ip.id === id ? { ...ip, is_active: !ip.is_active } : ip))
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "store_manager": return "bg-purple-500";
      case "moderator": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm) ||
      u.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // State for adding new admin/moderator/store manager
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "moderator" | "store_manager">("store_manager");
  const [addingUser, setAddingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string, role: string} | null>(null);

  const handleAddUserWithRole = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (!newUserPassword.trim() || newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setAddingUser(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail.trim(),
        password: newUserPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newUserName || newUserEmail.split('@')[0]
          }
        }
      });

      if (authError) throw authError;
      
      if (authData.user) {
        // Wait a moment for the profile trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Assign role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ user_id: authData.user.id, role: newUserRole }]);

        if (roleError) {
          console.error("Role assignment error:", roleError);
        }

        // Update profile name if provided
        if (newUserName) {
          await supabase
            .from("profiles")
            .update({ full_name: newUserName })
            .eq("user_id", authData.user.id);
        }

        setCreatedCredentials({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        });

        toast.success(`${newUserRole} account created successfully!`);
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered. Please assign the role from the user list.");
      } else {
        toast.error(error.message || "Failed to create user");
      }
    } finally {
      setAddingUser(false);
    }
  };

  const resetAddUserForm = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserName("");
    setNewUserRole("store_manager");
    setCreatedCredentials(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Users & Security
            </CardTitle>
            <CardDescription>Manage user accounts, roles, and security settings</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { resetAddUserForm(); setShowAddUser(true); }} className="gap-1">
              <Plus className="w-4 h-4" />
              Add Staff Account
            </Button>
            <Button variant="outline" size="sm" onClick={() => { fetchUsers(); fetchBlockedIPs(); }}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <ExportButtons
              data={users.map((u) => ({
                name: u.full_name || "Unknown",
                phone: u.phone || "-",
                city: u.city || "-",
                address: u.address || "-",
                role: u.role || "user",
                joined: new Date(u.created_at).toLocaleDateString(),
              }))}
              filename={`users-${new Date().toISOString().split("T")[0]}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add User Dialog */}
        <Dialog open={showAddUser} onOpenChange={(open) => { if (!open) resetAddUserForm(); setShowAddUser(open); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Staff Account</DialogTitle>
            </DialogHeader>
            
            {createdCredentials ? (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">✓ Account Created Successfully!</p>
                  <p className="text-xs text-green-700">Share these credentials securely with the staff member:</p>
                </div>
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-mono text-sm">{createdCredentials.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Password</Label>
                    <p className="font-mono text-sm">{createdCredentials.password}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <Badge className={getRoleBadgeColor(createdCredentials.role)}>{createdCredentials.role}</Badge>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => { resetAddUserForm(); setShowAddUser(false); }}>Done</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Staff member name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="text"
                    placeholder="Minimum 6 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Staff member will use this to login</p>
                </div>
                <div className="space-y-2">
                  <Label>Select Role *</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "moderator" | "store_manager")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Full Access)</SelectItem>
                      <SelectItem value="store_manager">Store Manager (Products & Orders)</SelectItem>
                      <SelectItem value="moderator">Moderator (Content Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role Permissions</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                    {newUserRole === "admin" ? (
                      <ul className="space-y-1 text-muted-foreground">
                        <li>✓ Full access to all admin features</li>
                        <li>✓ Manage products, orders, users</li>
                        <li>✓ Site settings and configuration</li>
                        <li>✓ Create/remove other staff</li>
                      </ul>
                    ) : newUserRole === "store_manager" ? (
                      <ul className="space-y-1 text-muted-foreground">
                        <li>✓ Manage products and inventory</li>
                        <li>✓ View and manage orders</li>
                        <li>✓ View customer information</li>
                        <li>✓ Manage categories</li>
                        <li>✗ Cannot change site settings</li>
                        <li>✗ Cannot manage other users</li>
                      </ul>
                    ) : (
                      <ul className="space-y-1 text-muted-foreground">
                        <li>✓ Manage blog posts</li>
                        <li>✓ View orders (read-only)</li>
                        <li>✓ View customer information</li>
                        <li>✗ Cannot manage products</li>
                        <li>✗ Cannot change site settings</li>
                        <li>✗ Cannot manage other users</li>
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { resetAddUserForm(); setShowAddUser(false); }}>Cancel</Button>
                  <Button onClick={handleAddUserWithRole} disabled={addingUser}>
                    {addingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="gap-1">
              <User className="w-4 h-4" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1">
              <ShieldX className="w-4 h-4" />
              IP Blocking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Input
              placeholder="Search users by name, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{user.full_name || "Unknown User"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {userEmails[user.user_id] || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.phone || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.city || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role || "user")}>{user.role || "user"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Select
                              value={user.role || "user"}
                              onValueChange={(value) => updateUserRole(user.user_id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="store_manager">Store Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reset Password"
                              onClick={() => {
                                setPasswordResetUser(user);
                                setNewPassword("");
                                setConfirmPassword("");
                                setShowPasswordResetDialog(true);
                              }}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Profile"
                              onClick={() => {
                                setEditingUser(user);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              title="Delete User"
                              onClick={() => handleDeleteUserViaAdmin(user.user_id)}
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
            )}
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-900 flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  IP Blocking
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Block specific IP addresses from accessing your store. Use with caution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input
                    value={newIP.ip}
                    onChange={(e) => setNewIP({ ...newIP, ip: e.target.value })}
                    placeholder="192.168.1.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Input
                    value={newIP.reason}
                    onChange={(e) => setNewIP({ ...newIP, reason: e.target.value })}
                    placeholder="Suspicious activity"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addBlockedIP} className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Block IP
                  </Button>
                </div>
              </div>

              {blockedIPs.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ip_address}</TableCell>
                        <TableCell>{ip.reason}</TableCell>
                        <TableCell>{formatDate(ip.blocked_at)}</TableCell>
                        <TableCell>
                          <Badge variant={ip.is_active ? "destructive" : "secondary"}>
                            {ip.is_active ? "Blocked" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={ip.is_active}
                              onCheckedChange={() => toggleBlockedIP(ip.id)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeBlockedIP(ip.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {blockedIPs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No IPs blocked yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.full_name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={editingUser.city || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editingUser.address || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateUserProfile} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {passwordResetUser?.full_name || 'this user'}
              {userEmails[passwordResetUser?.user_id || ''] && (
                <span className="block text-sm mt-1">
                  Email: {userEmails[passwordResetUser?.user_id || '']}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordResetDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordReset} 
              disabled={resetLoading || !newPassword || newPassword !== confirmPassword}
            >
              {resetLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
