-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  excerpt_ar TEXT,
  content TEXT NOT NULL,
  content_ar TEXT,
  featured_image TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  author_name TEXT NOT NULL DEFAULT 'Green Grass Team',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  reading_time INTEGER NOT NULL DEFAULT 5,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Anyone can view published posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- Insert sample blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, featured_image, category, author_name, status, reading_time, published_at) VALUES
(
  '10 Best Indoor Plants for Dubai Climate',
  'best-indoor-plants-dubai',
  'Discover the perfect plants that thrive in UAE''s unique weather conditions and add greenery to your home.',
  'Indoor plants can transform your Dubai home into a lush oasis, but choosing the right ones is crucial for success in the UAE''s unique climate.

**1. Snake Plant (Sansevieria)**
The ultimate low-maintenance plant, snake plants thrive in Dubai''s air-conditioned interiors and tolerate low light conditions.

**2. Pothos**
This trailing beauty is perfect for shelves and hangers, requiring minimal water and adapting well to various light conditions.

**3. ZZ Plant**
Extremely drought-tolerant, the ZZ plant is ideal for those who travel frequently or forget to water.

**4. Peace Lily**
Adds elegance while purifying air. Keep away from direct sunlight and water when soil is dry.

**5. Rubber Plant**
A striking addition that loves bright, indirect light and occasional misting.

**6. Monstera Deliciosa**
The Instagram favorite that thrives in humid conditions - perfect for Dubai bathrooms.

**7. Spider Plant**
Easy to propagate and maintain, spider plants are great for beginners.

**8. Aloe Vera**
Practical and beautiful, aloe vera loves the warmth and requires minimal watering.

**9. Dracaena**
Various species available, all tolerant of low light and irregular watering.

**10. Ficus Benjamina**
A classic choice that adds a tree-like presence to any room.

Remember to consider your home''s specific conditions - light levels, humidity, and temperature fluctuations from AC use - when selecting your plants.',
  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
  'Plant Care',
  'Green Grass Team',
  'published',
  5,
  now()
),
(
  'How to Choose the Right Pot for Your Plant',
  'choose-right-pot-plant',
  'Learn about drainage, materials, and sizing to ensure your plants have the perfect home.',
  'Selecting the right pot is just as important as choosing the right plant. Here''s your comprehensive guide to pot selection.

**Material Matters**

*Terracotta*
- Porous, allows soil to breathe
- Great for plants that prefer dry conditions
- Can dry out quickly in Dubai''s heat

*Ceramic*
- Beautiful and decorative
- Retains moisture well
- Heavier, more stable

*Plastic*
- Lightweight and affordable
- Retains moisture
- Good for humidity-loving plants

*Fiber/Composite*
- Durable and lightweight
- Weather-resistant
- Great for outdoor use

**Size Guidelines**
- Repot to a container 1-2 inches larger than current pot
- Too large a pot can lead to overwatering issues
- Small pots may restrict growth

**Drainage is Essential**
Always choose pots with drainage holes. Standing water leads to root rot, the #1 killer of houseplants.

**Style Tips**
- Match pot style to your interior design
- Consider plant color and texture
- Group pots of varying heights for visual interest

Visit our store to explore our extensive collection of pots in various materials, sizes, and styles.',
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
  'Tips & Tricks',
  'Sarah Ahmed',
  'published',
  4,
  now() - interval '3 days'
),
(
  'Creating a Balcony Garden in Your Apartment',
  'balcony-garden-apartment',
  'Transform your small balcony into a lush green oasis with our expert tips and product recommendations.',
  'Living in a Dubai apartment doesn''t mean you can''t enjoy gardening. Here''s how to create a stunning balcony garden.

**Assess Your Space**
- Measure your balcony dimensions
- Note sun exposure (morning vs afternoon sun)
- Consider wind exposure
- Check building regulations

**Choose the Right Plants**
For sunny balconies:
- Bougainvillea
- Lantana
- Herbs (rosemary, basil, mint)
- Succulents

For shaded balconies:
- Ferns
- Peace lilies
- Pothos
- Snake plants

**Vertical Gardening**
Maximize space with:
- Wall-mounted planters
- Hanging baskets
- Trellis systems
- Tiered plant stands

**Container Selection**
- Use lightweight containers
- Ensure adequate drainage
- Consider self-watering options
- Match containers to your style

**Maintenance Tips**
- Water early morning or evening
- Use mulch to retain moisture
- Feed plants regularly
- Protect from afternoon sun in summer

Transform your balcony into your personal green retreat today!',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
  'Inspiration',
  'Mohammed Ali',
  'published',
  6,
  now() - interval '5 days'
),
(
  'Plant Care During Dubai Summer',
  'plant-care-dubai-summer',
  'Essential tips to keep your plants alive and thriving during the hot summer months.',
  'Dubai summers can be brutal for plants. Here''s how to protect your green friends during the hottest months.

**Watering Strategy**
- Water early morning (before 7 AM) or evening (after 6 PM)
- Never water in midday heat
- Increase frequency but not amount
- Check soil moisture regularly

**Shade Protection**
- Move sensitive plants away from direct afternoon sun
- Use shade cloth for outdoor plants
- Keep indoor plants away from hot windows
- Consider UV-filtering window films

**Humidity Management**
- Group plants together
- Use pebble trays with water
- Mist tropical plants regularly
- Consider a humidifier

**Soil Care**
- Add mulch to retain moisture
- Check for salt buildup from hard water
- Flush soil monthly
- Use well-draining potting mix

**Signs of Heat Stress**
- Wilting despite wet soil
- Brown leaf edges
- Leaf drop
- Faded colors

**Recovery Tips**
- Move affected plants to shade immediately
- Don''t over-water stressed plants
- Trim damaged leaves
- Be patient - recovery takes time

Your plants can survive and even thrive during Dubai summer with proper care!',
  'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800',
  'Plant Care',
  'Green Grass Team',
  'published',
  5,
  now() - interval '7 days'
),
(
  'Trending: Hanging Plants for Modern Homes',
  'trending-hanging-plants-modern-homes',
  'Explore the latest trends in hanging plants and how to incorporate them into your interior design.',
  'Hanging plants are having a major moment in interior design. Here''s everything you need to know about this trending style.

**Why Hanging Plants?**
- Save floor space
- Add visual interest at eye level
- Create natural room dividers
- Perfect for small apartments

**Best Plants for Hanging**
*Trailing Plants*
- String of Pearls
- Pothos varieties
- Philodendron Brasil
- String of Hearts

*Cascading Beauties*
- Boston Fern
- Spider Plant
- English Ivy
- Lipstick Plant

**Placement Ideas**
- Corners near windows
- Above kitchen sinks
- Bathroom windows
- Bedroom corners
- Living room focal points

**Hanger Styles**
- Macramé hangers (boho style)
- Minimalist metal hooks
- Ceiling-mounted systems
- Wall-mounted brackets
- Geometric holders

**Care Tips**
- Use lightweight pots
- Choose pots with attached saucers
- Water carefully to avoid drips
- Rotate for even growth
- Consider water indicators

Elevate your space literally with beautiful hanging plants!',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=800',
  'Inspiration',
  'Sarah Ahmed',
  'published',
  4,
  now() - interval '10 days'
),
(
  'Gift Ideas: Plants for Every Occasion',
  'gift-ideas-plants-every-occasion',
  'From housewarmings to birthdays, discover the perfect plant gift for any celebration.',
  'Plants make wonderful gifts that keep giving. Here''s your guide to choosing the perfect plant for every occasion.

**Housewarming**
- Snake Plant (for luck and protection)
- Money Tree (prosperity)
- Peace Lily (elegance)
- Potted herbs (practical and fragrant)

**Birthday**
- Flowering plants matching their birth month
- Orchids (luxury)
- Colorful planters with succulents
- Air plants (unique and low-maintenance)

**Wedding/Anniversary**
- Romantic roses in pots
- Heart-shaped Hoya
- Matching pair of plants
- Elegant orchid arrangement

**Get Well Soon**
- Lavender (calming)
- Aloe Vera (healing)
- Peace Lily (air purifying)
- Low-maintenance succulents

**Thank You**
- Flowering kalanchoe
- Beautiful planter with herbs
- Decorative terrarium
- Gift card for plant shopping

Make your gift memorable and lasting with plants from Green Grass!',
  'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800',
  'Gift Guide',
  'Mohammed Ali',
  'published',
  5,
  now() - interval '12 days'
);