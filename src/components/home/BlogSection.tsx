import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ficusPlant from "@/assets/ficus-plant.jpg";
import gardenFlowers from "@/assets/garden-flowers.jpg";
import plantPot from "@/assets/plant-pot.jpg";

// Fallback images for posts without featured images
const fallbackImages = [ficusPlant, gardenFlowers, plantPot];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  author_name: string;
  published_at: string | null;
  category: string;
  reading_time: number;
  slug: string;
}

export const BlogSection = () => {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("id, title, excerpt, featured_image, author_name, published_at, category, reading_time, slug")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(language === "ar" ? "ar-AE" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Don't render section if no posts and not loading
  if (!loading && posts.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  const featuredPost = posts[0];
  const secondaryPosts = posts.slice(1);

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-14"
        >
          <div>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4"
            >
              {t("blog.subtitle")}
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground">
              {t("blog.title")}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              Expert tips, inspiration, and guides for your plant journey
            </p>
          </div>
          <Link 
            to="/blog" 
            className="group hidden md:inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-all"
          >
            {t("blog.viewAll")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Featured Post - Large Card */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.article
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:row-span-2"
          >
            <Link to={`/blog/${featuredPost.slug}`} className="group block h-full">
              <div className="relative h-full min-h-[400px] lg:min-h-full rounded-3xl overflow-hidden">
                <img 
                  src={featuredPost.featured_image || fallbackImages[0]} 
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-4">
                    {featuredPost.category}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-primary-foreground/90 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-white/80 text-sm md:text-base mb-4 line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredPost.published_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {featuredPost.reading_time} min read
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>

          {/* Secondary Posts */}
          {secondaryPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="flex gap-5 p-4 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-xl overflow-hidden">
                    <img 
                      src={post.featured_image || fallbackImages[index + 1] || fallbackImages[0]} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.published_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.reading_time} min
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-base md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
                      {post.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-primary font-medium text-sm mt-3 group-hover:gap-2 transition-all">
                      {t("blog.readMore")}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Mobile View All Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center md:hidden"
        >
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors"
          >
            {t("blog.viewAll")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
