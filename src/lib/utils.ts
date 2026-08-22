import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PaymentMethod } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductCategories(product: { name?: string; specifications?: string | null; category?: string | null }): string[] {
  const result: string[] = [];

  if (product.category && product.category.trim()) {
    try {
      if (product.category.startsWith('[') && product.category.endsWith(']')) {
        const parsed = JSON.parse(product.category);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (typeof c === 'string' && c.trim()) result.push(c.trim());
          });
        }
      }
    } catch {
      // not json format
    }
    if (result.length === 0) {
      product.category.split(',').forEach((c) => {
        if (c.trim()) result.push(c.trim());
      });
    }
  }

  if (result.length === 0 && product.specifications) {
    const match = product.specifications.match(/(?:Categories|Category|Cat):\s*([^\r\n]+)/i);
    if (match && match[1]) {
      match[1].split(',').forEach((c) => {
        if (c.trim()) result.push(c.trim());
      });
    }
  }

  if (result.length === 0) {
    const text = `${product.name || ''} ${product.specifications || ''}`.toLowerCase();
    if (text.includes('melamine') || text.includes('dinner') || text.includes('platter') || text.includes('crockery') || text.includes('cup') || text.includes('bowl')) {
      result.push('Dinnerware & Crockery');
    }
    if (text.includes('smart') || text.includes('phone') || text.includes('mobile') || text.includes('tv') || text.includes('audio') || text.includes('earbuds') || text.includes('bluetooth')) {
      result.push('Electronics');
    }
    if (text.includes('gift')) {
      result.push('Gift Sets');
    }
  }

  if (result.length === 0) {
    result.push('General');
  }

  return Array.from(new Set(result));
}

export function getProductCategory(product: { name?: string; specifications?: string | null; category?: string | null }): string {
  const cats = getProductCategories(product);
  return cats[0] || 'General';
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'COD',
    name: 'Cash on Delivery (COD)',
    description: 'Pay with cash upon order arrival at your doorstep',
    enabled: true,
    type: 'COD',
    instructions: 'Please keep exact cash ready upon delivery.',
  },
  {
    id: 'UPI',
    name: 'UPI / QR Code',
    description: 'Instant scan & pay via GPay, PhonePe, Paytm, or BHIM',
    enabled: true,
    type: 'UPI',
    instructions: 'Scan the dynamic QR code during checkout or pay via UPI VPA.',
  },
];

export function getStorePaymentMethods(): PaymentMethod[] {
  try {
    const saved = localStorage.getItem('jkmart_payment_methods');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading payment methods from localStorage:', e);
  }
  return DEFAULT_PAYMENT_METHODS;
}

export function saveStorePaymentMethods(methods: PaymentMethod[]): void {
  try {
    localStorage.setItem('jkmart_payment_methods', JSON.stringify(methods));
  } catch (e) {
    console.error('Error saving payment methods to localStorage:', e);
  }
}

export function getStoredStoreName(): string {
  try {
    const saved = localStorage.getItem('jkmart_store_name');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'JKmart 99';
}

export function saveStoredStoreName(name: string): void {
  try {
    if (name && name.trim()) {
      localStorage.setItem('jkmart_store_name', name.trim());
    }
  } catch {}
}
