import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Sync customers from existing orders to profiles table
 * This ensures all customers who placed orders are visible in Customer Management
 */
export const syncOrderCustomersToProfiles = async () => {
  try {
    console.log('🔄 Starting customer sync from orders...');
    
    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) throw ordersError;
    
    if (!orders || orders.length === 0) {
      console.log('No orders found');
      return { success: true, synced: 0, message: 'No orders to sync' };
    }

    console.log(`Found ${orders.length} orders`);

    // Get existing profiles to avoid duplicates
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email');
    
    if (profilesError) {
      console.warn('Could not fetch existing profiles:', profilesError);
      // Continue anyway
    }

    const existingEmails = new Set((existingProfiles || []).map((p: any) => p.email).filter(Boolean));
    const existingUserIds = new Set((existingProfiles || []).map((p: any) => p.user_id).filter(Boolean));

    // Build unique customers from orders
    const customersToCreate: Record<string, any> = {};
    
    orders.forEach((order: any) => {
      // Use order customer_name and customer_email
      const email = order.customer_email?.trim() || `guest-${Date.now()}@guest.local`;
      const name = order.customer_name?.trim() || 'Guest Customer';
      const phone = order.customer_phone?.trim() || null;
      const address = order.customer_address?.trim() || null;
      const city = order.customer_city || null;
      const country = order.customer_country || 'UAE';

      // Skip if email already exists as a profile
      if (existingEmails.has(email)) {
        console.log(`✓ Customer already exists: ${email}`);
        return;
      }

      // Create unique ID for this customer
      if (!customersToCreate[email]) {
        customersToCreate[email] = {
          user_id: order.user_id || `guest_${Date.now()}_${Math.random()}`,
          full_name: name,
          email: email,
          phone: phone,
          address: address,
          city: city,
          country: country,
          created_at: new Date().toISOString()
        };
      }
    });

    const customersArray = Object.values(customersToCreate);
    console.log(`📊 Found ${customersArray.length} new customers to create`);

    if (customersArray.length === 0) {
      console.log('✅ All customers already synced');
      return { success: true, synced: 0, message: 'All customers already synced' };
    }

    // Insert new customers
    const { error: insertError, data: insertedData } = await supabase
      .from('profiles')
      .insert(customersArray)
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Successfully synced ${customersArray.length} customers`);
    
    return {
      success: true,
      synced: customersArray.length,
      message: `Synced ${customersArray.length} customers from orders`,
      data: insertedData
    };
  } catch (error: any) {
    console.error('❌ Error syncing customers:', error);
    const message = error?.message || 'Failed to sync customers';
    toast.error(`Sync failed: ${message}`);
    return { success: false, synced: 0, message, error };
  }
};

/**
 * Trigger sync and show progress
 */
export const triggerCustomerSync = async () => {
  const loadingToast = toast.loading('Syncing customers from orders...');
  
  try {
    const result = await syncOrderCustomersToProfiles();
    
    if (result.success) {
      toast.dismiss(loadingToast);
      toast.success(
        `✅ ${result.synced} customers synced successfully!`,
        { description: result.message }
      );
      // Refresh page after short delay
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.dismiss(loadingToast);
      toast.error('Failed to sync customers', { description: result.message });
    }
    
    return result;
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error('Unexpected error during sync');
    return { success: false, synced: 0, message: 'Unexpected error' };
  }
};
