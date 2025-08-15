import { z } from 'zod';

export const ProductSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1)
});

export const SearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.string(),
  brand: z.string(),
  amount: z.string()
});

export const CartItemSchema = z.object({
  id: z.string(),
  cart_item_id: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  category_name: z.string(),
  brand: z.string()
});

export const CartContentSchema = z.object({
  total_price: z.number(),
  total_items: z.number(),
  can_make_order: z.boolean(),
  products: z.array(CartItemSchema)
});

export type Product = z.infer<typeof ProductSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type CartContent = z.infer<typeof CartContentSchema>;

export interface RohlikCredentials {
  username: string;
  password: string;
}

export interface RohlikAPIResponse<T = any> {
  status: number;
  data?: T;
  messages?: Array<{ content: string }>;
}