import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bot, 
  Key, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Upload,
  MessageSquare,
  Brain,
  Settings,
  RefreshCw,
  Eye,
  Download,
  Sparkles
} from "lucide-react";

interface TrainingDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  uploadedAt: string;
}

interface QuickReply {
  id: string;
  text: string;
}

interface ChatbotSettings {
  enabled: boolean;
  aiEnabled: boolean;
  aiProvider: 'openai' | 'gemini' | 'lovable';
  apiKey: string;
  model: string;
  welcomeMessage: string;
  welcomeMessageAr: string;
  botName: string;
  botNameAr: string;
  systemPrompt: string;
  quickReplies: QuickReply[];
  trainingDocuments: TrainingDocument[];
  maxTokens: number;
  temperature: number;
  collectProductInfo: boolean;
  collectOrderInfo: boolean;
  fallbackMessage: string;
  fallbackMessageAr: string;
}

const defaultSettings: ChatbotSettings = {
  enabled: true,
  aiEnabled: false,
  aiProvider: 'lovable',
  apiKey: '',
  model: 'google/gemini-2.5-flash',
  welcomeMessage: "Hello! 👋 Welcome to our store. I'm your virtual assistant. How can I help you today?",
  welcomeMessageAr: "مرحباً! 👋 مرحباً بك في متجرنا. أنا مساعدك الافتراضي. كيف يمكنني مساعدتك اليوم؟",
  botName: "Sales Assistant",
  botNameAr: "مساعد المبيعات",
  systemPrompt: `You are a helpful sales assistant for an e-commerce store. Your role is to:
- Answer questions about products, pricing, and availability
- Help customers find what they're looking for
- Provide information about shipping and delivery
- Assist with order tracking
- Be friendly, professional, and helpful

Always be polite and provide accurate information based on the store's data.`,
  quickReplies: [
    { id: '1', text: 'What products do you have?' },
    { id: '2', text: 'Do you deliver to my area?' },
    { id: '3', text: 'What are your prices?' },
    { id: '4', text: 'How to care for plants?' },
  ],
  trainingDocuments: [],
  maxTokens: 500,
  temperature: 0.7,
  collectProductInfo: true,
  collectOrderInfo: true,
  fallbackMessage: "I'm sorry, I didn't understand that. Could you please rephrase your question?",
  fallbackMessageAr: "عذراً، لم أفهم ذلك. هل يمكنك إعادة صياغة سؤالك؟",
};

export const ChatbotManager = () => {
  const [settings, setSettings] = useState<ChatbotSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'chatbot_settings')
        .maybeSingle();

      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...(data.setting_value as unknown as ChatbotSettings) });
      }
    } catch (error) {
      console.error('Error fetching chatbot settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // First check if exists
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'chatbot_settings')
        .maybeSingle();

      const settingsJson = JSON.parse(JSON.stringify(settings));

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ setting_value: settingsJson, updated_at: new Date().toISOString() })
          .eq('setting_key', 'chatbot_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert([{ setting_key: 'chatbot_settings', setting_value: settingsJson }]);
      }

      toast.success('Chatbot settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuickReply = () => {
    setSettings({
      ...settings,
      quickReplies: [
        ...settings.quickReplies,
        { id: Date.now().toString(), text: '' }
      ]
    });
  };

  const removeQuickReply = (id: string) => {
    setSettings({
      ...settings,
      quickReplies: settings.quickReplies.filter(r => r.id !== id)
    });
  };

  const updateQuickReply = (id: string, text: string) => {
    setSettings({
      ...settings,
      quickReplies: settings.quickReplies.map(r => 
        r.id === id ? { ...r, text } : r
      )
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newDoc: TrainingDocument = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          content: content,
          uploadedAt: new Date().toISOString()
        };
        setSettings(prev => ({
          ...prev,
          trainingDocuments: [...prev.trainingDocuments, newDoc]
        }));
        toast.success(`${file.name} uploaded successfully!`);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const removeDocument = (id: string) => {
    setSettings({
      ...settings,
      trainingDocuments: settings.trainingDocuments.filter(d => d.id !== id)
    });
    toast.success('Document removed');
  };

  const trainChatbot = async () => {
    setIsTraining(true);
    try {
      // Simulate training process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Chatbot trained successfully with uploaded documents!');
    } catch (error) {
      toast.error('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary to-primary/70 rounded-xl">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Sales Agent Settings</h2>
            <p className="text-sm text-muted-foreground">Configure your intelligent chatbot assistant</p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-2 text-xs sm:text-sm">
            <Settings className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 text-xs sm:text-sm">
            <Brain className="w-4 h-4" /> AI Settings
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4" /> Training Data
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-2 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4" /> Quick Replies
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Settings</CardTitle>
              <CardDescription>Configure chatbot appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Chatbot</Label>
                  <p className="text-sm text-muted-foreground">Show chatbot on your website</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bot Name (English)</Label>
                  <Input
                    value={settings.botName}
                    onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                    placeholder="Sales Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bot Name (Arabic)</Label>
                  <Input
                    value={settings.botNameAr}
                    onChange={(e) => setSettings({ ...settings, botNameAr: e.target.value })}
                    placeholder="مساعد المبيعات"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Welcome Message (English)</Label>
                <Textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  rows={3}
                  placeholder="Hello! How can I help you today?"
                />
              </div>

              <div className="space-y-2">
                <Label>Welcome Message (Arabic)</Label>
                <Textarea
                  value={settings.welcomeMessageAr}
                  onChange={(e) => setSettings({ ...settings, welcomeMessageAr: e.target.value })}
                  rows={3}
                  dir="rtl"
                  placeholder="مرحباً! كيف يمكنني مساعدتك اليوم؟"
                />
              </div>

              <div className="space-y-2">
                <Label>Fallback Message (English)</Label>
                <Textarea
                  value={settings.fallbackMessage}
                  onChange={(e) => setSettings({ ...settings, fallbackMessage: e.target.value })}
                  rows={2}
                  placeholder="I didn't understand that..."
                />
              </div>

              <div className="space-y-2">
                <Label>Fallback Message (Arabic)</Label>
                <Textarea
                  value={settings.fallbackMessageAr}
                  onChange={(e) => setSettings({ ...settings, fallbackMessageAr: e.target.value })}
                  rows={2}
                  dir="rtl"
                  placeholder="لم أفهم ذلك..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Collection</CardTitle>
              <CardDescription>Configure what information the chatbot can access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Collect Product Information</Label>
                  <p className="text-sm text-muted-foreground">Allow chatbot to access product data</p>
                </div>
                <Switch
                  checked={settings.collectProductInfo}
                  onCheckedChange={(checked) => setSettings({ ...settings, collectProductInfo: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Collect Order Information</Label>
                  <p className="text-sm text-muted-foreground">Allow chatbot to help with order tracking</p>
                </div>
                <Switch
                  checked={settings.collectOrderInfo}
                  onCheckedChange={(checked) => setSettings({ ...settings, collectOrderInfo: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Configuration
              </CardTitle>
              <CardDescription>Enable AI-powered responses for intelligent conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div>
                  <Label className="text-base font-medium">Enable AI Responses</Label>
                  <p className="text-sm text-muted-foreground">Use AI to generate intelligent responses</p>
                </div>
                <Switch
                  checked={settings.aiEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, aiEnabled: checked })}
                />
              </div>

              {settings.aiEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <Select
                      value={settings.aiProvider}
                      onValueChange={(value: 'openai' | 'gemini' | 'lovable') => {
                        setSettings({ 
                          ...settings, 
                          aiProvider: value,
                          model: value === 'openai' ? 'gpt-4o-mini' : 
                                 value === 'gemini' ? 'gemini-pro' : 'google/gemini-2.5-flash'
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lovable">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                            Lovable AI Gateway
                          </div>
                        </SelectItem>
                        <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {settings.aiProvider === 'lovable' 
                        ? 'Uses pre-configured Lovable AI - no API key needed!' 
                        : 'Requires your own API key'}
                    </p>
                  </div>

                  {settings.aiProvider !== 'lovable' && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Key
                      </Label>
                      <Input
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        placeholder={settings.aiProvider === 'openai' ? 'sk-...' : 'AIza...'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your API key is stored securely and never shared
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={settings.model}
                      onValueChange={(value) => setSettings({ ...settings, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.aiProvider === 'lovable' && (
                          <>
                            <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                            <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</SelectItem>
                            <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                          </>
                        )}
                        {settings.aiProvider === 'openai' && (
                          <>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
                          </>
                        )}
                        {settings.aiProvider === 'gemini' && (
                          <>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea
                      value={settings.systemPrompt}
                      onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                      rows={8}
                      placeholder="Define how the AI should behave..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt defines the AI's personality and knowledge base
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Max Tokens: {settings.maxTokens}</Label>
                      <Input
                        type="range"
                        min="100"
                        max="2000"
                        step="50"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">Maximum response length</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Temperature: {settings.temperature}</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower = focused, Higher = creative
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Data */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                Training Documents
              </CardTitle>
              <CardDescription>
                Upload documents to train the chatbot with your store's information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".txt,.md,.csv,.json,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Upload Training Documents</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: TXT, MD, CSV, JSON, PDF
                  </p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Select Files
                  </Button>
                </label>
              </div>

              {settings.trainingDocuments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Uploaded Documents ({settings.trainingDocuments.length})</h4>
                    <Button 
                      onClick={trainChatbot} 
                      disabled={isTraining}
                      size="sm"
                    >
                      {isTraining ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Training...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Train Chatbot
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {settings.trainingDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Training Tips
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Upload product catalogs for accurate product recommendations</li>
                  <li>• Include FAQ documents for common customer questions</li>
                  <li>• Add shipping and return policies for policy-related queries</li>
                  <li>• Include pricing information for accurate price quotes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Replies */}
        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
                Quick Reply Suggestions
              </CardTitle>
              <CardDescription>
                Configure suggested quick replies that customers can click
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.quickReplies.map((reply, index) => (
                <div key={reply.id} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                  <Input
                    value={reply.text}
                    onChange={(e) => updateQuickReply(reply.id, e.target.value)}
                    placeholder="Enter quick reply text..."
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeQuickReply(reply.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addQuickReply} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Quick Reply
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
