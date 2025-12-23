import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Category {
  key: string;
  label: string;
  isParent?: boolean;
}

interface FilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
  tags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  colors?: string[];
  selectedColors?: string[];
  onColorsChange?: (colors: string[]) => void;
  sizes?: string[];
  selectedSizes?: string[];
  onSizesChange?: (sizes: string[]) => void;
  onClearAll: () => void;
}

const colorMap: Record<string, string> = {
  White: "#FFFFFF",
  Black: "#000000",
  Green: "#2d5a3d",
  Brown: "#8B4513",
  Terracotta: "#E2725B",
  Blue: "#4169E1",
  Gray: "#808080",
  Beige: "#F5F5DC",
  Red: "#DC143C",
  Yellow: "#FFD700",
  Pink: "#FFB6C1",
  Orange: "#FF8C00",
};

export const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  maxPrice,
  tags,
  selectedTags,
  onTagsChange,
  colors = [],
  selectedColors = [],
  onColorsChange,
  sizes = [],
  selectedSizes = [],
  onSizesChange,
  materials = [],
  selectedMaterials = [],
  onMaterialsChange,
  onClearAll,
}: FilterProps & {
  materials?: string[];
  selectedMaterials?: string[];
  onMaterialsChange?: (materials: string[]) => void;
}) => {
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    colors: true,
    sizes: true,
    materials: true,
    tags: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleColorToggle = (color: string) => {
    if (!onColorsChange) return;
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter((c) => c !== color));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  const handleSizeToggle = (size: string) => {
    if (!onSizesChange) return;
    if (selectedSizes.includes(size)) {
      onSizesChange(selectedSizes.filter((s) => s !== size));
    } else {
      onSizesChange([...selectedSizes, size]);
    }
  };

  const handleMaterialToggle = (material: string) => {
    if (!onMaterialsChange) return;
    if (selectedMaterials?.includes(material)) {
      onMaterialsChange(selectedMaterials.filter((m) => m !== material));
    } else {
      onMaterialsChange([...(selectedMaterials || []), material]);
    }
  };

  const hasActiveFilters = 
    selectedCategory !== "all" || 
    selectedTags.length > 0 || 
    selectedColors.length > 0 || 
    selectedSizes.length > 0 || 
    (selectedMaterials?.length || 0) > 0 ||
    priceRange[0] > 0 || 
    priceRange[1] < maxPrice;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-[#2d5a3d] hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Price Range Filter - AT TOP */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection("price")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Price Range</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSections.price ? "rotate-180" : ""}`} />
        </button>
        {openSections.price && (
          <div className="px-4 pb-4 space-y-4">
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              max={maxPrice}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">AED</span>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                  className="w-20 px-2 py-1 border border-gray-200 rounded text-center"
                />
              </div>
              <span className="text-gray-400">—</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">AED</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                  className="w-20 px-2 py-1 border border-gray-200 rounded text-center"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection("category")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Category</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSections.category ? "rotate-180" : ""}`} />
        </button>
        {openSections.category && (
          <div className="px-4 pb-4 space-y-1">
            {categories.map((cat) => (
              <label 
                key={cat.key} 
                className={cn(
                  "flex items-center gap-3 cursor-pointer group py-1.5",
                  cat.isParent && "font-medium text-gray-900 mt-2 first:mt-0"
                )}
              >
                <Checkbox
                  checked={selectedCategory === cat.key}
                  onCheckedChange={() => onCategoryChange(cat.key)}
                  className="border-gray-300 data-[state=checked]:bg-[#2d5a3d] data-[state=checked]:border-[#2d5a3d]"
                />
                <span className={cn(
                  "text-sm group-hover:text-gray-900",
                  cat.isParent ? "text-gray-900 font-medium" : "text-gray-600 pl-2"
                )}>
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Colors Filter */}
      {colors.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection("colors")}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">Color</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSections.colors ? "rotate-180" : ""}`} />
          </button>
          {openSections.colors && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const isSelected = selectedColors.includes(color);
                  const bgColor = colorMap[color] || "#ddd";
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorToggle(color)}
                      title={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        isSelected ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/30" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: bgColor }}
                    >
                      {isSelected && (
                        <span className={`flex items-center justify-center text-xs ${bgColor === "#FFFFFF" || bgColor === "#F5F5DC" ? "text-gray-800" : "text-white"}`}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {colors.map((color) => (
                  <button
                    key={`label-${color}`}
                    onClick={() => handleColorToggle(color)}
                    className={`px-2 py-0.5 text-xs rounded ${
                      selectedColors.includes(color)
                        ? "bg-[#2d5a3d] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sizes Filter */}
      {sizes.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection("sizes")}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">Size</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSections.sizes ? "rotate-180" : ""}`} />
          </button>
          {openSections.sizes && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[#2d5a3d] text-white border-[#2d5a3d]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#2d5a3d]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Materials Filter */}
      {materials && materials.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection("materials")}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">Material</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSections.materials ? "rotate-180" : ""}`} />
          </button>
          {openSections.materials && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {materials.map((material) => {
                  const isSelected = selectedMaterials?.includes(material);
                  return (
                    <button
                      key={material}
                      onClick={() => handleMaterialToggle(material)}
                      className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[#2d5a3d] text-white border-[#2d5a3d]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#2d5a3d]"
                      }`}
                    >
                      {material}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("tags")}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">Tags</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSections.tags ? "rotate-180" : ""}`} />
          </button>
          {openSections.tags && (
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-[#2d5a3d] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
