// MySQL Database Adapter (via PHP API)
import type { DatabaseClient, DatabaseResponse } from './types';
import { MYSQL_CONFIG } from './config';

const API_URL = MYSQL_CONFIG.apiUrl;

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<DatabaseResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { data: null, error: new Error(result.message || 'API Error') };
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export const mysqlAdapter: DatabaseClient = {
  // Products
  async getProducts(): Promise<DatabaseResponse<any[]>> {
    return apiCall('/products.php');
  },

  async getProductBySlug(slug: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/products.php?slug=${encodeURIComponent(slug)}`);
  },

  async createProduct(product: any): Promise<DatabaseResponse<any>> {
    return apiCall('/products.php', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: any): Promise<DatabaseResponse<any>> {
    return apiCall(`/products.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/products.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<DatabaseResponse<any[]>> {
    return apiCall('/categories.php');
  },

  async getCategoryBySlug(slug: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/categories.php?slug=${encodeURIComponent(slug)}`);
  },

  async createCategory(category: any): Promise<DatabaseResponse<any>> {
    return apiCall('/categories.php', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async updateCategory(id: string, category: any): Promise<DatabaseResponse<any>> {
    return apiCall(`/categories.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },

  async deleteCategory(id: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/categories.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Orders
  async getOrders(userId?: string): Promise<DatabaseResponse<any[]>> {
    const params = userId ? `?user_id=${userId}` : '';
    return apiCall(`/orders.php${params}`);
  },

  async getOrderById(id: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/orders.php?id=${id}`);
  },

  async createOrder(order: any): Promise<DatabaseResponse<any>> {
    return apiCall('/orders.php', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async updateOrder(id: string, order: any): Promise<DatabaseResponse<any>> {
    return apiCall(`/orders.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  },

  // Blog Posts
  async getBlogPosts(): Promise<DatabaseResponse<any[]>> {
    return apiCall('/blog.php');
  },

  async getBlogPostBySlug(slug: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/blog.php?slug=${encodeURIComponent(slug)}`);
  },

  async createBlogPost(post: any): Promise<DatabaseResponse<any>> {
    return apiCall('/blog.php', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  async updateBlogPost(id: string, post: any): Promise<DatabaseResponse<any>> {
    return apiCall(`/blog.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  },

  async deleteBlogPost(id: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/blog.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Site Settings
  async getSiteSettings(): Promise<DatabaseResponse<any[]>> {
    return apiCall('/settings.php');
  },

  async getSiteSetting(key: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/settings.php?key=${encodeURIComponent(key)}`);
  },

  async updateSiteSetting(key: string, value: any): Promise<DatabaseResponse<any>> {
    return apiCall('/settings.php', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
  },

  // Profiles
  async getProfile(userId: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/profiles.php?user_id=${userId}`);
  },

  async updateProfile(userId: string, profile: any): Promise<DatabaseResponse<any>> {
    return apiCall(`/profiles.php?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  // Wishlist
  async getWishlist(userId: string): Promise<DatabaseResponse<any[]>> {
    return apiCall(`/wishlist.php?user_id=${userId}`);
  },

  async addToWishlist(item: any): Promise<DatabaseResponse<any>> {
    return apiCall('/wishlist.php', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async removeFromWishlist(userId: string, productId: string): Promise<DatabaseResponse<any>> {
    return apiCall(`/wishlist.php?user_id=${userId}&product_id=${productId}`, {
      method: 'DELETE',
    });
  },

  // Custom Requirements
  async getCustomRequirements(userId: string): Promise<DatabaseResponse<any[]>> {
    return apiCall(`/requirements.php?user_id=${userId}`);
  },

  async createCustomRequirement(requirement: any): Promise<DatabaseResponse<any>> {
    return apiCall('/requirements.php', {
      method: 'POST',
      body: JSON.stringify(requirement),
    });
  },

  // Newsletter
  async subscribeNewsletter(email: string): Promise<DatabaseResponse<any>> {
    return apiCall('/newsletter.php', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Auth
  async signUp(email: string, password: string, metadata?: any): Promise<DatabaseResponse<any>> {
    return apiCall('/auth.php?action=signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...metadata }),
    });
  },

  async signIn(email: string, password: string): Promise<DatabaseResponse<any>> {
    return apiCall('/auth.php?action=signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signOut(): Promise<DatabaseResponse<any>> {
    return apiCall('/auth.php?action=signout', {
      method: 'POST',
    });
  },

  async getCurrentUser(): Promise<DatabaseResponse<any>> {
    return apiCall('/auth.php?action=user');
  },

  async updatePassword(newPassword: string): Promise<DatabaseResponse<any>> {
    return apiCall('/auth.php?action=update-password', {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });
  },
};
