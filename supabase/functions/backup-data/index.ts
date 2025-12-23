import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tables to backup
const BACKUP_TABLES = [
  'products',
  'categories', 
  'orders',
  'order_items',
  'profiles',
  'blog_posts',
  'site_settings',
  'coupons',
  'newsletter_subscribers',
  'custom_requests',
  'media_files',
  'popups',
  'faqs',
  'user_roles'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'export') {
      console.log('Starting data export...');
      
      const backupData: Record<string, any[]> = {};
      const errors: string[] = [];

      // Export each table
      for (const table of BACKUP_TABLES) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');
          
          if (error) {
            console.error(`Error exporting ${table}:`, error);
            errors.push(`${table}: ${error.message}`);
            backupData[table] = [];
          } else {
            backupData[table] = data || [];
            console.log(`Exported ${table}: ${data?.length || 0} records`);
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          console.error(`Exception exporting ${table}:`, e);
          errors.push(`${table}: ${errorMessage}`);
          backupData[table] = [];
        }
      }

      // Create backup metadata
      const backup = {
        version: '1.0',
        created_at: new Date().toISOString(),
        created_by: user.email,
        tables: BACKUP_TABLES,
        data: backupData,
        errors: errors.length > 0 ? errors : undefined
      };

      console.log('Export complete');

      return new Response(
        JSON.stringify({ success: true, backup }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'import') {
      const { backup } = await req.json();
      
      if (!backup || !backup.data) {
        return new Response(
          JSON.stringify({ error: 'Invalid backup data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Starting data import...');
      
      const results: Record<string, { imported: number; errors: string[] }> = {};

      // Import each table (order matters for foreign keys)
      const importOrder = [
        'categories',
        'products', 
        'profiles',
        'orders',
        'order_items',
        'blog_posts',
        'site_settings',
        'coupons',
        'newsletter_subscribers',
        'custom_requests',
        'media_files',
        'popups',
        'faqs',
        'user_roles'
      ];

      for (const table of importOrder) {
        if (!backup.data[table] || backup.data[table].length === 0) {
          results[table] = { imported: 0, errors: [] };
          continue;
        }

        try {
          // Upsert data (insert or update on conflict)
          const { error } = await supabase
            .from(table)
            .upsert(backup.data[table], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Error importing ${table}:`, error);
            results[table] = { 
              imported: 0, 
              errors: [error.message] 
            };
          } else {
            results[table] = { 
              imported: backup.data[table].length, 
              errors: [] 
            };
            console.log(`Imported ${table}: ${backup.data[table].length} records`);
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          console.error(`Exception importing ${table}:`, e);
          results[table] = { 
            imported: 0, 
            errors: [errorMessage] 
          };
        }
      }

      console.log('Import complete');

      return new Response(
        JSON.stringify({ success: true, results }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "export" or "import"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Backup operation failed';
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
