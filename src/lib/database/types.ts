// Database abstraction types

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseClient {
  // Products
  getProducts(): Promise<DatabaseResponse<any[]>>;
  getProductBySlug(slug: string): Promise<DatabaseResponse<any>>;
  createProduct(product: any): Promise<DatabaseResponse<any>>;
  updateProduct(id: string, product: any): Promise<DatabaseResponse<any>>;
  deleteProduct(id: string): Promise<DatabaseResponse<any>>;

  // Categories
  getCategories(): Promise<DatabaseResponse<any[]>>;
  getCategoryBySlug(slug: string): Promise<DatabaseResponse<any>>;
  createCategory(category: any): Promise<DatabaseResponse<any>>;
  updateCategory(id: string, category: any): Promise<DatabaseResponse<any>>;
  deleteCategory(id: string): Promise<DatabaseResponse<any>>;

  // Orders
  getOrders(userId?: string): Promise<DatabaseResponse<any[]>>;
  getOrderById(id: string): Promise<DatabaseResponse<any>>;
  createOrder(order: any): Promise<DatabaseResponse<any>>;
  updateOrder(id: string, order: any): Promise<DatabaseResponse<any>>;

  // Blog Posts
  getBlogPosts(): Promise<DatabaseResponse<any[]>>;
  getBlogPostBySlug(slug: string): Promise<DatabaseResponse<any>>;
  createBlogPost(post: any): Promise<DatabaseResponse<any>>;
  updateBlogPost(id: string, post: any): Promise<DatabaseResponse<any>>;
  deleteBlogPost(id: string): Promise<DatabaseResponse<any>>;

  // Site Settings
  getSiteSettings(): Promise<DatabaseResponse<any[]>>;
  getSiteSetting(key: string): Promise<DatabaseResponse<any>>;
  updateSiteSetting(key: string, value: any): Promise<DatabaseResponse<any>>;

  // Profiles
  getProfile(userId: string): Promise<DatabaseResponse<any>>;
  updateProfile(userId: string, profile: any): Promise<DatabaseResponse<any>>;

  // Wishlist
  getWishlist(userId: string): Promise<DatabaseResponse<any[]>>;
  addToWishlist(item: any): Promise<DatabaseResponse<any>>;
  removeFromWishlist(userId: string, productId: string): Promise<DatabaseResponse<any>>;

  // Custom Requirements
  getCustomRequirements(userId: string): Promise<DatabaseResponse<any[]>>;
  createCustomRequirement(requirement: any): Promise<DatabaseResponse<any>>;

  // Newsletter
  subscribeNewsletter(email: string): Promise<DatabaseResponse<any>>;

  // Auth (basic)
  signUp(email: string, password: string, metadata?: any): Promise<DatabaseResponse<any>>;
  signIn(email: string, password: string): Promise<DatabaseResponse<any>>;
  signOut(): Promise<DatabaseResponse<any>>;
  getCurrentUser(): Promise<DatabaseResponse<any>>;
  updatePassword(newPassword: string): Promise<DatabaseResponse<any>>;
}
