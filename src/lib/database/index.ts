// Database Client Export
// This file exports the active database client based on configuration

import { ACTIVE_DATABASE } from './config';
import { supabaseAdapter } from './supabase-adapter';
import { mysqlAdapter } from './mysql-adapter';
import type { DatabaseClient } from './types';

// Export the active database client
export const db: DatabaseClient = ACTIVE_DATABASE === 'supabase' 
  ? supabaseAdapter 
  : mysqlAdapter;

// Export types
export type { DatabaseClient, DatabaseResponse } from './types';

// Export config for reference
export { ACTIVE_DATABASE } from './config';

// Re-export original supabase client for cases where direct access is needed
// (like real-time subscriptions, storage, etc.)
export { supabase } from '@/integrations/supabase/client';
