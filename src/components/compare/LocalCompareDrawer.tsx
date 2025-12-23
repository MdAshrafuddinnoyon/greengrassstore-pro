import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompareStore } from "@/stores/compareStore";
import { X, ChevronUp, ChevronDown, GitCompare, Trash2, Check, Minus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const LocalCompareDrawer = () => {
  const { items, removeItem, clearAll, isOpen, toggleCompareDrawer } = useCompareStore();
  const [minimized, setMinimized] = useState(false);
  const location = useLocation();

  // Hide on admin pages
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute || items.length === 0) return null;

  return (
    <>
      {/* Floating Compare Bar */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto pointer-events-auto">
              <div className="bg-background border border-border rounded-xl shadow-xl overflow-hidden">
                {/* Header */}
                <div 
                  className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-pointer"
                  onClick={() => setMinimized(!minimized)}
                >
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-primary" />
                    <span className="font-medium">Compare Products</span>
                    <Badge variant="secondary">{items.length}/4</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); clearAll(); }}
                    >
                      Clear All
                    </Button>
                    {minimized ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Products Preview */}
                <AnimatePresence>
                  {!minimized && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex gap-3 mb-4">
                          {items.map((item) => (
                            <div key={item.id} className="relative flex-1 max-w-[120px]">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img 
                                  src={item.featured_image || '/placeholder.svg'} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <p className="text-xs font-medium truncate mt-1">{item.name}</p>
                            </div>
                          ))}
                          
                          {/* Empty slots */}
                          {Array.from({ length: 4 - items.length }).map((_, i) => (
                            <div 
                              key={`empty-${i}`} 
                              className="flex-1 max-w-[120px] aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center"
                            >
                              <span className="text-xs text-muted-foreground">Add</span>
                            </div>
                          ))}
                        </div>

                        <Button 
                          onClick={() => toggleCompareDrawer(true)} 
                          className="w-full"
                          disabled={items.length < 2}
                        >
                          Compare Now
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Compare Sheet */}
      <Sheet open={isOpen} onOpenChange={() => toggleCompareDrawer(false)}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Compare Products ({items.length})
              </SheetTitle>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </SheetHeader>

          {/* Comparison Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-muted/50 w-32">Attribute</th>
                  {items.map((item) => (
                    <th key={item.id} className="p-3 bg-muted/50">
                      <div className="relative">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden bg-muted mb-2">
                          <img 
                            src={item.featured_image || '/placeholder.svg'} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Link 
                          to={`/product/${item.slug}`}
                          className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="border-b">
                  <td className="p-3 font-medium text-muted-foreground">Price</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-center">
                      <span className="text-lg font-bold text-primary">
                        {item.currency} {item.price.toFixed(2)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Description Row */}
                <tr className="border-b">
                  <td className="p-3 font-medium text-muted-foreground">Description</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-center text-sm">
                      {item.description ? (
                        <p className="line-clamp-3">{item.description}</p>
                      ) : (
                        <Minus className="w-4 h-4 mx-auto text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Availability Row */}
                <tr className="border-b">
                  <td className="p-3 font-medium text-muted-foreground">Availability</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        In Stock
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Action</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-center">
                      <Link to={`/product/${item.slug}`}>
                        <Button size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
