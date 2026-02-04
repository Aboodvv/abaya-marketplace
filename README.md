# Abaya Marketplace - متجر العبايات

A modern, bilingual (Arabic/English) e-commerce platform for abayas, built with Next.js, TypeScript, and Tailwind CSS, featuring Stripe payment integration.

## ✨ Features

- 🌐 **Bilingual Support**: Full Arabic and English translations with RTL layout for Arabic
- 🛍️ **Complete E-commerce Flow**: Home, Products, Cart, and Checkout pages
- 💳 **Stripe Integration**: Secure payment processing with Stripe Checkout
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- 🛒 **Cart Management**: Add, remove, and update product quantities
- 📱 **Mobile Responsive**: Optimized for all screen sizes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Stripe account (for payment processing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Open `.env.local` file
   - Add your Stripe secret key:
     ```
     STRIPE_SECRET_KEY=sk_test_your_key_here
     ```
   - Get your key from: https://dashboard.stripe.com/test/apikeys

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to: http://localhost:3001

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Payments**: Stripe
- **Icons**: Lucide React
- **State Management**: React Context API

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/checkout/       # Stripe checkout API route
│   ├── cart/               # Shopping cart page
│   ├── login/              # Login page
│   ├── products/           # Products listing page
│   ├── success/            # Payment success page
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── Navbar.tsx          # Navigation bar
│   └── ProductCard.tsx     # Product display card
├── context/                # React Context providers
│   ├── CartContext.tsx     # Shopping cart state
│   └── LanguageContext.tsx # i18n and RTL support
├── data/                   # Mock data
│   └── products.ts         # Product catalog
└── i18n/                   # Internationalization
    └── translations.ts     # AR/EN translations
```

## 🌍 Pages

- **/** - Home page with hero section and featured products
- **/products** - Full product catalog
- **/cart** - Shopping cart with quantity controls
- **/login** - Login page (placeholder)
- **/success** - Payment confirmation page

## 💡 Usage

### Switching Languages
Click the language toggle button in the navbar (العربية/English)

### Shopping Flow
1. Browse products on home or products page
2. Click "Add to Cart" on desired items
3. Go to cart to review and adjust quantities
4. Click "Checkout with Stripe" to complete purchase
5. Enter test card details (use Stripe test cards)
6. Confirm payment and view success page

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiration date and any CVC

## 🔧 Development

### Build for production:
```bash
npm run build
```

### Run production server:
```bash
npm start
```

### Lint code:
```bash
npm run lint
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Yes |

## 🎨 Customization

- **Products**: Edit `src/data/products.ts` to modify the product catalog
- **Translations**: Update `src/i18n/translations.ts` for text changes
- **Styling**: Modify Tailwind classes or `src/app/globals.css`
- **Stripe Config**: Update `src/app/api/checkout/route.ts` for payment settings

## 📦 Dependencies

- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety
- `tailwindcss` - Styling
- `stripe` - Payment processing
- `lucide-react` - Icons

## 🔐 Security Notes

- Never commit real Stripe keys to version control
- Use test mode keys during development
- Validate all payment data server-side
- The login page is a placeholder - implement real auth before production

## 📄 License

This project is for demonstration purposes.

---

**Note**: Product images are using placeholder URLs from Unsplash. Replace with your actual product images before production deployment.
