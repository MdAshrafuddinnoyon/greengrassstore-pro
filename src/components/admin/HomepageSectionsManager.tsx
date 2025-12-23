import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, RefreshCw, Image as ImageIcon, Gift, Tag, Sparkles, Grid, Package, Instagram, X, Plus, Circle, Square, RectangleHorizontal } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import { GiftProductSelector } from "./GiftProductSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HeroSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  description: string;
  descriptionAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonTextAr: string;
  secondaryButtonLink: string;
  backgroundImage: string;
}

interface GiftProduct {
  id: string;
  name: string;
  name_ar?: string;
  price: number;
  featured_image?: string;
  slug: string;
}

interface GiftSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  productsLimit: number;
  items?: GiftProduct[];
}

interface PromoSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  discountText: string;
  discountTextAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonTextAr: string;
  secondaryButtonLink: string;
  backgroundImage: string;
  backgroundColor: string;
}

interface FeaturedCategorySectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  categoriesLimit: number;
  productsPerCategory: number;
  showBadges: boolean;
  selectedCategories: string[];
  images?: Record<string, string>;
}

interface CollectionSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  productsLimit: number;
  showFeaturedOnly: boolean;
}

interface InstagramSectionSettings {
  enabled: boolean;
  username: string;
  profileUrl: string;
  title: string;
  images: string[];
}

interface CategoryGridSettings {
  displayCount: number;
  displayCountMobile: number;
  autoplaySpeed: number;
  showArrows: boolean;
  imageScale: number;
  selectedCategoryIds: string[];
  shape?: 'circle' | 'square' | 'rounded';
  gap?: number;
}

export const HomepageSectionsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [allCategories, setAllCategories] = useState<{id: string, name: string}[]>([]);

  const [categoryGridSettings, setCategoryGridSettings] = useState<CategoryGridSettings>({
    displayCount: 10,
    displayCountMobile: 6,
    autoplaySpeed: 3000,
    showArrows: true,
    imageScale: 1,
    selectedCategoryIds: [],
    shape: 'circle',
    gap: 24
  });

  const [heroSettings, setHeroSettings] = useState<HeroSettings>({
    enabled: true,
    title: "Bring Nature",
    titleAr: "أحضر الطبيعة",
    subtitle: "Into Your Home",
    subtitleAr: "إلى منزلك",
    description: "Discover our premium collection of plants, pots, and home décor designed for UAE homes.",
    descriptionAr: "اكتشف مجموعتنا المميزة من النباتات والأواني وديكور المنزل المصممة لمنازل الإمارات.",
    buttonText: "Shop Now",
    buttonTextAr: "تسوق الآن",
    buttonLink: "/shop",
    secondaryButtonText: "View Sale",
    secondaryButtonTextAr: "عرض التخفيضات",
    secondaryButtonLink: "/shop?collection=sale",
    backgroundImage: ""
  });

  const [giftSettings, setGiftSettings] = useState<GiftSectionSettings>({
    enabled: true,
    title: "Gift Garden",
    titleAr: "حديقة الهدايا",
    subtitle: "Thoughtfully curated gift sets for plant lovers",
    subtitleAr: "مجموعات هدايا منسقة بعناية لمحبي النباتات",
    buttonText: "View All Gifts",
    buttonTextAr: "عرض جميع الهدايا",
    buttonLink: "/shop?category=gifts",
    productsLimit: 6,
    items: []
  });

  const [promoSettings, setPromoSettings] = useState<PromoSectionSettings>({
    enabled: true,
    title: "Special Sale",
    titleAr: "عرض خاص",
    subtitle: "Up to 40% off on selected plants, pots, and accessories.",
    subtitleAr: "خصم يصل إلى 40% على النباتات والأواني والإكسسوارات المختارة.",
    discountText: "Limited Time Offer",
    discountTextAr: "عرض لفترة محدودة",
    buttonText: "Shop Sale",
    buttonTextAr: "تسوق التخفيضات",
    buttonLink: "/shop?category=sale",
    secondaryButtonText: "View All Products",
    secondaryButtonTextAr: "عرض جميع المنتجات",
    secondaryButtonLink: "/shop",
    backgroundImage: "",
    backgroundColor: "#2d5a3d"
  });

  const [featuredCategorySettings, setFeaturedCategorySettings] = useState<FeaturedCategorySectionSettings>({
    enabled: true,
    title: "Featured Categories",
    titleAr: "الفئات المميزة",
    categoriesLimit: 4,
    productsPerCategory: 6,
    showBadges: true,
    selectedCategories: []
  });

  const [collectionSettings, setCollectionSettings] = useState<CollectionSectionSettings>({
    enabled: true,
    title: "Our Collection",
    titleAr: "مجموعتنا",
    subtitle: "Discover our curated selection of premium plants and home décor",
    subtitleAr: "اكتشف مجموعتنا المختارة من النباتات الفاخرة وديكور المنزل",
    productsLimit: 8,
    showFeaturedOnly: false
  });

  const [instagramSettings, setInstagramSettings] = useState<InstagramSectionSettings>({
    enabled: true,
    username: "@greengrassstore",
    profileUrl: "https://instagram.com/greengrassstore",
    title: "GREEN GRASS",
    images: []
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch ALL active categories for Category Grid
      const { data: allCatData } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .order('display_order');
      
      if (allCatData) setAllCategories(allCatData);

      // Fetch only main categories (parent_id is null) for featured section
      const parentCategories = allCatData?.filter(cat => cat.parent_id === null) || [];
      setCategories(parentCategories);

      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      data?.forEach((setting) => {
        const value = setting.setting_value as Record<string, unknown>;
        if (setting.setting_key === 'hero_section') {
          setHeroSettings(value as unknown as HeroSettings);
        } else if (setting.setting_key === 'gift_section') {
          setGiftSettings(value as unknown as GiftSectionSettings);
        } else if (setting.setting_key === 'promo_section') {
          setPromoSettings(value as unknown as PromoSectionSettings);
        } else if (setting.setting_key === 'featured_category_section') {
          setFeaturedCategorySettings(value as unknown as FeaturedCategorySectionSettings);
        } else if (setting.setting_key === 'collection_section') {
          setCollectionSettings(value as unknown as CollectionSectionSettings);
        } else if (setting.setting_key === 'instagram_section') {
          setInstagramSettings(value as unknown as InstagramSectionSettings);
        } else if (setting.setting_key === 'category_grid_settings') {
          setCategoryGridSettings(value as unknown as CategoryGridSettings);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime category changes
    const categoryChannel = supabase
      .channel('homepage-categories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          // Refetch all categories when any category changes
          supabase
            .from('categories')
            .select('id, name, slug, parent_id')
            .eq('is_active', true)
            .order('display_order')
            .then(({ data }) => {
              if (data) {
                setAllCategories(data);
                setCategories(data.filter(cat => cat.parent_id === null));
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoryChannel);
    };
  }, []);

  const saveSettings = async (key: string, value: object) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(value)) })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: key, setting_value: JSON.parse(JSON.stringify(value)) });
        if (error) throw error;
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
          <TabsTrigger value="hero" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="category-grid" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Cat Grid</span>
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Featured</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Collection</span>
          </TabsTrigger>
          <TabsTrigger value="gift" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Gift</span>
          </TabsTrigger>
          <TabsTrigger value="promo" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Promo</span>
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex-1 min-w-[50px] gap-1 text-xs sm:text-sm py-2">
            <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">IG</span>
          </TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Manage the main hero banner on homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Hero Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide hero banner</p>
                </div>
                <Switch
                  checked={heroSettings.enabled}
                  onCheckedChange={(checked) => 
                    setHeroSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (EN)</Label>
                  <Input
                    value={heroSettings.title}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (AR)</Label>
                  <Input
                    value={heroSettings.titleAr}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, titleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtitle (EN)</Label>
                  <Input
                    value={heroSettings.subtitle}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle (AR)</Label>
                  <Input
                    value={heroSettings.subtitleAr}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, subtitleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={heroSettings.description}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (AR)</Label>
                  <Textarea
                    value={heroSettings.descriptionAr}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, descriptionAr: e.target.value }))}
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Button Text (EN)</Label>
                  <Input
                    value={heroSettings.buttonText}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, buttonText: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Button Text (AR)</Label>
                  <Input
                    value={heroSettings.buttonTextAr}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, buttonTextAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Button Link</Label>
                  <Input
                    value={heroSettings.buttonLink}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, buttonLink: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Secondary Button Text (EN)</Label>
                  <Input
                    value={heroSettings.secondaryButtonText || ''}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                    placeholder="e.g., View Sale"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Text (AR)</Label>
                  <Input
                    value={heroSettings.secondaryButtonTextAr || ''}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, secondaryButtonTextAr: e.target.value }))}
                    dir="rtl"
                    placeholder="عرض التخفيضات"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Link</Label>
                  <Input
                    value={heroSettings.secondaryButtonLink || ''}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, secondaryButtonLink: e.target.value }))}
                    placeholder="/shop?collection=sale"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Image</Label>
                <MediaPicker
                  value={heroSettings.backgroundImage}
                  onChange={(url) => setHeroSettings(prev => ({ ...prev, backgroundImage: url }))}
                />
              </div>

              <Button 
                onClick={() => saveSettings('hero_section', heroSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Hero Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Grid Section (Browse by Category) */}
        <TabsContent value="category-grid">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-primary" />
                Category Grid Settings
              </CardTitle>
              <CardDescription>
                Control the "Browse by Category" carousel on homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Desktop Display Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={categoryGridSettings.displayCount}
                    onChange={(e) => setCategoryGridSettings(prev => ({ ...prev, displayCount: parseInt(e.target.value) || 10 }))}
                  />
                  <p className="text-xs text-muted-foreground">Categories on desktop</p>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Display Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={categoryGridSettings.displayCountMobile || 6}
                    onChange={(e) => setCategoryGridSettings(prev => ({ ...prev, displayCountMobile: parseInt(e.target.value) || 6 }))}
                  />
                  <p className="text-xs text-muted-foreground">Categories on mobile</p>
                </div>
                <div className="space-y-2">
                  <Label>Autoplay Speed (ms)</Label>
                  <Input
                    type="number"
                    min="1000"
                    max="10000"
                    step="500"
                    value={categoryGridSettings.autoplaySpeed}
                    onChange={(e) => setCategoryGridSettings(prev => ({ ...prev, autoplaySpeed: parseInt(e.target.value) || 3000 }))}
                  />
                  <p className="text-xs text-muted-foreground">Rotation speed</p>
                </div>
                <div className="space-y-2">
                  <Label>Image Scale</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={categoryGridSettings.imageScale}
                      onChange={(e) => setCategoryGridSettings(prev => ({ ...prev, imageScale: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{categoryGridSettings.imageScale}x</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <Label>Show Arrows</Label>
                  <Switch
                    checked={categoryGridSettings.showArrows}
                    onCheckedChange={(checked) => setCategoryGridSettings(prev => ({ ...prev, showArrows: checked }))}
                  />
                </div>
              </div>

              {/* Shape and Gap Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category Shape</Label>
                  <Select
                    value={categoryGridSettings.shape || 'circle'}
                    onValueChange={(value: 'circle' | 'square' | 'rounded') => 
                      setCategoryGridSettings(prev => ({ ...prev, shape: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">
                        <div className="flex items-center gap-2">
                          <Circle className="w-4 h-4" />
                          Circle
                        </div>
                      </SelectItem>
                      <SelectItem value="square">
                        <div className="flex items-center gap-2">
                          <Square className="w-4 h-4" />
                          Square
                        </div>
                      </SelectItem>
                      <SelectItem value="rounded">
                        <div className="flex items-center gap-2">
                          <RectangleHorizontal className="w-4 h-4" />
                          Rounded
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select category image shape</p>
                </div>
                <div className="space-y-2">
                  <Label>Gap Between Items (px)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="8"
                      max="48"
                      step="4"
                      value={categoryGridSettings.gap || 24}
                      onChange={(e) => setCategoryGridSettings(prev => ({ ...prev, gap: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{categoryGridSettings.gap || 24}px</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Space between category items</p>
                </div>
              </div>


              <div className="space-y-2">
                <Label>Select Categories to Display</Label>
                <p className="text-xs text-muted-foreground mb-2">Leave empty to show all categories. All active categories are shown here.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {allCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full py-4 text-center">No categories found. Create categories first.</p>
                  ) : (
                    allCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoryGridSettings.selectedCategoryIds?.includes(cat.id) || false}
                          onChange={(e) => {
                            setCategoryGridSettings(prev => ({
                              ...prev,
                              selectedCategoryIds: e.target.checked
                                ? [...(prev.selectedCategoryIds || []), cat.id]
                                : (prev.selectedCategoryIds || []).filter(id => id !== cat.id)
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('category_grid_settings', categoryGridSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Category Grid Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Categories Section */}
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-primary" />
                Featured Categories Section
              </CardTitle>
              <CardDescription>
                Manage the category banners with product carousels on homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Featured Categories</Label>
                  <p className="text-sm text-muted-foreground">Show category banners with products</p>
                </div>
                <Switch
                  checked={featuredCategorySettings.enabled}
                  onCheckedChange={(checked) => 
                    setFeaturedCategorySettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section Title (EN)</Label>
                  <Input
                    value={featuredCategorySettings.title}
                    onChange={(e) => setFeaturedCategorySettings(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Title (AR)</Label>
                  <Input
                    value={featuredCategorySettings.titleAr}
                    onChange={(e) => setFeaturedCategorySettings(prev => ({ ...prev, titleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categories to Show</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={featuredCategorySettings.categoriesLimit}
                    onChange={(e) => setFeaturedCategorySettings(prev => ({ ...prev, categoriesLimit: parseInt(e.target.value) || 4 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Products per Category</Label>
                  <Input
                    type="number"
                    min={3}
                    max={12}
                    value={featuredCategorySettings.productsPerCategory}
                    onChange={(e) => setFeaturedCategorySettings(prev => ({ ...prev, productsPerCategory: parseInt(e.target.value) || 6 }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={featuredCategorySettings.showBadges}
                    onCheckedChange={(checked) => 
                      setFeaturedCategorySettings(prev => ({ ...prev, showBadges: checked }))
                    }
                  />
                  <Label>Show Sale/New Badges</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Categories to Display</Label>
                <p className="text-sm text-muted-foreground mb-2">Select categories from dropdown. Drag to reorder selected categories.</p>
                
                {/* Dropdown to add categories */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value=""
                      onValueChange={(catId) => {
                        if (catId && !featuredCategorySettings.selectedCategories.includes(catId)) {
                          setFeaturedCategorySettings(prev => ({
                            ...prev,
                            selectedCategories: [...prev.selectedCategories, catId]
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select a category to add..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {categories.length === 0 ? (
                          <div className="py-4 px-3 text-center text-muted-foreground text-sm">
                            No categories available. Please add categories first.
                          </div>
                        ) : (
                          categories
                            .filter(cat => !featuredCategorySettings.selectedCategories.includes(cat.id))
                            .map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                        )}
                        {categories.length > 0 && 
                          categories.filter(cat => !featuredCategorySettings.selectedCategories.includes(cat.id)).length === 0 && (
                            <div className="py-4 px-3 text-center text-muted-foreground text-sm">
                              All categories are already selected
                            </div>
                          )
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Add all unselected categories
                      const unselectedIds = categories
                        .filter(cat => !featuredCategorySettings.selectedCategories.includes(cat.id))
                        .map(cat => cat.id);
                      setFeaturedCategorySettings(prev => ({
                        ...prev,
                        selectedCategories: [...prev.selectedCategories, ...unselectedIds]
                      }));
                    }}
                    disabled={categories.filter(cat => !featuredCategorySettings.selectedCategories.includes(cat.id)).length === 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add All
                  </Button>
                </div>
                
                {/* Show count */}
                <p className="text-xs text-muted-foreground">
                  {featuredCategorySettings.selectedCategories.length} of {categories.length} categories selected
                </p>
                {/* Drag-and-drop for selected categories */}
                <div className="mt-4">
                  <Label className="text-xs mb-1">Selected Categories (Drag to reorder)</Label>
                  <DragDropContext
                    onDragEnd={(result: DropResult) => {
                      if (!result.destination) return;
                      const reordered = Array.from(featuredCategorySettings.selectedCategories);
                      const [removed] = reordered.splice(result.source.index, 1);
                      reordered.splice(result.destination.index, 0, removed);
                      setFeaturedCategorySettings(prev => ({ ...prev, selectedCategories: reordered }));
                    }}
                  >
                    <Droppable droppableId="selected-categories" direction="horizontal">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex gap-2 flex-wrap"
                        >
                          {featuredCategorySettings.selectedCategories.map((catId, idx) => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            return (
                              <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                                {(dragProvided) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className="flex flex-col gap-1 p-2 border-2 border-primary rounded bg-muted/40 hover:bg-muted/60 min-w-[120px]"
                                  >
                                    <div className="flex items-center gap-2 cursor-move">
                                      <span className="font-medium text-sm">{cat.name}</span>
                                      <button
                                        type="button"
                                        className="ml-auto text-xs text-red-500 hover:underline"
                                        onClick={() => {
                                          setFeaturedCategorySettings(prev => {
                                            const newSettings = { ...prev };
                                            newSettings.selectedCategories = prev.selectedCategories.filter(id => id !== cat.id);
                                            if (newSettings.images) delete newSettings.images[cat.id];
                                            return newSettings;
                                          });
                                        }}
                                      >Remove</button>
                                    </div>
                                    <div className="mt-1">
                                      <Label className="text-xs">Category Image</Label>
                                      <MediaPicker
                                        value={featuredCategorySettings.images?.[cat.id] || ""}
                                        onChange={url => setFeaturedCategorySettings(prev => ({
                                          ...prev,
                                          images: { ...(prev.images || {}), [cat.id]: url }
                                        }))}
                                        folder="categories"
                                      />
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('featured_category_section', featuredCategorySettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Featured Categories Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collection Section */}
        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Our Collection Section
              </CardTitle>
              <CardDescription>
                Manage the product collection grid on homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Collection Section</Label>
                  <p className="text-sm text-muted-foreground">Show product collection on homepage</p>
                </div>
                <Switch
                  checked={collectionSettings.enabled}
                  onCheckedChange={(checked) => 
                    setCollectionSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (EN)</Label>
                  <Input
                    value={collectionSettings.title}
                    onChange={(e) => setCollectionSettings(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (AR)</Label>
                  <Input
                    value={collectionSettings.titleAr}
                    onChange={(e) => setCollectionSettings(prev => ({ ...prev, titleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtitle (EN)</Label>
                  <Textarea
                    value={collectionSettings.subtitle}
                    onChange={(e) => setCollectionSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle (AR)</Label>
                  <Textarea
                    value={collectionSettings.subtitleAr}
                    onChange={(e) => setCollectionSettings(prev => ({ ...prev, subtitleAr: e.target.value }))}
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Products to Display</Label>
                  <Input
                    type="number"
                    min={4}
                    max={24}
                    value={collectionSettings.productsLimit}
                    onChange={(e) => setCollectionSettings(prev => ({ ...prev, productsLimit: parseInt(e.target.value) || 8 }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={collectionSettings.showFeaturedOnly}
                    onCheckedChange={(checked) => 
                      setCollectionSettings(prev => ({ ...prev, showFeaturedOnly: checked }))
                    }
                  />
                  <Label>Show Featured Products Only</Label>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('collection_section', collectionSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Collection Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gift Section */}
        <TabsContent value="gift">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Gift Section
              </CardTitle>
              <CardDescription>
                Manage the Gift Garden section on homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Gift Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide gift section</p>
                </div>
                <Switch
                  checked={giftSettings.enabled}
                  onCheckedChange={(checked) => 
                    setGiftSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (EN)</Label>
                  <Input
                    value={giftSettings.title}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (AR)</Label>
                  <Input
                    value={giftSettings.titleAr}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, titleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtitle (EN)</Label>
                  <Textarea
                    value={giftSettings.subtitle}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle (AR)</Label>
                  <Textarea
                    value={giftSettings.subtitleAr}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, subtitleAr: e.target.value }))}
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Button Text (EN)</Label>
                  <Input
                    value={giftSettings.buttonText}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, buttonText: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text (AR)</Label>
                  <Input
                    value={giftSettings.buttonTextAr}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, buttonTextAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Link</Label>
                  <Input
                    value={giftSettings.buttonLink}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, buttonLink: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Products to Display</Label>
                  <Input
                    type="number"
                    min={3}
                    max={12}
                    value={giftSettings.productsLimit || 6}
                    onChange={(e) => setGiftSettings(prev => ({ ...prev, productsLimit: parseInt(e.target.value) || 6 }))}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Manually Select Gift Products (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Drag to reorder. Leave empty to auto-select by category/tag.</p>
                <GiftProductSelector
                  selected={giftSettings.items || []}
                  onChange={items => setGiftSettings(prev => ({ ...prev, items }))}
                  productsLimit={giftSettings.productsLimit || 6}
                />
              </div>

              <Button 
                onClick={() => saveSettings('gift_section', giftSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Gift Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Section */}
        <TabsContent value="promo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Promo/Sale Section
              </CardTitle>
              <CardDescription>
                Manage promotional banners and sale sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Promo Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide promo banner</p>
                </div>
                <Switch
                  checked={promoSettings.enabled}
                  onCheckedChange={(checked) => 
                    setPromoSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (EN)</Label>
                  <Input
                    value={promoSettings.title}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (AR)</Label>
                  <Input
                    value={promoSettings.titleAr}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, titleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={promoSettings.subtitle}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (AR)</Label>
                  <Textarea
                    value={promoSettings.subtitleAr}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, subtitleAr: e.target.value }))}
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Label (EN)</Label>
                  <Input
                    value={promoSettings.discountText}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, discountText: e.target.value }))}
                    placeholder="Limited Time Offer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Label (AR)</Label>
                  <Input
                    value={promoSettings.discountTextAr}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, discountTextAr: e.target.value }))}
                    placeholder="عرض لفترة محدودة"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Button Text (EN)</Label>
                  <Input
                    value={promoSettings.buttonText}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, buttonText: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Button Text (AR)</Label>
                  <Input
                    value={promoSettings.buttonTextAr}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, buttonTextAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Button Link</Label>
                  <Input
                    value={promoSettings.buttonLink}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, buttonLink: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Secondary Button Text (EN)</Label>
                  <Input
                    value={promoSettings.secondaryButtonText}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Text (AR)</Label>
                  <Input
                    value={promoSettings.secondaryButtonTextAr}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, secondaryButtonTextAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Link</Label>
                  <Input
                    value={promoSettings.secondaryButtonLink}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, secondaryButtonLink: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Image</Label>
                <MediaPicker
                  value={promoSettings.backgroundImage}
                  onChange={(url) => setPromoSettings(prev => ({ ...prev, backgroundImage: url }))}
                />
              </div>

              <Button 
                onClick={() => saveSettings('promo_section', promoSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Promo Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instagram Section */}
        <TabsContent value="instagram">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-primary" />
                Instagram Section
              </CardTitle>
              <CardDescription>
                Manage the Instagram feed section on homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Instagram Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide Instagram feed</p>
                </div>
                <Switch
                  checked={instagramSettings.enabled}
                  onCheckedChange={(checked) => 
                    setInstagramSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instagram Username</Label>
                  <Input
                    value={instagramSettings.username}
                    onChange={(e) => setInstagramSettings(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="@yourusername"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile URL</Label>
                  <Input
                    value={instagramSettings.profileUrl}
                    onChange={(e) => setInstagramSettings(prev => ({ ...prev, profileUrl: e.target.value }))}
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={instagramSettings.title}
                  onChange={(e) => setInstagramSettings(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Custom Images (Max 6)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (instagramSettings.images.length < 6) {
                        setInstagramSettings(prev => ({ ...prev, images: [...prev.images, ''] }));
                      }
                    }}
                    disabled={instagramSettings.images.length >= 6}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Image
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Leave empty to use default images. Add custom images to display your own Instagram posts.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {instagramSettings.images.map((image, index) => (
                    <div key={index} className="relative">
                      <MediaPicker
                        value={image}
                        onChange={(url) => {
                          const newImages = [...instagramSettings.images];
                          newImages[index] = url;
                          setInstagramSettings(prev => ({ ...prev, images: newImages }));
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => {
                          const newImages = instagramSettings.images.filter((_, i) => i !== index);
                          setInstagramSettings(prev => ({ ...prev, images: newImages }));
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('instagram_section', instagramSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Instagram Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Settings
        </Button>
      </div>
    </div>
  );
};
