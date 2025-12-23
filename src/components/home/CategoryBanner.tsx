import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  href: string;
  layout?: "left" | "right" | "center";
  bgColor?: string;
}

export const CategoryBanner = ({
  title,
  subtitle,
  description,
  image,
  href,
  layout = "left",
  bgColor = "bg-secondary",
}: CategoryBannerProps) => {
  if (layout === "center") {
    return (
      <section className="relative h-[280px] md:h-[450px] overflow-hidden mx-4 md:mx-0 rounded-2xl md:rounded-none my-4 md:my-0">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-end md:items-center justify-center text-center text-white p-6 md:p-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {subtitle && (
              <p className="text-[10px] md:text-xs uppercase tracking-widest mb-2 text-white/80">
                {subtitle}
              </p>
            )}
            <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-normal mb-3 md:mb-4">
              {title}
            </h2>
            {description && (
              <p className="text-white/80 mb-4 md:mb-6 max-w-md mx-auto text-xs md:text-sm hidden md:block">{description}</p>
            )}
            <Link
              to={href}
              className="inline-flex items-center gap-2 bg-white text-foreground px-5 md:px-6 py-2 md:py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-white/90 transition-colors rounded-full md:rounded-none"
            >
              Shop Now
              <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${bgColor} mx-4 md:mx-0 rounded-2xl md:rounded-none my-4 md:my-0 overflow-hidden`}>
      <div className="container mx-auto px-4 md:px-4">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center py-6 md:py-0">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: layout === "left" ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={layout === "right" ? "md:order-2" : "md:order-1"}
          >
            <div className="aspect-[4/3] md:aspect-[4/3] overflow-hidden rounded-xl md:rounded-none">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: layout === "left" ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={`py-2 md:py-12 ${
              layout === "right" ? "md:order-1" : "md:order-2"
            }`}
          >
            {subtitle && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {subtitle}
              </p>
            )}
            <h2 className="font-display text-xl md:text-3xl font-normal mb-2 md:mb-3 text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground mb-4 md:mb-5 max-w-md text-xs md:text-sm line-clamp-2 md:line-clamp-none">{description}</p>
            )}
            <Link
              to={href}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-foreground hover:gap-3 transition-all bg-white/50 md:bg-transparent px-4 py-2 md:p-0 rounded-full md:rounded-none"
            >
              Shop Now
              <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
