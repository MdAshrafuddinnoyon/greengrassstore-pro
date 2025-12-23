import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'store_manager' | 'moderator' | 'user';

export interface RolePermissions {
  // Products
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  
  // Orders
  canViewOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;
  
  // Customers
  canViewCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canManageVIP: boolean;
  
  // Blog
  canViewBlog: boolean;
  canCreateBlog: boolean;
  canEditBlog: boolean;
  canDeleteBlog: boolean;
  
  // Categories
  canViewCategories: boolean;
  canEditCategories: boolean;
  
  // Users & Roles
  canViewUsers: boolean;
  canEditUserRoles: boolean;
  canCreateStaff: boolean;
  
  // Site Settings
  canEditSettings: boolean;
  canEditBranding: boolean;
  canEditPayments: boolean;
  canManageMedia: boolean;
  
  // Analytics
  canViewAnalytics: boolean;
  canViewReports: boolean;
  
  // Coupons & Discounts
  canManageCoupons: boolean;
  
  // Homepage & Content
  canEditHomepage: boolean;
  canManagePopups: boolean;
  canManageAnnouncements: boolean;
}

const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    // Full access to everything
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewOrders: true,
    canEditOrders: true,
    canDeleteOrders: true,
    canViewCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canManageVIP: true,
    canViewBlog: true,
    canCreateBlog: true,
    canEditBlog: true,
    canDeleteBlog: true,
    canViewCategories: true,
    canEditCategories: true,
    canViewUsers: true,
    canEditUserRoles: true,
    canCreateStaff: true,
    canEditSettings: true,
    canEditBranding: true,
    canEditPayments: true,
    canManageMedia: true,
    canViewAnalytics: true,
    canViewReports: true,
    canManageCoupons: true,
    canEditHomepage: true,
    canManagePopups: true,
    canManageAnnouncements: true,
  },
  store_manager: {
    // Can manage products, orders, and inventory
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewOrders: true,
    canEditOrders: true,
    canDeleteOrders: false,
    canViewCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: false,
    canManageVIP: true,
    canViewBlog: true,
    canCreateBlog: true,
    canEditBlog: true,
    canDeleteBlog: true,
    canViewCategories: true,
    canEditCategories: true,
    canViewUsers: false,
    canEditUserRoles: false,
    canCreateStaff: false,
    canEditSettings: false,
    canEditBranding: false,
    canEditPayments: false,
    canManageMedia: true,
    canViewAnalytics: true,
    canViewReports: true,
    canManageCoupons: true,
    canEditHomepage: false,
    canManagePopups: false,
    canManageAnnouncements: false,
  },
  moderator: {
    // Limited access - mainly orders and blog
    canViewProducts: true,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewOrders: true,
    canEditOrders: true,
    canDeleteOrders: false,
    canViewCustomers: true,
    canEditCustomers: false,
    canDeleteCustomers: false,
    canManageVIP: false,
    canViewBlog: true,
    canCreateBlog: true,
    canEditBlog: true,
    canDeleteBlog: false,
    canViewCategories: true,
    canEditCategories: false,
    canViewUsers: false,
    canEditUserRoles: false,
    canCreateStaff: false,
    canEditSettings: false,
    canEditBranding: false,
    canEditPayments: false,
    canManageMedia: false,
    canViewAnalytics: true,
    canViewReports: false,
    canManageCoupons: false,
    canEditHomepage: false,
    canManagePopups: false,
    canManageAnnouncements: false,
  },
  user: {
    // No admin access
    canViewProducts: false,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewOrders: false,
    canEditOrders: false,
    canDeleteOrders: false,
    canViewCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    canManageVIP: false,
    canViewBlog: false,
    canCreateBlog: false,
    canEditBlog: false,
    canDeleteBlog: false,
    canViewCategories: false,
    canEditCategories: false,
    canViewUsers: false,
    canEditUserRoles: false,
    canCreateStaff: false,
    canEditSettings: false,
    canEditBranding: false,
    canEditPayments: false,
    canManageMedia: false,
    canViewAnalytics: false,
    canViewReports: false,
    canManageCoupons: false,
    canEditHomepage: false,
    canManagePopups: false,
    canManageAnnouncements: false,
  },
};

export const useRolePermissions = () => {
  const [role, setRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS.user);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole('user');
          setPermissions(DEFAULT_PERMISSIONS.user);
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        let userRole = (roleData?.role as UserRole) || 'user';

        // If no role found, check if this is the first user/admin
        // First user gets admin role automatically
        if (!roleData && user.id) {
          try {
            const { data: allRoles, error: checkError } = await supabase
              .from('user_roles')
              .select('user_id')
              .limit(1);

            // If no roles exist in the database yet, this is the first admin
            if (!checkError && (!allRoles || allRoles.length === 0)) {
              // Create admin role for this user
              const { error: insertError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: user.id,
                  role: 'admin'
                });

              if (!insertError) {
                userRole = 'admin';
                console.log('First admin user detected - assigned admin role');
              }
            } else {
              // Roles exist but this user isn't in them
              // Check if this user is the first profile (store owner)
              const { data: firstProfile } = await supabase
                .from('profiles')
                .select('user_id')
                .order('created_at', { ascending: true })
                .limit(1);

              if (firstProfile && firstProfile[0]?.user_id === user.id) {
                // This is the store owner - assign admin role
                const { error: insertError } = await supabase
                  .from('user_roles')
                  .insert({
                    user_id: user.id,
                    role: 'admin'
                  });

                if (!insertError) {
                  userRole = 'admin';
                  console.log('Store owner detected - assigned admin role');
                }
              }
            }
          } catch (error) {
            console.error('Error checking for first user:', error);
          }
        }

        setUserId(user.id);
        setRole(userRole);
        setPermissions(DEFAULT_PERMISSIONS[userRole]);
        
        // Debug log
        console.log(`✅ User authenticated - Role: ${userRole}, canViewCustomers: ${DEFAULT_PERMISSIONS[userRole].canViewCustomers}`);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
        setPermissions(DEFAULT_PERMISSIONS.user);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Subscribe to role changes
    const channel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        () => {
          fetchUserRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission];
  };

  const isAdmin = role === 'admin';
  const isStoreManager = role === 'store_manager';
  const isModerator = role === 'moderator';
  const isStaff = isAdmin || isStoreManager || isModerator;

  return {
    role,
    permissions,
    loading,
    userId,
    hasPermission,
    isAdmin,
    isStoreManager,
    isModerator,
    isStaff,
  };
};
