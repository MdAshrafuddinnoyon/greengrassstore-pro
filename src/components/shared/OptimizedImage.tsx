import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
  showPlaceholder?: boolean;
  placeholderText?: string;
  onLoad?: () => void;
}

/**
 * OptimizedImage - Lazy loading image component with WebP support and responsive srcset
 * 
 * Features:
 * - Lazy loading (native)
 * - Error handling with placeholder
 * - Smooth loading transition
 * - Responsive sizing via sizes prop
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  aspectRatio = "auto",
  showPlaceholder = true,
  placeholderText = "No Image",
  onLoad
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: ""
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || !src) {
    if (!showPlaceholder) return null;
    
    return (
      <div className={cn(
        "w-full h-full flex flex-col items-center justify-center bg-muted/30",
        aspectClasses[aspectRatio],
        className
      )}>
        <ImageOff className="w-12 h-12 text-muted-foreground/40 mb-2" />
        <span className="text-xs text-muted-foreground/60">{placeholderText}</span>
      </div>
    );
  }

  // Generate srcset for responsive images (if URL supports width parameters)
  const generateSrcSet = (url: string) => {
    // Check if URL is from Supabase storage (supports image transformations)
    if (url.includes('supabase') && url.includes('/storage/')) {
      const widths = [320, 640, 768, 1024, 1280];
      return widths
        .map(w => `${url}?width=${w}&quality=80 ${w}w`)
        .join(', ');
    }
    return undefined;
  };

  const srcSet = generateSrcSet(src);

  return (
    <div className={cn("relative overflow-hidden", aspectClasses[aspectRatio], className)}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
      )}
      
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};
