import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock, Share2, Facebook, Twitter, Bookmark, ChevronRight, Loader2, Eye } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  excerpt: string;
  excerpt_ar: string | null;
  content: string;
  content_ar: string | null;
  featured_image: string | null;
  category: string;
  author_name: string;
  reading_time: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export default function BlogDetail() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      setLoading(true);
      
      // Fetch the post
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setPost(data);

      // Increment view count
      if (data) {
        await supabase
          .from('blog_posts')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);

        // Fetch related posts
        const { data: related } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3);

        setRelatedPosts(related || []);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/blog?category=${encodeURIComponent(category)}`);
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast.success(isArabic ? "تم نسخ الرابط" : "Link copied to clipboard");
        } catch {
          toast.error(isArabic ? "فشل نسخ الرابط" : "Failed to copy link");
        }
        return;
      default:
        return;
    }
    
    // Open share URL in new window
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d5a3d]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-4"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2d5a3d]/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-[#2d5a3d]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              {isArabic ? "المقال غير موجود" : "Post Not Found"}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              {isArabic ? "المقال الذي تبحث عنه غير موجود" : "The article you're looking for doesn't exist."}
            </p>
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2d5a3d] text-white rounded-full hover:bg-[#234830] transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              {isArabic ? "العودة للمدونة" : "Back to Blog"}
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isArabic && post.title_ar ? post.title_ar : post.title;
  const content = isArabic && post.content_ar ? post.content_ar : post.content;

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isArabic ? "rtl" : "ltr"}>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh]">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src={post.featured_image || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1200'} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 lg:p-16">
            <div className="container mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={() => handleCategoryClick(post.category)}
                  className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-[#2d5a3d] text-white text-xs sm:text-sm font-medium rounded-full mb-2 sm:mb-4 hover:bg-[#234830] transition-colors"
                >
                  {post.category}
                </button>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif font-bold text-white mb-2 sm:mb-4 leading-tight">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm text-white/80">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="hidden sm:inline">{post.author_name}</span>
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    {formatDate(post.published_at)}
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {post.reading_time} {isArabic ? "د" : "min"}
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    {post.view_count}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <motion.nav 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 md:mb-8 overflow-x-auto"
            >
              <Link to="/" className="hover:text-[#2d5a3d] transition-colors whitespace-nowrap">
                {isArabic ? "الرئيسية" : "Home"}
              </Link>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <Link to="/blog" className="hover:text-[#2d5a3d] transition-colors whitespace-nowrap">
                {isArabic ? "المدونة" : "Blog"}
              </Link>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">{title}</span>
            </motion.nav>

            <div className="grid lg:grid-cols-[1fr_240px] xl:grid-cols-[1fr_280px] gap-6 sm:gap-8 lg:gap-10">
              {/* Main Content */}
              <motion.article 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Content */}
                <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed">
                  {content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <motion.h2 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 mb-3 sm:mb-4 md:mb-5 pb-2 sm:pb-3 border-b border-gray-200"
                        >
                          {paragraph.replace(/\*\*/g, '')}
                        </motion.h2>
                      );
                    }
                    if (paragraph.startsWith('*') && !paragraph.startsWith('**')) {
                      return (
                        <blockquote key={index} className="border-l-4 border-[#2d5a3d] pl-4 sm:pl-6 my-4 sm:my-6 md:my-8 italic text-sm sm:text-base md:text-lg text-gray-600 bg-[#2d5a3d]/5 py-3 sm:py-4 pr-4 sm:pr-6 rounded-r-lg sm:rounded-r-xl">
                          {paragraph.replace(/\*/g, '')}
                        </blockquote>
                      );
                    }
                    if (paragraph.startsWith('-')) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={index} className="my-4 sm:my-6 space-y-2 sm:space-y-3">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#2d5a3d] rounded-full mt-2 flex-shrink-0" />
                              <span>{item.replace(/^-\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <motion.p 
                        key={index}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-gray-600 mb-4 sm:mb-5 leading-relaxed text-sm sm:text-base md:text-lg"
                      >
                        {paragraph}
                      </motion.p>
                    );
                  })}
                </div>

                {/* Share Section */}
                <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {isArabic ? "شارك هذا المقال" : "Share this article"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleShare('facebook')}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={() => handleShare('twitter')}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1da1f2] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={() => handleShare('whatsapp')}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#25d366] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleShare('copy')}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>

              {/* Sidebar */}
              <aside className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Author Card */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-[#2d5a3d]/10 to-[#2d5a3d]/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-[#2d5a3d]/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#2d5a3d]" />
                  </div>
                  <h4 className="text-center font-semibold text-gray-900 text-sm sm:text-base mb-1">{post.author_name}</h4>
                  <p className="text-center text-xs sm:text-sm text-gray-500">
                    {isArabic ? "خبير النباتات" : "Plant Expert"}
                  </p>
                </motion.div>

                {/* Categories */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-5 lg:p-6"
                >
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">
                    {isArabic ? "التصنيفات" : "Categories"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {["Plant Care", "Tips & Tricks", "Inspiration", "Gift Guide"].map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-xs sm:text-sm text-gray-600 rounded-full hover:bg-[#2d5a3d] hover:text-white transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </aside>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-10 sm:mt-12 md:mt-16 pt-8 sm:pt-10 md:pt-12 border-t border-gray-200"
              >
                <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">
                  {isArabic ? "قد يعجبك أيضاً" : "You might also like"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {relatedPosts.map((related, index) => (
                    <motion.div
                      key={related.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/blog/${related.slug}`}
                        className="group block bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={related.featured_image || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 py-0.5 sm:py-1 bg-[#2d5a3d] text-white text-[10px] sm:text-xs font-medium rounded-full">
                            {related.category}
                          </span>
                        </div>
                        <div className="p-3 sm:p-4">
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#2d5a3d] transition-colors line-clamp-2 text-sm sm:text-base">
                            {isArabic && related.title_ar ? related.title_ar : related.title}
                          </h4>
                          <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[10px] sm:text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(related.published_at)}
                            </span>
                            <span>{related.reading_time} {isArabic ? "د" : "min"}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}