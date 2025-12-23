import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Check, 
  Loader2, 
  Database, 
  Shield, 
  Settings, 
  AlertTriangle,
  Server,
  Cloud,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { ACTIVE_DATABASE } from '@/lib/database/config';

interface InstallStep {
  id: string;
  title: string;
  titleBn: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

type DatabaseType = 'supabase' | 'mysql';

const Install = () => {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Database selection
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>(ACTIVE_DATABASE);
  
  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  
  // MySQL credentials
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [mysqlDatabase, setMysqlDatabase] = useState('');
  const [mysqlUser, setMysqlUser] = useState('');
  const [mysqlPassword, setMysqlPassword] = useState('');
  
  // Connection test
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  
  const [steps, setSteps] = useState<InstallStep[]>([
    { id: 'connection', title: 'Database Connection', titleBn: 'ডাটাবেজ সংযোগ', status: 'pending' },
    { id: 'tables', title: 'Create/Verify Tables', titleBn: 'টেবিল তৈরি/যাচাই', status: 'pending' },
    { id: 'admin', title: 'Create Admin User', titleBn: 'এডমিন ইউজার তৈরি', status: 'pending' },
    { id: 'settings', title: 'Initialize Settings', titleBn: 'সেটিংস ইনিশিয়ালাইজ', status: 'pending' },
    { id: 'complete', title: 'Complete Installation', titleBn: 'ইনস্টলেশন সম্পন্ন', status: 'pending' },
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

  const testConnection = async () => {
    setConnectionTested(false);
    
    try {
      if (selectedDatabase === 'supabase') {
        const { error } = await supabase.from('site_settings').select('id').limit(1);
        if (error && !error.message.includes('does not exist')) {
          throw new Error('Connection failed');
        }
        setConnectionSuccess(true);
        toast.success('Supabase connection successful!');
      } else {
        // Test MySQL connection via PHP API
        const response = await fetch('/api/auth.php?action=test');
        if (!response.ok) throw new Error('MySQL connection failed');
        setConnectionSuccess(true);
        toast.success('MySQL connection successful!');
      }
    } catch (error: any) {
      setConnectionSuccess(false);
      toast.error(error.message || 'Connection failed');
    } finally {
      setConnectionTested(true);
    }
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
      if (selectedDatabase === 'supabase') {
        const { error: connError } = await supabase.from('site_settings').select('id').limit(1);
        if (connError && !connError.message.includes('does not exist')) {
          throw new Error('Database connection failed');
        }
      }
      updateStep('connection', 'success', 'Connected successfully');

      // Step 2: Verify/Create tables
      updateStep('tables', 'running');
      const tables = ['products', 'categories', 'orders', 'blog_posts', 'profiles', 'user_roles', 'site_settings', 'newsletter_subscribers', 'coupons'];
      let tablesVerified = 0;
      for (const table of tables) {
        try {
          await supabase.from(table as any).select('id').limit(1);
          tablesVerified++;
        } catch (e) {
          // Table might not exist, continue
        }
      }
      updateStep('tables', 'success', `${tablesVerified}/${tables.length} tables verified`);

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

        // Create profile - user_id is required
        await supabase
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            full_name: adminName,
          }, { onConflict: 'user_id' });
      }
      updateStep('admin', 'success', 'Admin user created');

      // Step 4: Initialize default settings
      updateStep('settings', 'running');
      const defaultSettings = [
        { setting_key: 'site_name', setting_value: 'Green Grass Store' },
        { setting_key: 'site_description', setting_value: 'Premium Home & Garden Products' },
        { setting_key: 'currency', setting_value: 'AED' },
        { setting_key: 'database_type', setting_value: selectedDatabase },
        { setting_key: 'installation_complete', setting_value: true },
        { setting_key: 'installed_at', setting_value: new Date().toISOString() },
        { setting_key: 'installed_by', setting_value: adminEmail },
        { setting_key: 'app_version', setting_value: '1.5.0' },
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
          <p className="text-sm text-muted-foreground">ইনস্টলেশন স্ট্যাটাস চেক করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (isInstalled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Installation Wizard</h1>
          <p className="text-muted-foreground">ইনস্টলেশন উইজার্ড - Green Grass Store</p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStep > step 
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && <div className={`w-12 h-1 rounded ${currentStep > step ? 'bg-green-500' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
            <span>Database</span>
            <span>Credentials</span>
            <span>Install</span>
          </div>
        </div>

        {/* Step 1: Database Selection */}
        {currentStep === 1 && (
          <Card className="animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Select Database / ডাটাবেজ নির্বাচন
              </CardTitle>
              <CardDescription>
                Choose your database platform. You can switch later by changing configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedDatabase} onValueChange={(v) => setSelectedDatabase(v as DatabaseType)}>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Supabase Option */}
                  <label 
                    className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedDatabase === 'supabase' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="supabase" className="sr-only" />
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <Cloud className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Supabase / Lovable Cloud</h3>
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cloud-hosted PostgreSQL with built-in auth, storage, and real-time.
                        </p>
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> No server maintenance</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Real-time subscriptions</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Built-in authentication</li>
                        </ul>
                      </div>
                    </div>
                    {selectedDatabase === 'supabase' && (
                      <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-primary" />
                    )}
                  </label>

                  {/* MySQL Option */}
                  <label 
                    className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedDatabase === 'mysql' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="mysql" className="sr-only" />
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Server className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">MySQL / MariaDB</h3>
                          <Badge variant="outline" className="text-xs">Self-hosted</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          For Hostinger, SiteGround, cPanel hosting with MySQL.
                        </p>
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Full data control</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Works with shared hosting</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> PHP backend included</li>
                        </ul>
                      </div>
                    </div>
                    {selectedDatabase === 'mysql' && (
                      <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-primary" />
                    )}
                  </label>
                </div>
              </RadioGroup>

              {/* MySQL Configuration (if selected) */}
              {selectedDatabase === 'mysql' && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    MySQL Configuration
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Host</Label>
                      <Input 
                        value={mysqlHost} 
                        onChange={(e) => setMysqlHost(e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input 
                        value={mysqlPort} 
                        onChange={(e) => setMysqlPort(e.target.value)}
                        placeholder="3306"
                      />
                    </div>
                    <div>
                      <Label>Database Name</Label>
                      <Input 
                        value={mysqlDatabase} 
                        onChange={(e) => setMysqlDatabase(e.target.value)}
                        placeholder="your_database_name"
                      />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input 
                        value={mysqlUser} 
                        onChange={(e) => setMysqlUser(e.target.value)}
                        placeholder="db_user"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Password</Label>
                      <Input 
                        type="password"
                        value={mysqlPassword} 
                        onChange={(e) => setMysqlPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                    <p className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Make sure you have uploaded the PHP API files to your hosting in the <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">/api</code> folder.
                    </p>
                  </div>
                </div>
              )}

              {/* Test Connection */}
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={testConnection}>
                  <Database className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                {connectionTested && (
                  <div className={`flex items-center gap-2 text-sm ${connectionSuccess ? 'text-green-600' : 'text-destructive'}`}>
                    {connectionSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Connection successful
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Connection failed
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)}>
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Admin Credentials */}
        {currentStep === 2 && (
          <Card className="animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Create Admin Account / এডমিন অ্যাকাউন্ট তৈরি
              </CardTitle>
              <CardDescription>
                এই তথ্য দিয়ে আপনি অ্যাডমিন প্যানেলে লগইন করবেন
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
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 6 characters
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Selected Database
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-500">
                  {selectedDatabase === 'supabase' ? 'Supabase / Lovable Cloud (PostgreSQL)' : 'MySQL / MariaDB (Self-hosted)'}
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!adminEmail || !adminPassword || !adminName}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Installation */}
        {currentStep === 3 && (
          <Card className="animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Run Installation / ইনস্টলেশন চালান
              </CardTitle>
              <CardDescription>
                সব তথ্য যাচাই করুন এবং ইনস্টলেশন শুরু করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <h4 className="font-medium">Installation Summary</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span className="font-medium">{selectedDatabase === 'supabase' ? 'Supabase' : 'MySQL'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin Name:</span>
                    <span className="font-medium">{adminName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin Email:</span>
                    <span className="font-medium">{adminEmail}</span>
                  </div>
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
                          {step.title} - {step.titleBn}
                        </p>
                        {step.message && (
                          <p className="text-xs text-muted-foreground">{step.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isInstalling}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleInstall} 
                  disabled={isInstalling}
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
                      Start Installation
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>After installation, you will be redirected to the Admin Dashboard.</p>
                <p>ইনস্টলেশনের পর আপনাকে অ্যাডমিন ড্যাশবোর্ডে নিয়ে যাওয়া হবে।</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Green Grass Store v1.5.0 | © 2024 WebSearchBD</p>
          <p className="mt-1">
            <a href="/DATABASE_ARCHITECTURE.md" target="_blank" className="text-primary hover:underline">
              View Database Architecture Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Install;
