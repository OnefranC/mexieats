# Mexieats - Premium Mexican Food Delivery

A premium, responsive, conversion-focused dark-themed website for a Mexican food ordering and delivery business.

## Live Demo
Open `index.html` in your browser to view the site.

## Pages
- **index.html** - Landing page with hero, how it works, why mexieats, testimonials, CTA
- **menu.html** - Full menu with 6 tabbed categories (Meals, Drinks, Sides, Burgers, Cakes, Fruits)
- **checkout.html** - Complete checkout with delivery info, time slots, and 3 payment methods (Card, Digital Wallet, Cash)
- **confirmation.html** - Order confirmation with real-time tracking simulation

## Features
- Dark theme with #660066 (Deep Purple) and #067D6B (Teal) brand colors
- Fully responsive (mobile, tablet, desktop)
- SF Pro Rounded typography
- Animated hero section with floating cards
- Scroll-reveal animations
- Persistent cart (localStorage)
- Cart sidebar with quantity controls
- Promo code system (MEXI20, WELCOME10, FREEDELIVERY)
- 3 payment methods: Card, Apple Pay/Google Pay, Cash with change calculator
- Delivery vs Pickup options
- Time slot selection
- Order tracking simulation
- 10 items per category (60 total menu items)
- Edge case handling: empty cart, form validation, disabled buttons, unavailable time slots

## Tech Stack
- HTML5
- CSS3 (Custom Properties, Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- No dependencies

## Setup
1. Clone the repository
2. Open `index.html` in a browser
3. No build step required

## Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create mexieats --public --source=. --remote=origin --push
```
