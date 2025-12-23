import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, X, ImageOff } from "lucide-react";

interface ImageNode {
  url: string;
  altText: string | null;
}

interface ProductGalleryProps {
  images: Array<{ node: ImageNode }> | string[];
  productTitle: string;
}

// Image component with error handling
const GalleryImage = ({ 
  src, 
  alt, 
  className,
  onError 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  onError?: () => void;
}) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/50 ${className}`}>
        <ImageOff className="w-16 h-16 text-muted-foreground/40 mb-3" />
        <span className="text-sm text-muted-foreground/60">No Image Available</span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
};

// Thumbnail with error handling
const ThumbnailImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <ImageOff className="w-6 h-6 text-muted-foreground/40" />
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export const ProductGallery = ({ images, productTitle }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Normalize images to handle both formats
  const normalizedImages = images.map((img) => {
    if (typeof img === 'string') {
      return { node: { url: img, altText: productTitle } };
    }
    return img;
  });

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
    setMainImageError(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
    setMainImageError(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isHovering || mainImageError) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (normalizedImages.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center">
        <ImageOff className="w-16 h-16 text-muted-foreground/40 mb-3" />
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  const currentImageUrl = normalizedImages[selectedIndex]?.node.url;
  const currentImageAlt = normalizedImages[selectedIndex]?.node.altText || productTitle;

  return (
    <>
      <div className="space-y-4">
        {/* Main Image with Hover Zoom */}
        <div 
          ref={imageRef}
          className={`relative aspect-square bg-muted rounded-2xl overflow-hidden group ${!mainImageError ? 'cursor-zoom-in' : ''}`}
          onMouseEnter={() => !mainImageError && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          onClick={() => !mainImageError && setIsZoomed(true)}
        >
          {!currentImageUrl || mainImageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
              <ImageOff className="w-20 h-20 text-muted-foreground/40 mb-4" />
              <span className="text-lg text-muted-foreground/60">No Image Available</span>
            </div>
          ) : (
            <motion.img
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={currentImageUrl}
              alt={currentImageAlt}
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isHovering ? 'scale-150' : 'scale-100'
              }`}
              style={isHovering ? {
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
              } : undefined}
              onError={() => setMainImageError(true)}
            />
          )}
          
          {/* Zoom Hint */}
          {!mainImageError && currentImageUrl && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
                <ZoomIn className="w-4 h-4" />
                <span>Click to expand</span>
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          {normalizedImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {normalizedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
              {selectedIndex + 1} / {normalizedImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {normalizedImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {normalizedImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  setMainImageError(false);
                }}
                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === idx
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-border"
                }`}
              >
                <ThumbnailImage
                  src={img.node.url}
                  alt={img.node.altText || `${productTitle} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {normalizedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {currentImageUrl && !mainImageError ? (
              <motion.img
                key={`zoom-${selectedIndex}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={currentImageUrl}
                alt={currentImageAlt}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <ImageOff className="w-24 h-24 opacity-40 mb-4" />
                <span className="text-xl opacity-60">No Image Available</span>
              </div>
            )}

            {/* Lightbox Thumbnails */}
            {normalizedImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4">
                {normalizedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(idx);
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIndex === idx ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ThumbnailImage
                      src={img.node.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
