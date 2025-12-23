import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard, Product } from "./ProductCard";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  columns?: 3 | 4;
}

export const ProductSection = ({
  title,
  subtitle,
  products,
  viewAllLink,
  columns = 4,
}: ProductSectionProps) => {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-gray-900 hover:text-[#2d5a3d] transition-colors"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </motion.div>

        {/* Products Grid */}
        <div
          className={`grid grid-cols-2 gap-4 md:gap-6 ${
            columns === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
          }`}
        >
          {products.slice(0, columns).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {/* Mobile View All */}
        {viewAllLink && (
          <div className="mt-6 text-center md:hidden">
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-gray-900 hover:text-[#2d5a3d] transition-colors"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
