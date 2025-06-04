
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const footEnum = pgEnum('foot', ['left', 'right']);
export const shoeSizeSystemEnum = pgEnum('shoe_size_system', ['us', 'eu', 'uk']);  
export const shoeConditionEnum = pgEnum('shoe_condition', ['new', 'like_new', 'good', 'fair', 'poor']);
export const exchangeStatusEnum = pgEnum('exchange_status', ['pending', 'accepted', 'completed', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  location: text('location'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Shoe listings table
export const shoeListingsTable = pgTable('shoe_listings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  size: numeric('size', { precision: 4, scale: 1 }).notNull(),
  size_system: shoeSizeSystemEnum('size_system').notNull(),
  foot: footEnum('foot').notNull(),
  condition: shoeConditionEnum('condition').notNull(),
  color: text('color').notNull(),
  description: text('description'),
  image_url: text('image_url'),
  is_available: boolean('is_available').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Exchange requests table
export const exchangeRequestsTable = pgTable('exchange_requests', {
  id: serial('id').primaryKey(),
  requester_listing_id: integer('requester_listing_id').notNull(),
  target_listing_id: integer('target_listing_id').notNull(),
  status: exchangeStatusEnum('status').default('pending').notNull(),
  message: text('message'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  shoeListings: many(shoeListingsTable),
}));

export const shoeListingsRelations = relations(shoeListingsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [shoeListingsTable.user_id],
    references: [usersTable.id],
  }),
  requesterExchanges: many(exchangeRequestsTable, {
    relationName: 'requesterListing',
  }),
  targetExchanges: many(exchangeRequestsTable, {
    relationName: 'targetListing',
  }),
}));

export const exchangeRequestsRelations = relations(exchangeRequestsTable, ({ one }) => ({
  requesterListing: one(shoeListingsTable, {
    fields: [exchangeRequestsTable.requester_listing_id],
    references: [shoeListingsTable.id],
    relationName: 'requesterListing',
  }),
  targetListing: one(shoeListingsTable, {
    fields: [exchangeRequestsTable.target_listing_id],
    references: [shoeListingsTable.id],
    relationName: 'targetListing',
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  shoeListings: shoeListingsTable,
  exchangeRequests: exchangeRequestsTable,
};
