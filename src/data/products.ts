import { Product } from "@/components/products/ProductCard";

// Import all product images
import gardenFlowers from "@/assets/garden-flowers.jpg";
import plantPot from "@/assets/plant-pot.jpg";
import hangingPlants from "@/assets/hanging-plants.jpg";
import ikebana from "@/assets/ikebana.jpg";
import ficusPlant from "@/assets/ficus-plant.jpg";
import womanPlant from "@/assets/woman-plant.jpg";
import bluePot from "@/assets/blue-pot.jpg";
import flowerPot from "@/assets/flower-pot.jpg";

export const plantsProducts: Product[] = [
  {
    id: "plant-1",
    name: "Fern Plant in Ceramic Pot",
    nameAr: "نبات السرخس في إناء سيراميك",
    price: 89,
    image: gardenFlowers,
    category: "Indoor Plants",
  },
  {
    id: "plant-2",
    name: "Succulent Garden Mix",
    nameAr: "مجموعة حديقة العصارة",
    price: 149,
    originalPrice: 179,
    image: plantPot,
    category: "Succulents",
    badge: "sale",
  },
  {
    id: "plant-3",
    name: "Snake Plant Sansevieria",
    nameAr: "نبات الثعبان سانسيفيريا",
    price: 199,
    image: hangingPlants,
    category: "Indoor Plants",
    badge: "new",
  },
  {
    id: "plant-4",
    name: "Monstera Deliciosa",
    nameAr: "مونستيرا ديليسيوسا",
    price: 349,
    image: ficusPlant,
    category: "Indoor Plants",
  },
];

export const potsProducts: Product[] = [
  {
    id: "pot-1",
    name: "Terracotta Classic Round",
    nameAr: "تيراكوتا كلاسيكي مستدير",
    price: 45,
    image: bluePot,
    category: "Terracotta",
  },
  {
    id: "pot-2",
    name: "White Ceramic Planter",
    nameAr: "مزهرية سيراميك بيضاء",
    price: 89,
    image: flowerPot,
    category: "Ceramic",
    badge: "new",
  },
  {
    id: "pot-3",
    name: "Modern Black Pot Set",
    nameAr: "مجموعة أواني سوداء حديثة",
    price: 129,
    originalPrice: 159,
    image: womanPlant,
    category: "Modern",
    badge: "sale",
  },
  {
    id: "pot-4",
    name: "Geometric Concrete Planter",
    nameAr: "مزهرية خرسانية هندسية",
    price: 75,
    image: ikebana,
    category: "Concrete",
  },
];

export const plantersProducts: Product[] = [
  {
    id: "planter-1",
    name: "Woven Basket Planter",
    nameAr: "مزهرية سلة منسوجة",
    price: 119,
    image: hangingPlants,
    category: "Natural",
  },
  {
    id: "planter-2",
    name: "Hanging Macrame Planter",
    nameAr: "مزهرية مكرمية معلقة",
    price: 79,
    image: gardenFlowers,
    category: "Hanging",
    badge: "new",
  },
  {
    id: "planter-3",
    name: "Wooden Plant Stand",
    nameAr: "حامل نباتات خشبي",
    price: 199,
    originalPrice: 249,
    image: ficusPlant,
    category: "Wood",
    badge: "sale",
  },
];

export const vasesProducts: Product[] = [
  {
    id: "vase-1",
    name: "Clear Glass Bubble Vase",
    nameAr: "مزهرية زجاجية فقاعية شفافة",
    price: 159,
    image: bluePot,
    category: "Glass",
  },
  {
    id: "vase-2",
    name: "Blue Textured Ceramic",
    nameAr: "سيراميك أزرق منقوش",
    price: 199,
    image: ikebana,
    category: "Ceramic",
    badge: "new",
  },
  {
    id: "vase-3",
    name: "Gold Rim Vase Set",
    nameAr: "مجموعة مزهريات بحافة ذهبية",
    price: 249,
    originalPrice: 299,
    image: flowerPot,
    category: "Decorative",
    badge: "sale",
  },
  {
    id: "vase-4",
    name: "Minimalist White Vase",
    nameAr: "مزهرية بيضاء بسيطة",
    price: 129,
    image: womanPlant,
    category: "Minimalist",
  },
];

export const homecareProducts: Product[] = [
  {
    id: "care-1",
    name: "Brass Plant Mister",
    nameAr: "بخاخ نباتات نحاسي",
    price: 69,
    image: bluePot,
    category: "Tools",
  },
  {
    id: "care-2",
    name: "Organic Plant Food",
    nameAr: "غذاء نباتي عضوي",
    price: 35,
    image: gardenFlowers,
    category: "Care",
    badge: "new",
  },
  {
    id: "care-3",
    name: "Garden Tool Set",
    nameAr: "مجموعة أدوات الحديقة",
    price: 149,
    originalPrice: 189,
    image: womanPlant,
    category: "Tools",
    badge: "sale",
  },
  {
    id: "care-4",
    name: "Copper Watering Can",
    nameAr: "إبريق سقي نحاسي",
    price: 99,
    image: ficusPlant,
    category: "Tools",
  },
];
