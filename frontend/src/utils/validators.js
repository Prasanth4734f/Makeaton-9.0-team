// ─── Form Validators ──────────────────────────────────────────────────────────
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include at least one special character');

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  type: z.string().default('Subscription'),
  category: z.string().min(1, 'Category is required'),
  sales_price: z.coerce.number().min(0, 'Sales price must be positive').default(0),
  cost_price: z.coerce.number().min(0, 'Cost price must be positive').default(0),
  description: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']),
});

export const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().min(1, 'Variant is required'),
  billingCycle: z.enum(['monthly', 'annual', 'quarterly', 'weekly']),
  price: z.coerce.number().positive('Price must be greater than 0'),
  setupFee: z.coerce.number().min(0).default(0),
  trialDays: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(18),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']),
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  validUntil: z.string().min(1, 'Valid until date is required'),
  notes: z.string().optional(),
});

export const subscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  startDate: z.string().min(1, 'Start date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  autoRenew: z.boolean().default(true),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.string().min(1, 'Payment method is required'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Check password strength and return a score (0–4).
 */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-green-500' },
    { label: 'Very Strong', color: 'bg-emerald-500' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}
