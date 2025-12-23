import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Save, RefreshCw, Plus, Trash2, GripVertical, 
  ChevronDown, ChevronUp, Leaf, Flower2, Package, Shrub, 
  Sparkles, Gift, Tag, Image, Upload, TreeDeciduous, Boxes, Fence
} from "lucide-react";
import { MediaPicker } from "./MediaPicker";

interface SubCategory {
  id: string;
  name: string;
  nameAr: string;
  href: string;
  icon: string;
  customIcon?: string;
  order: number;
}

interface MegaMenuCategory {
  id: string;
  name: string;
  nameAr: string;
  href: string;
  icon: string;
  customIcon?: string;
  image: string;
  isSale: boolean;
  isActive: boolean;
  order: number;
  featuredTitle: string;
  featuredTitleAr: string;
  featuredSubtitle: string;
  featuredSubtitleAr: string;
  featuredHref: string;
  subcategories: SubCategory[];
}

const iconOptions = [
  { value: 'leaf', label: 'Leaf/Plants', Icon: Leaf },
  { value: 'tree-deciduous', label: 'Tree', Icon: TreeDeciduous },
  { value: 'flower', label: 'Flower', Icon: Flower2 },
  { value: 'package', label: 'Package/Pot', Icon: Package },
  { value: 'boxes', label: 'Boxes', Icon: Boxes },
  { value: 'shrub', label: 'Shrub/Greenery', Icon: Shrub },
  { value: 'fence', label: 'Fence/Hanging', Icon: Fence },
  { value: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'gift', label: 'Gift', Icon: Gift },
  { value: 'tag', label: 'Tag/Sale', Icon: Tag },
  { value: 'custom-url', label: 'Custom Image URL', Icon: Image },
  { value: 'custom-svg', label: 'Custom SVG Code', Icon: Upload },
];

export const MegaMenuManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ id: string; file_path: string; file_name: string }[]>([]);
  const [imageSelectOpen, setImageSelectOpen] = useState<string | null>(null);

  const [categories, setCategories] = useState<MegaMenuCategory[]>([
    {
      id: '1',
      name: 'Plants',
      nameAr: 'نباتات',
      href: '/shop?category=plants',
      icon: 'leaf',
      image: '',
      isSale: false,
      isActive: true,
      order: 1,
      featuredTitle: 'New Arrivals',
      featuredTitleAr: 'وصل حديثاً',
      featuredSubtitle: 'Fresh plants collection',
      featuredSubtitleAr: 'مجموعة نباتات طازجة',
      featuredHref: '/shop?category=plants&sort=newest',
      subcategories: [
        { id: '1-1', name: 'Mixed Plant', nameAr: 'نباتات مختلطة', href: '/shop?category=mixed-plant', icon: 'leaf', order: 1 },
        { id: '1-2', name: 'Palm Tree', nameAr: 'شجرة النخيل', href: '/shop?category=palm-tree', icon: 'tree-deciduous', order: 2 },
        { id: '1-3', name: 'Ficus Tree', nameAr: 'شجرة الفيكس', href: '/shop?category=ficus-tree', icon: 'tree-deciduous', order: 3 },
        { id: '1-4', name: 'Paradise Plant', nameAr: 'نبات الجنة', href: '/shop?category=paradise-plant', icon: 'leaf', order: 4 },
        { id: '1-5', name: 'Bamboo Tree', nameAr: 'شجرة البامبو', href: '/shop?category=bamboo-tree', icon: 'tree-deciduous', order: 5 },
        { id: '1-6', name: 'Olive Tree', nameAr: 'شجرة الزيتون', href: '/shop?category=olive-tree', icon: 'tree-deciduous', order: 6 },
      ]
    },
    {
      id: '2',
      name: 'Flowers',
      nameAr: 'زهور',
      href: '/shop?category=flowers',
      icon: 'flower',
      image: '',
      isSale: false,
      isActive: true,
      order: 2,
      featuredTitle: 'Seasonal Blooms',
      featuredTitleAr: 'أزهار موسمية',
      featuredSubtitle: 'Beautiful flower arrangements',
      featuredSubtitleAr: 'ترتيبات زهور جميلة',
      featuredHref: '/shop?category=flowers',
      subcategories: [
        { id: '2-1', name: 'Flower', nameAr: 'زهرة', href: '/shop?category=flower', icon: 'flower', order: 1 },
      ]
    },
    {
      id: '3',
      name: 'Pots',
      nameAr: 'أواني',
      href: '/shop?category=pots',
      icon: 'package',
      image: '',
      isSale: false,
      isActive: true,
      order: 3,
      featuredTitle: 'Designer Pots',
      featuredTitleAr: 'أواني مصممة',
      featuredSubtitle: 'Premium collection',
      featuredSubtitleAr: 'مجموعة فاخرة',
      featuredHref: '/shop?category=pots',
      subcategories: [
        { id: '3-1', name: 'Fiber Pot', nameAr: 'أواني فايبر', href: '/shop?category=fiber-pot', icon: 'package', order: 1 },
        { id: '3-2', name: 'Plastic Pot', nameAr: 'أواني بلاستيك', href: '/shop?category=plastic-pot', icon: 'package', order: 2 },
        { id: '3-3', name: 'Ceramic Pot', nameAr: 'أواني سيراميك', href: '/shop?category=ceramic-pot', icon: 'package', order: 3 },
      ]
    },
    {
      id: '4',
      name: 'Greenery',
      nameAr: 'خضرة',
      href: '/shop?category=greenery',
      icon: 'shrub',
      image: '',
      isSale: false,
      isActive: true,
      order: 4,
      featuredTitle: 'Green Walls',
      featuredTitleAr: 'جدران خضراء',
      featuredSubtitle: 'Transform your space',
      featuredSubtitleAr: 'حول مساحتك',
      featuredHref: '/shop?category=green-wall',
      subcategories: [
        { id: '4-1', name: 'Green Wall', nameAr: 'جدار أخضر', href: '/shop?category=green-wall', icon: 'shrub', order: 1 },
        { id: '4-2', name: 'Greenery Bunch', nameAr: 'حزمة الخضرة', href: '/shop?category=greenery-bunch', icon: 'shrub', order: 2 },
        { id: '4-3', name: 'Moss', nameAr: 'طحلب', href: '/shop?category=moss', icon: 'shrub', order: 3 },
      ]
    },
    {
      id: '5',
      name: 'Hanging',
      nameAr: 'معلقات',
      href: '/shop?category=hanging',
      icon: 'fence',
      image: '',
      isSale: false,
      isActive: true,
      order: 5,
      featuredTitle: 'Hanging Plants',
      featuredTitleAr: 'نباتات معلقة',
      featuredSubtitle: 'Beautiful hanging decor',
      featuredSubtitleAr: 'ديكور معلق جميل',
      featuredHref: '/shop?category=hanging',
      subcategories: []
    },
    {
      id: '6',
      name: 'Gifts',
      nameAr: 'هدايا',
      href: '/shop?category=gifts',
      icon: 'gift',
      image: '',
      isSale: false,
      isActive: true,
      order: 6,
      featuredTitle: 'Gift Sets',
      featuredTitleAr: 'مجموعات هدايا',
      featuredSubtitle: 'Perfect for any occasion',
      featuredSubtitleAr: 'مثالية لأي مناسبة',
      featuredHref: '/shop?category=gifts',
      subcategories: []
    },
    {
      id: '7',
      name: 'Sale',
      nameAr: 'تخفيضات',
      href: '/shop?category=sale',
      icon: 'tag',
      image: '',
      isSale: true,
      isActive: true,
      order: 7,
      featuredTitle: '',
      featuredTitleAr: '',
      featuredSubtitle: '',
      featuredSubtitleAr: '',
      featuredHref: '',
      subcategories: []
    }
  ]);

  // Fetch media files for image selection
  const fetchMediaFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('id, file_path, file_name')
        .eq('file_type', 'image')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error('Error fetching media files:', error);
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'mega_menu_categories')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCategories(data.setting_value as unknown as MegaMenuCategory[]);
      }
    } catch (error) {
      console.error('Error fetching mega menu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    fetchMediaFiles();
  }, []);

  const saveContent = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'mega_menu_categories')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(categories)) })
          .eq('setting_key', 'mega_menu_categories');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'mega_menu_categories', setting_value: JSON.parse(JSON.stringify(categories)) });
        if (error) throw error;
      }
      
      toast.success('Mega Menu saved successfully');
    } catch (error) {
      console.error('Error saving mega menu:', error);
      toast.error('Failed to save mega menu');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newCategory: MegaMenuCategory = {
      id: Date.now().toString(),
      name: 'New Category',
      nameAr: 'فئة جديدة',
      href: '/shop?category=new',
      icon: 'leaf',
      image: '',
      isSale: false,
      isActive: true,
      order: categories.length + 1,
      featuredTitle: '',
      featuredTitleAr: '',
      featuredSubtitle: '',
      featuredSubtitleAr: '',
      featuredHref: '',
      subcategories: []
    };
    setCategories([...categories, newCategory]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const updateCategory = (id: string, field: keyof MegaMenuCategory, value: unknown) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const addSubcategory = (categoryId: string) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        const newSub: SubCategory = {
          id: `${categoryId}-${Date.now()}`,
          name: 'New Subcategory',
          nameAr: 'فئة فرعية جديدة',
          href: '/shop?category=new-sub',
          icon: 'leaf',
          order: cat.subcategories.length + 1
        };
        return { ...cat, subcategories: [...cat.subcategories, newSub] };
      }
      return cat;
    }));
  };

  const removeSubcategory = (categoryId: string, subId: string) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== subId) };
      }
      return cat;
    }));
  };

  const updateSubcategory = (categoryId: string, subId: string, field: keyof SubCategory, value: string | number) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === subId ? { ...sub, [field]: value } : sub
          )
        };
      }
      return cat;
    }));
  };

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(cat => cat.id === id);
    if (direction === 'up' && index > 0) {
      const newCategories = [...categories];
      [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
      newCategories.forEach((cat, i) => cat.order = i + 1);
      setCategories(newCategories);
    } else if (direction === 'down' && index < categories.length - 1) {
      const newCategories = [...categories];
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
      newCategories.forEach((cat, i) => cat.order = i + 1);
      setCategories(newCategories);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? <iconOption.Icon className="w-4 h-4" /> : <Leaf className="w-4 h-4" />;
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-primary" />
            Mega Menu Manager
          </CardTitle>
          <CardDescription>
            Manage header navigation categories, subcategories, and mega menu content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.sort((a, b) => a.order - b.order).map((category, index) => (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-slate-50 p-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {getIconComponent(category.icon)}
                </div>

                <div className="flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.nameAr}</p>
                </div>

                <div className="flex items-center gap-2">
                  {category.isSale && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">SALE</span>
                  )}
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={(checked) => updateCategory(category.id, 'isActive', checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCategory(category.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Category Details */}
              {expandedCategory === category.id && (
                <div className="p-4 space-y-6 border-t">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name (EN)</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (AR)</Label>
                      <Input
                        value={category.nameAr}
                        onChange={(e) => updateCategory(category.id, 'nameAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={category.href}
                        onChange={(e) => updateCategory(category.id, 'href', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={category.icon}
                        onValueChange={(value) => updateCategory(category.id, 'icon', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <opt.Icon className="w-4 h-4" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {category.icon === 'custom-url' && (
                        <div className="mt-2 space-y-2">
                          <Input
                            value={category.customIcon || ''}
                            onChange={(e) => updateCategory(category.id, 'customIcon', e.target.value)}
                            placeholder="Enter icon image URL (png, svg, jpg)"
                            className="text-sm"
                          />
                          {category.customIcon && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <img src={category.customIcon} alt="Icon preview" className="w-6 h-6 object-contain" />
                              <span className="text-xs text-muted-foreground">Preview</span>
                            </div>
                          )}
                        </div>
                      )}
                      {category.icon === 'custom-svg' && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={category.customIcon || ''}
                            onChange={(e) => updateCategory(category.id, 'customIcon', e.target.value)}
                            placeholder="Paste SVG code here (e.g., <svg>...</svg>)"
                            className="w-full p-2 text-xs font-mono border rounded-md min-h-[80px] bg-background"
                          />
                          {category.customIcon && category.customIcon.includes('<svg') && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <div 
                                className="w-6 h-6" 
                                dangerouslySetInnerHTML={{ __html: category.customIcon }}
                              />
                              <span className="text-xs text-muted-foreground">Preview</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Category Image</Label>
                      <MediaPicker
                        value={category.image}
                        onChange={(url) => updateCategory(category.id, 'image', url)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Is Sale Category</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={category.isSale}
                          onCheckedChange={(checked) => updateCategory(category.id, 'isSale', checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {category.isSale ? 'Yes (Red highlight)' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Featured Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Featured Section (Mega Menu)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Featured Title (EN)</Label>
                        <Input
                          value={category.featuredTitle}
                          onChange={(e) => updateCategory(category.id, 'featuredTitle', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Featured Title (AR)</Label>
                        <Input
                          value={category.featuredTitleAr}
                          onChange={(e) => updateCategory(category.id, 'featuredTitleAr', e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Featured Subtitle (EN)</Label>
                        <Input
                          value={category.featuredSubtitle}
                          onChange={(e) => updateCategory(category.id, 'featuredSubtitle', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Featured Subtitle (AR)</Label>
                        <Input
                          value={category.featuredSubtitleAr}
                          onChange={(e) => updateCategory(category.id, 'featuredSubtitleAr', e.target.value)}
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Featured Link URL</Label>
                      <Input
                        value={category.featuredHref}
                        onChange={(e) => updateCategory(category.id, 'featuredHref', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Subcategories</h4>
                      <Button variant="outline" size="sm" onClick={() => addSubcategory(category.id)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subcategory
                      </Button>
                    </div>
                    
                    {category.subcategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No subcategories. Add one to show in mega menu dropdown.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {category.subcategories.map((sub, subIndex) => (
                          <div key={sub.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-muted-foreground w-6">{subIndex + 1}</span>
                            <Input
                              value={sub.name}
                              onChange={(e) => updateSubcategory(category.id, sub.id, 'name', e.target.value)}
                              placeholder="Name (EN)"
                              className="flex-1"
                            />
                            <Input
                              value={sub.nameAr}
                              onChange={(e) => updateSubcategory(category.id, sub.id, 'nameAr', e.target.value)}
                              placeholder="Name (AR)"
                              className="flex-1"
                              dir="rtl"
                            />
                            <Input
                              value={sub.href}
                              onChange={(e) => updateSubcategory(category.id, sub.id, 'href', e.target.value)}
                              placeholder="URL"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubcategory(category.id, sub.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addCategory} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>

          <Button 
            onClick={saveContent}
            disabled={saving}
            className="w-full"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Mega Menu
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchContent}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
};
