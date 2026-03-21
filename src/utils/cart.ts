import { atom, map } from 'nanostores';

export interface CartItem {
  id: string;
  categorySlug: string;
  flavourSlug: string;
  name: string;
  categoryName: string;
  price: number;
  image: string;
  quantity: number;
}

export const cartItems = map<Record<string, CartItem>>({});
export const cartOpen = atom(false);

function loadCart(): Record<string, CartItem> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('iget-cart');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCart(items: Record<string, CartItem>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('iget-cart', JSON.stringify(items));
}

export function initCart() {
  const stored = loadCart();
  cartItems.set(stored);
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  const current = cartItems.get();
  const existing = current[item.id];
  const updated = {
    ...current,
    [item.id]: {
      ...item,
      quantity: (existing?.quantity ?? 0) + quantity,
    },
  };
  cartItems.set(updated);
  saveCart(updated);
  cartOpen.set(true);
}

export function updateQuantity(id: string, quantity: number) {
  const current = { ...cartItems.get() };
  if (quantity <= 0) {
    delete current[id];
  } else if (current[id]) {
    current[id] = { ...current[id], quantity };
  }
  cartItems.set(current);
  saveCart(current);
}

export function removeFromCart(id: string) {
  updateQuantity(id, 0);
}

export function clearCart() {
  cartItems.set({});
  saveCart({});
}

export function getCartTotal(): number {
  const items = cartItems.get();
  return (Object.values(items) as CartItem[]).reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0,
  );
}

export function getCartCount(): number {
  const items = cartItems.get();
  return (Object.values(items) as CartItem[]).reduce(
    (sum: number, item: CartItem) => sum + item.quantity,
    0,
  );
}

export const MINIMUM_ORDER = 300;
export const SHIPPING_COST = 30;
