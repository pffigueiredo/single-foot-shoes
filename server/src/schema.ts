
import { z } from 'zod';

// Enums
export const footEnum = z.enum(['left', 'right']);
export const shoeSizeSystemEnum = z.enum(['us', 'eu', 'uk']);
export const shoeConditionEnum = z.enum(['new', 'like_new', 'good', 'fair', 'poor']);
export const exchangeStatusEnum = z.enum(['pending', 'accepted', 'completed', 'cancelled']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  location: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Shoe listing schema
export const shoeListingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  brand: z.string(),
  model: z.string(),
  size: z.number(),
  size_system: shoeSizeSystemEnum,
  foot: footEnum,
  condition: shoeConditionEnum,
  color: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  is_available: z.boolean(),
  created_at: z.coerce.date()
});

export type ShoeListing = z.infer<typeof shoeListingSchema>;

// Exchange request schema
export const exchangeRequestSchema = z.object({
  id: z.number(),
  requester_listing_id: z.number(),
  target_listing_id: z.number(),
  status: exchangeStatusEnum,
  message: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ExchangeRequest = z.infer<typeof exchangeRequestSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  location: z.string().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createShoeListingInputSchema = z.object({
  user_id: z.number(),
  brand: z.string().min(1),
  model: z.string().min(1),
  size: z.number().positive(),
  size_system: shoeSizeSystemEnum,
  foot: footEnum,
  condition: shoeConditionEnum,
  color: z.string().min(1),
  description: z.string().nullable(),
  image_url: z.string().url().nullable()
});

export type CreateShoeListingInput = z.infer<typeof createShoeListingInputSchema>;

export const createExchangeRequestInputSchema = z.object({
  requester_listing_id: z.number(),
  target_listing_id: z.number(),
  message: z.string().nullable()
});

export type CreateExchangeRequestInput = z.infer<typeof createExchangeRequestInputSchema>;

export const updateExchangeStatusInputSchema = z.object({
  id: z.number(),
  status: exchangeStatusEnum
});

export type UpdateExchangeStatusInput = z.infer<typeof updateExchangeStatusInputSchema>;

export const searchShoesInputSchema = z.object({
  brand: z.string().optional(),
  size: z.number().optional(),
  size_system: shoeSizeSystemEnum.optional(),
  foot: footEnum.optional(),
  condition: shoeConditionEnum.optional(),
  color: z.string().optional(),
  user_id: z.number().optional()
});

export type SearchShoesInput = z.infer<typeof searchShoesInputSchema>;
