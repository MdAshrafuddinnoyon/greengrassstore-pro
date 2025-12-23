import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  name_ar?: string;
  price: number;
  featured_image?: string;
  slug: string;
}

interface GiftProductSelectorProps {
  selected: Product[];
  onChange: (items: Product[]) => void;
  productsLimit: number;
}

export const GiftProductSelector = ({ selected, onChange, productsLimit }: GiftProductSelectorProps) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, name_ar, price, featured_image, slug, category, subcategory, tags')
        .eq('is_active', true)
        .limit(100);
      if (!error && data) {
        // Only products matching gift category/tag
        const filtered = data.filter((product: any) => {
          const categoryLower = product.category?.toLowerCase() || '';
          const subcategoryLower = product.subcategory?.toLowerCase() || '';
          const categoryMatch = categoryLower.includes('gift') || categoryLower === 'gifts';
          const subcategoryMatch = subcategoryLower.includes('gift') || subcategoryLower === 'gifts';
          const tagsMatch = product.tags?.some((tag: string) => tag.toLowerCase().includes('gift') || tag.toLowerCase() === 'gifts');
          return categoryMatch || subcategoryMatch || tagsMatch;
        });
        setAllProducts(filtered);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Remove from available if already selected
  const available = allProducts.filter(p => !selected.some(s => s.id === p.id));

  const handleAdd = (product: Product) => {
    if (selected.length < productsLimit) {
      onChange([...selected, product]);
    }
  };
  const handleRemove = (id: string) => {
    onChange(selected.filter(p => p.id !== id));
  };
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(selected);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onChange(reordered);
  };

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">Available Products</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {available.map(product => (
          <Button key={product.id} size="sm" variant="outline" onClick={() => handleAdd(product)}>
            {product.name}
          </Button>
        ))}
        {loading && <span>Loading...</span>}
        {available.length === 0 && !loading && <span className="text-xs">No more products</span>}
      </div>
      <div className="mb-2 text-xs text-muted-foreground">Selected Products (Drag to reorder)</div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="selected-gift-products" direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-2 flex-wrap">
              {selected.map((product, idx) => (
                <Draggable key={product.id} draggableId={product.id} index={idx}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className="flex items-center gap-2 p-2 border rounded bg-muted/40 min-w-[120px]"
                    >
                      <span>{product.name}</span>
                      <Button size="icon" variant="destructive" onClick={() => handleRemove(product.id)}>
                        ×
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
