import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageContent {
  title: string;
  description: string;
  content: string;
  heroImage?: string;
  [key: string]: any;
}

export const usePageContent = (pageSlug: string) => {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch page content from site_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', `page_${pageSlug}`)
          .maybeSingle();

        if (settingsError) throw settingsError;

        if (settingsData?.setting_value) {
          try {
            const parsedContent = typeof settingsData.setting_value === 'string'
              ? JSON.parse(settingsData.setting_value)
              : settingsData.setting_value;
            setContent(parsedContent);
          } catch (parseError) {
            console.error('Failed to parse page content:', parseError);
            setError('Invalid page content format');
          }
        } else {
          setContent(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch page content:', err);
        setError(err.message || 'Failed to load page content');
      } finally {
        setLoading(false);
      }
    };

    if (pageSlug) {
      fetchPageContent();
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`page-${pageSlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: `setting_key=eq.page_${pageSlug}`
        },
        () => {
          fetchPageContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageSlug]);

  return { content, loading, error };
};
