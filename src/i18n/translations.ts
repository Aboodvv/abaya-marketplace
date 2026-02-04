export const translations = {
  en: {
    nav: {
      home: "Home",
      products: "Products",
      cart: "Cart",
      login: "Login",
    },
    home: {
      hero: {
        title: "Discover Elegant Abayas",
        subtitle: "Premium collection of traditional and modern abayas",
        cta: "Shop Now",
      },
      featured: "Featured Products",
    },
    products: {
      title: "All Products",
      addToCart: "Add to Cart",
      price: "Price",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
    },
    cart: {
      title: "Shopping Cart",
      empty: "Your cart is empty",
      total: "Total",
      checkout: "Checkout with Stripe",
      continueShopping: "Continue Shopping",
      remove: "Remove",
      quantity: "Quantity",
    },
    login: {
      title: "Login",
      email: "Email",
      password: "Password",
      submit: "Sign In",
      subtitle: "Enter your credentials to continue",
    },
    common: {
      loading: "Loading...",
      error: "Error",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      products: "المنتجات",
      cart: "السلة",
      login: "تسجيل الدخول",
    },
    home: {
      hero: {
        title: "اكتشفي العبايات الأنيقة",
        subtitle: "مجموعة فاخرة من العبايات التقليدية والعصرية",
        cta: "تسوقي الآن",
      },
      featured: "المنتجات المميزة",
    },
    products: {
      title: "جميع المنتجات",
      addToCart: "أضف للسلة",
      price: "السعر",
      inStock: "متوفر",
      outOfStock: "غير متوفر",
    },
    cart: {
      title: "سلة التسوق",
      empty: "سلتك فارغة",
      total: "المجموع",
      checkout: "الدفع عبر Stripe",
      continueShopping: "متابعة التسوق",
      remove: "إزالة",
      quantity: "الكمية",
    },
    login: {
      title: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "دخول",
      subtitle: "أدخل بياناتك للمتابعة",
    },
    common: {
      loading: "جاري التحميل...",
      error: "خطأ",
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = typeof translations.en;
