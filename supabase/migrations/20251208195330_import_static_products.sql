/*
  # Import Static Products from products.ts
  
  1. Purpose
    - Import 19 static products from products.ts into the database
    - Populate products table with initial product catalog
    - Set up proper categories and product attributes
  
  2. Products Imported
    - Plants (4 products): Indoor plants, succulents
    - Pots (4 products): Terracotta, ceramic, modern, concrete
    - Planters (3 products): Natural, hanging, wood
    - Vases (4 products): Glass, ceramic, decorative, minimalist
    - Home Care (4 products): Tools and plant care items
  
  3. Product Fields
    - name/name_ar: English and Arabic product names
    - slug: URL-friendly identifier
    - price: Current price in AED
    - compare_at_price: Original price (for sale items)
    - category/subcategory: Product categorization
    - featured_image: Main product image
    - is_on_sale: Products with original price > current price
    - is_new: Products with "new" badge
    - stock_quantity: Set to 100 for all products
    - is_active: All set to true
  
  4. Notes
    - Image paths are converted from asset imports to relative paths
    - Stock quantity set to 100 to make products available for purchase
    - All products are active and ready for sale
*/

-- Import Plants Category Products
INSERT INTO products (
  name, name_ar, slug, description, price, compare_at_price, 
  category, subcategory, featured_image, is_featured, is_on_sale, 
  is_new, stock_quantity, is_active, currency
) VALUES
  (
    'Fern Plant in Ceramic Pot',
    'نبات السرخس في إناء سيراميك',
    'fern-plant-ceramic-pot',
    'Beautiful fern plant in elegant ceramic pot, perfect for indoor spaces',
    89,
    NULL,
    'Plants',
    'Indoor Plants',
    '/src/assets/garden-flowers.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Succulent Garden Mix',
    'مجموعة حديقة العصارة',
    'succulent-garden-mix',
    'Assorted succulent collection in a decorative arrangement',
    149,
    179,
    'Plants',
    'Succulents',
    '/src/assets/plant-pot.jpg',
    false,
    true,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Snake Plant Sansevieria',
    'نبات الثعبان سانسيفيريا',
    'snake-plant-sansevieria',
    'Low-maintenance snake plant, excellent air purifier',
    199,
    NULL,
    'Plants',
    'Indoor Plants',
    '/src/assets/hanging-plants.jpg',
    false,
    false,
    true,
    100,
    true,
    'AED'
  ),
  (
    'Monstera Deliciosa',
    'مونستيرا ديليسيوسا',
    'monstera-deliciosa',
    'Iconic tropical plant with stunning split leaves',
    349,
    NULL,
    'Plants',
    'Indoor Plants',
    '/src/assets/ficus-plant.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  );

-- Import Pots Category Products
INSERT INTO products (
  name, name_ar, slug, description, price, compare_at_price, 
  category, subcategory, featured_image, is_featured, is_on_sale, 
  is_new, stock_quantity, is_active, currency
) VALUES
  (
    'Terracotta Classic Round',
    'تيراكوتا كلاسيكي مستدير',
    'terracotta-classic-round',
    'Classic terracotta pot with natural finish',
    45,
    NULL,
    'Pots',
    'Terracotta',
    '/src/assets/blue-pot.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  ),
  (
    'White Ceramic Planter',
    'مزهرية سيراميك بيضاء',
    'white-ceramic-planter',
    'Elegant white ceramic planter with modern design',
    89,
    NULL,
    'Pots',
    'Ceramic',
    '/src/assets/flower-pot.jpg',
    false,
    false,
    true,
    100,
    true,
    'AED'
  ),
  (
    'Modern Black Pot Set',
    'مجموعة أواني سوداء حديثة',
    'modern-black-pot-set',
    'Set of modern black pots in various sizes',
    129,
    159,
    'Pots',
    'Modern',
    '/src/assets/woman-plant.jpg',
    false,
    true,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Geometric Concrete Planter',
    'مزهرية خرسانية هندسية',
    'geometric-concrete-planter',
    'Contemporary geometric concrete planter',
    75,
    NULL,
    'Pots',
    'Concrete',
    '/src/assets/ikebana.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  );

-- Import Planters Category Products
INSERT INTO products (
  name, name_ar, slug, description, price, compare_at_price, 
  category, subcategory, featured_image, is_featured, is_on_sale, 
  is_new, stock_quantity, is_active, currency
) VALUES
  (
    'Woven Basket Planter',
    'مزهرية سلة منسوجة',
    'woven-basket-planter',
    'Handcrafted woven basket planter with natural materials',
    119,
    NULL,
    'Planters',
    'Natural',
    '/src/assets/hanging-plants.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Hanging Macrame Planter',
    'مزهرية مكرمية معلقة',
    'hanging-macrame-planter',
    'Beautiful macrame hanging planter, perfect for small spaces',
    79,
    NULL,
    'Planters',
    'Hanging',
    '/src/assets/garden-flowers.jpg',
    false,
    false,
    true,
    100,
    true,
    'AED'
  ),
  (
    'Wooden Plant Stand',
    'حامل نباتات خشبي',
    'wooden-plant-stand',
    'Sturdy wooden stand for displaying multiple plants',
    199,
    249,
    'Planters',
    'Wood',
    '/src/assets/ficus-plant.jpg',
    false,
    true,
    false,
    100,
    true,
    'AED'
  );

-- Import Vases Category Products
INSERT INTO products (
  name, name_ar, slug, description, price, compare_at_price, 
  category, subcategory, featured_image, is_featured, is_on_sale, 
  is_new, stock_quantity, is_active, currency
) VALUES
  (
    'Clear Glass Bubble Vase',
    'مزهرية زجاجية فقاعية شفافة',
    'clear-glass-bubble-vase',
    'Unique bubble design glass vase for fresh flowers',
    159,
    NULL,
    'Vases',
    'Glass',
    '/src/assets/blue-pot.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Blue Textured Ceramic',
    'سيراميك أزرق منقوش',
    'blue-textured-ceramic',
    'Textured ceramic vase in elegant blue finish',
    199,
    NULL,
    'Vases',
    'Ceramic',
    '/src/assets/ikebana.jpg',
    false,
    false,
    true,
    100,
    true,
    'AED'
  ),
  (
    'Gold Rim Vase Set',
    'مجموعة مزهريات بحافة ذهبية',
    'gold-rim-vase-set',
    'Luxurious vase set with gold rim details',
    249,
    299,
    'Vases',
    'Decorative',
    '/src/assets/flower-pot.jpg',
    false,
    true,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Minimalist White Vase',
    'مزهرية بيضاء بسيطة',
    'minimalist-white-vase',
    'Simple yet elegant white minimalist vase',
    129,
    NULL,
    'Vases',
    'Minimalist',
    '/src/assets/woman-plant.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  );

-- Import Home Care Category Products
INSERT INTO products (
  name, name_ar, slug, description, price, compare_at_price, 
  category, subcategory, featured_image, is_featured, is_on_sale, 
  is_new, stock_quantity, is_active, currency
) VALUES
  (
    'Brass Plant Mister',
    'بخاخ نباتات نحاسي',
    'brass-plant-mister',
    'Premium brass plant mister for daily plant care',
    69,
    NULL,
    'Home Care',
    'Tools',
    '/src/assets/blue-pot.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Organic Plant Food',
    'غذاء نباتي عضوي',
    'organic-plant-food',
    'Natural organic fertilizer for healthy plant growth',
    35,
    NULL,
    'Home Care',
    'Care',
    '/src/assets/garden-flowers.jpg',
    false,
    false,
    true,
    100,
    true,
    'AED'
  ),
  (
    'Garden Tool Set',
    'مجموعة أدوات الحديقة',
    'garden-tool-set',
    'Complete set of essential gardening tools',
    149,
    189,
    'Home Care',
    'Tools',
    '/src/assets/woman-plant.jpg',
    false,
    true,
    false,
    100,
    true,
    'AED'
  ),
  (
    'Copper Watering Can',
    'إبريق سقي نحاسي',
    'copper-watering-can',
    'Elegant copper watering can with ergonomic design',
    99,
    NULL,
    'Home Care',
    'Tools',
    '/src/assets/ficus-plant.jpg',
    false,
    false,
    false,
    100,
    true,
    'AED'
  );