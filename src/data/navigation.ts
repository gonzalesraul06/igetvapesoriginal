export const productCategories = [
  { name: 'JNR CRUISER 12000 PUFFS', href: '/products/jnr-cruiser', slug: 'jnr-cruiser' },
  { name: 'ONE 12000 PUFFS', href: '/products/iget-one', slug: 'iget-one' },
  { name: 'BAR PRO 10000 PUFFS', href: '/products/iget-bar-pro', slug: 'iget-bar-pro' },
  { name: 'IGET S3 10000 PUFFS', href: '/products/iget-bar-plus-s3', slug: 'iget-bar-plus-s3' },
  { name: 'S3 POD 10000 PUFFS', href: '/products/iget-bar-plus-s3-pod', slug: 'iget-bar-plus-s3-pod' },
  { name: 'ALI INGOT 9000 PUFFS', href: '/products/alibarbar-ingot', slug: 'alibarbar-ingot' },
  { name: 'ALI ICE ADJUST 12000 PUFFS', href: '/products/alibarbar-ice-adjust', slug: 'alibarbar-ice-adjust' },
  { name: 'MIX & MATCH SAVE', href: '/mix-and-match', slug: 'mix-and-match' },
] as const;

export const topMenuLinks = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Shipping', href: '/shipping-policy' },
  { name: 'Mix & Match', href: '/mix-and-match' },
] as const;

export const footerSupport = [
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Shipping Policy', href: '/shipping-policy' },
  { name: 'Payment Methods', href: '/payment-methods' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms & Conditions', href: '/terms-and-conditions' },
  { name: 'Delivery Locations', href: '/delivery' },
  { name: 'Sitemap', href: '/sitemap' },
] as const;

export const footerService = [
  { name: 'Checkout', href: '/checkout' },
  { name: 'Cart', href: '/checkout' },
  { name: 'Account', href: '/account' },
  { name: 'Orders', href: '/account/orders' },
  { name: 'Lost Password', href: '/account/lost-password' },
  { name: 'Sign Up', href: '/account/signup' },
] as const;

export const siteConfig = {
  name: 'IGET Vapes Original',
  tagline: "Australia's #1 Trusted Online IGET Vape Store",
  description: 'Shop the best selection of IGET Vapes in Australia. Premium disposable vapes including IGET Bar Pro, IGET One, JNR Cruiser and more. Fast Australia-wide delivery.',
  url: 'https://igetvapesoriginal.com',
  email: 'info@igetvapeshub.com',
  locale: 'en-AU',
  currency: 'AUD',
  minimumOrder: 250,
} as const;
