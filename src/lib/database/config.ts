// Database Configuration
// Change this to switch between databases

export type DatabaseType = 'supabase' | 'mysql';

// 🔄 CHANGE THIS VALUE TO SWITCH DATABASE
// 'supabase' = Lovable Cloud / Supabase (current)
// 'mysql' = Hostinger MySQL via PHP API
export const ACTIVE_DATABASE: DatabaseType = 'supabase';

// Supabase Configuration (Lovable Cloud)
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://fwkouvwabyftfhcsnfgm.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
};

// MySQL Configuration (Hostinger)
// Update these values with your Hostinger MySQL details
export const MYSQL_CONFIG = {
  apiUrl: '/api', // PHP API endpoint base URL
  // These are used by PHP backend, not exposed to frontend
};
