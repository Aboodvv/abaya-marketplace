# Abaya Marketplace - Copilot Instructions

## Project Overview
Bilingual (Arabic/English) e-commerce platform for abayas built with Next.js 16 App Router, TypeScript, Tailwind CSS, and Stripe payment integration.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Payments**: Stripe
- **State Management**: React Context API (Cart & Language)
- **Icons**: Lucide React

## Key Features
- Bilingual support (Arabic RTL / English LTR)
- Product catalog with cart management
- Stripe Checkout integration
- Responsive design for all devices

## Project Structure
```
src/
├── app/              # Pages and API routes
├── components/       # Reusable UI components
├── context/          # Global state providers
├── data/            # Mock product data
└── i18n/            # Translation strings
```

## Development Guidelines
- RTL layout required for Arabic content
- All user-facing text must have AR/EN translations
- Use Context API for cart and language state
- Tailwind for all styling
- Test Stripe with test mode keys only

## Environment Variables
- `STRIPE_SECRET_KEY`: Required for checkout functionality

## Common Tasks
- **Add products**: Edit `src/data/products.ts`
- **Update translations**: Modify `src/i18n/translations.ts`
- **Stripe config**: Check `src/app/api/checkout/route.ts`
- **Styling**: Use Tailwind classes or `src/app/globals.css`

## Running the Project
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3001)
npm run build        # Production build
```

## Security Notes
- Never commit real Stripe keys
- Login page is placeholder only
- Validate payment data server-side

