// Supabase Database Adapter
import { supabase } from '@/integrations/supabase/client';
import type { DatabaseClient, DatabaseResponse } from './types';

export const supabaseAdapter: DatabaseClient = {
  // Products
  async getProducts(): Promise<DatabaseResponse<any[]>> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getProductBySlug(slug: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return { data, error };
  },

  async createProduct(product: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    return { data, error };
  },

  async updateProduct(id: string, product: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteProduct(id: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  // Categories
  async getCategories(): Promise<DatabaseResponse<any[]>> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return { data, error };
  },

  async getCategoryBySlug(slug: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return { data, error };
  },

  async createCategory(category: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    return { data, error };
  },

  async updateCategory(id: string, category: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteCategory(id: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  // Orders
  async getOrders(userId?: string): Promise<DatabaseResponse<any[]>> {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    return { data, error };
  },

  async getOrderById(id: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data, error };
  },

  async createOrder(order: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    return { data, error };
  },

  async updateOrder(id: string, order: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('orders')
      .update(order)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Blog Posts
  async getBlogPosts(): Promise<DatabaseResponse<any[]>> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    return { data, error };
  },

  async getBlogPostBySlug(slug: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return { data, error };
  },

  async createBlogPost(post: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(post)
      .select()
      .single();
    return { data, error };
  },

  async updateBlogPost(id: string, post: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(post)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteBlogPost(id: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  // Site Settings
  async getSiteSettings(): Promise<DatabaseResponse<any[]>> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*');
    return { data, error };
  },

  async getSiteSetting(key: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', key)
      .maybeSingle();
    return { data, error };
  },

  async updateSiteSetting(key: string, value: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ setting_key: key, setting_value: value })
      .select()
      .single();
    return { data, error };
  },

  // Profiles
  async getProfile(userId: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return { data, error };
  },

  async updateProfile(userId: string, profile: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ ...profile, user_id: userId })
      .select()
      .single();
    return { data, error };
  },

  // Wishlist
  async getWishlist(userId: string): Promise<DatabaseResponse<any[]>> {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  async addToWishlist(item: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('wishlist')
      .insert(item)
      .select()
      .single();
    return { data, error };
  },

  async removeFromWishlist(userId: string, productId: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    return { data, error };
  },

  // Custom Requirements
  async getCustomRequirements(userId: string): Promise<DatabaseResponse<any[]>> {
    const { data, error } = await supabase
      .from('custom_requirements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createCustomRequirement(requirement: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('custom_requirements')
      .insert(requirement)
      .select()
      .single();
    return { data, error };
  },

  // Newsletter
  async subscribeNewsletter(email: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })
      .select()
      .single();
    return { data, error };
  },

  // Auth
  async signUp(email: string, password: string, metadata?: any): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  },

  async signIn(email: string, password: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut(): Promise<DatabaseResponse<any>> {
    const { error } = await supabase.auth.signOut();
    return { data: null, error };
  },

  async getCurrentUser(): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase.auth.getUser();
    return { data: data?.user || null, error };
  },

  async updatePassword(newPassword: string): Promise<DatabaseResponse<any>> {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },
};
