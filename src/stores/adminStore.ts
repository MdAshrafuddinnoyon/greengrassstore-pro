import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'store_manager' | 'user';

interface AdminStore {
  isAdmin: boolean;
  isModerator: boolean;
  isStoreManager: boolean;
  userRole: AppRole | null;
  isLoading: boolean;
  
  checkRole: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  canAccessAdmin: () => boolean;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  isAdmin: false,
  isModerator: false,
  isStoreManager: false,
  userRole: null,
  isLoading: true,

  checkRole: async () => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ isAdmin: false, isModerator: false, isStoreManager: false, userRole: null, isLoading: false });
        return;
      }

      // Check for admin role
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      // Check for moderator role
      const { data: modRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'moderator')
        .maybeSingle();

      // Check for store_manager role
      const { data: storeManagerRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'store_manager')
        .maybeSingle();

      const isAdmin = !!adminRole;
      const isModerator = !!modRole;
      const isStoreManager = !!storeManagerRole;
      
      let userRole: AppRole = 'user';
      if (isAdmin) userRole = 'admin';
      else if (isStoreManager) userRole = 'store_manager';
      else if (isModerator) userRole = 'moderator';

      set({ 
        isAdmin, 
        isModerator,
        isStoreManager,
        userRole,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error checking role:', error);
      set({ isAdmin: false, isModerator: false, isStoreManager: false, userRole: null, isLoading: false });
    }
  },

  hasRole: (role) => {
    const { isAdmin, isModerator, isStoreManager } = get();
    if (role === 'admin') return isAdmin;
    if (role === 'store_manager') return isAdmin || isStoreManager;
    if (role === 'moderator') return isAdmin || isStoreManager || isModerator;
    return true; // 'user' role
  },

  canAccessAdmin: () => {
    const { isAdmin, isModerator, isStoreManager } = get();
    return isAdmin || isModerator || isStoreManager;
  },
}));
