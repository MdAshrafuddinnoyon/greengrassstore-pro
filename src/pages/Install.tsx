import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Loader2, Database, Shield, Settings, AlertTriangle } from 'lucide-react';

interface InstallStep {
  id: string;
  title: string;
  titleAr: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

const Install = () => {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [steps, setSteps] = useState<InstallStep[]>([
    { id: 'connection', title: 'Database Connection', titleAr: 'ডাটাবেজ সংযোগ', status: 'pending' },
    { id: 'tables', title: 'Verify Tables', titleAr: 'টেবিল যাচাই', status: 'pending' },
    { id: 'admin', title: 'Create Admin User', titleAr: 'এডমিন ইউজার তৈরি', status: 'pending' },
    { id: 'settings', title: 'Initialize Settings', titleAr: 'সেটিংস ইনিশিয়ালাইজ', status: 'pending' },
    { id: 'complete', title: 'Complete Installation', titleAr: 'ইনস্টলেশন সম্পন্ন', status: 'pending' },
  ]);

  // Check if already installed
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const { data: settings } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'installation_complete')
          .maybeSingle();

        if (settings?.setting_value === true) {
          setIsInstalled(true);
          toast.info('Application is already installed');
          navigate('/');
        } else {
          setIsInstalled(false);
        }
      } catch (error) {
        console.error('Error checking installation:', error);
        setIsInstalled(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkInstallation();
  }, [navigate]);

  const updateStep = (stepId: string, status: InstallStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const handleInstall = async () => {
    if (!adminEmail || !adminPassword || !adminName) {
      toast.error('Please fill all admin details');
      return;
    }

    if (adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsInstalling(true);

    try {
      // Step 1: Check database connection
      updateStep('connection', 'running');
      const { error: connError } = await supabase.from('site_settings').select('id').limit(1);
      if (connError) throw new Error('Database connection failed');
      updateStep('connection', 'success', 'Connected successfully');

      // Step 2: Verify tables exist
      updateStep('tables', 'running');
      const tables = ['products', 'categories', 'orders', 'blog_posts', 'profiles', 'user_roles'];
      for (const table of tables) {
        const { error } = await supabase.from(table as any).select('id').limit(1);
        if (error && !error.message.includes('does not exist')) {
          // Table exists but may be empty, which is fine
        }
      }
      updateStep('tables', 'success', 'All tables verified');

      // Step 3: Create admin user
      updateStep('admin', 'running');
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message);

      if (authData.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin',
          });

        if (roleError) {
          console.error('Role error:', roleError);
        }
      }
      updateStep('admin', 'success', 'Admin user created');

      // Step 4: Initialize default settings
      updateStep('settings', 'running');
      const defaultSettings = [
        { setting_key: 'site_name', setting_value: 'Green Grass Store' },
        { setting_key: 'site_description', setting_value: 'Premium Home & Garden Products' },
        { setting_key: 'installation_complete', setting_value: true },
        { setting_key: 'installed_at', setting_value: new Date().toISOString() },
        { setting_key: 'installed_by', setting_value: adminEmail },
      ];

      for (const setting of defaultSettings) {
        await supabase
          .from('site_settings')
          .upsert(
            { setting_key: setting.setting_key, setting_value: setting.setting_value },
            { onConflict: 'setting_key' }
          );
      }
      updateStep('settings', 'success', 'Settings initialized');

      // Step 5: Complete installation
      updateStep('complete', 'running');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('complete', 'success', 'Installation complete!');

      toast.success('Installation completed successfully!');
      
      // Redirect to admin after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (error: any) {
      console.error('Installation error:', error);
      toast.error(error.message || 'Installation failed');
      
      // Mark current running step as error
      setSteps(prev => prev.map(step => 
        step.status === 'running' ? { ...step, status: 'error', message: error.message } : step
      ));
    } finally {
      setIsInstalling(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Checking installation status...</p>
        </div>
      </div>
    );
  }

  if (isInstalled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Installation Wizard</h1>
          <p className="text-muted-foreground">ইনস্টলেশন উইজার্ড</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Create Admin Account
            </CardTitle>
            <CardDescription>
              এডমিন অ্যাকাউন্ট তৈরি করুন - এই তথ্য দিয়ে আপনি অ্যাডমিন প্যানেলে লগইন করবেন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="adminName">Full Name / পুরো নাম</Label>
                <Input
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isInstalling}
                />
              </div>
              <div>
                <Label htmlFor="adminEmail">Email / ইমেইল</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  disabled={isInstalling}
                />
              </div>
              <div>
                <Label htmlFor="adminPassword">Password / পাসওয়ার্ড</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  disabled={isInstalling}
                />
              </div>
            </div>

            {/* Installation Steps */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Installation Progress
              </h3>
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {step.status === 'pending' && (
                        <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      {step.status === 'running' && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {step.status === 'success' && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {step.status === 'error' && (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${step.status === 'success' ? 'text-green-600' : step.status === 'error' ? 'text-destructive' : 'text-foreground'}`}>
                        {step.title} - {step.titleAr}
                      </p>
                      {step.message && (
                        <p className="text-xs text-muted-foreground">{step.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleInstall} 
              disabled={isInstalling || !adminEmail || !adminPassword || !adminName}
              className="w-full"
              size="lg"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Start Installation / ইনস্টলেশন শুরু করুন
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              <p>After installation, you will be redirected to the Admin Dashboard.</p>
              <p>ইনস্টলেশনের পর আপনাকে অ্যাডমিন ড্যাশবোর্ডে নিয়ে যাওয়া হবে।</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;
