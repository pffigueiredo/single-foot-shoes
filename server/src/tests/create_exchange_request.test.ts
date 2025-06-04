
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoeListingsTable, exchangeRequestsTable } from '../db/schema';
import { type CreateExchangeRequestInput } from '../schema';
import { createExchangeRequest } from '../handlers/create_exchange_request';
import { eq } from 'drizzle-orm';

// Test users
const testUser1 = {
  email: 'user1@example.com',
  name: 'User One',
  location: 'New York'
};

const testUser2 = {
  email: 'user2@example.com',
  name: 'User Two', 
  location: 'Los Angeles'
};

// Test shoe listings
const testListing1 = {
  brand: 'Nike',
  model: 'Air Max',
  size: '10.5',
  size_system: 'us' as const,
  foot: 'left' as const,
  condition: 'good' as const,
  color: 'Black',
  description: 'Left shoe only',
  image_url: null
};

const testListing2 = {
  brand: 'Nike',
  model: 'Air Max',
  size: '10.5',
  size_system: 'us' as const,
  foot: 'right' as const,
  condition: 'good' as const,
  color: 'Black',
  description: 'Right shoe only',
  image_url: null
};

describe('createExchangeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an exchange request', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test shoe listings
    const listings = await db.insert(shoeListingsTable)
      .values([
        { ...testListing1, user_id: users[0].id },
        { ...testListing2, user_id: users[1].id }
      ])
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listings[0].id,
      target_listing_id: listings[1].id,
      message: 'Would love to exchange!'
    };

    const result = await createExchangeRequest(testInput);

    // Basic field validation
    expect(result.requester_listing_id).toEqual(listings[0].id);
    expect(result.target_listing_id).toEqual(listings[1].id);
    expect(result.message).toEqual('Would love to exchange!');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save exchange request to database', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test shoe listings
    const listings = await db.insert(shoeListingsTable)
      .values([
        { ...testListing1, user_id: users[0].id },
        { ...testListing2, user_id: users[1].id }
      ])
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listings[0].id,
      target_listing_id: listings[1].id,
      message: 'Perfect match!'
    };

    const result = await createExchangeRequest(testInput);

    // Query database to verify
    const exchangeRequests = await db.select()
      .from(exchangeRequestsTable)
      .where(eq(exchangeRequestsTable.id, result.id))
      .execute();

    expect(exchangeRequests).toHaveLength(1);
    expect(exchangeRequests[0].requester_listing_id).toEqual(listings[0].id);
    expect(exchangeRequests[0].target_listing_id).toEqual(listings[1].id);
    expect(exchangeRequests[0].message).toEqual('Perfect match!');
    expect(exchangeRequests[0].status).toEqual('pending');
    expect(exchangeRequests[0].created_at).toBeInstanceOf(Date);
  });

  it('should create exchange request with null message', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test shoe listings
    const listings = await db.insert(shoeListingsTable)
      .values([
        { ...testListing1, user_id: users[0].id },
        { ...testListing2, user_id: users[1].id }
      ])
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listings[0].id,
      target_listing_id: listings[1].id,
      message: null
    };

    const result = await createExchangeRequest(testInput);

    expect(result.message).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should throw error when requester listing does not exist', async () => {
    // Create test user and listing
    const user = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    const listing = await db.insert(shoeListingsTable)
      .values({ ...testListing1, user_id: user[0].id })
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: 99999, // Non-existent ID
      target_listing_id: listing[0].id,
      message: 'This should fail'
    };

    await expect(createExchangeRequest(testInput)).rejects.toThrow(/requester listing not found/i);
  });

  it('should throw error when target listing does not exist', async () => {
    // Create test user and listing
    const user = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    const listing = await db.insert(shoeListingsTable)
      .values({ ...testListing1, user_id: user[0].id })
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listing[0].id,
      target_listing_id: 99999, // Non-existent ID
      message: 'This should fail'
    };

    await expect(createExchangeRequest(testInput)).rejects.toThrow(/target listing not found/i);
  });

  it('should throw error when requester listing is not available', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test shoe listings - requester listing is not available
    const listings = await db.insert(shoeListingsTable)
      .values([
        { ...testListing1, user_id: users[0].id, is_available: false },
        { ...testListing2, user_id: users[1].id }
      ])
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listings[0].id,
      target_listing_id: listings[1].id,
      message: 'This should fail'
    };

    await expect(createExchangeRequest(testInput)).rejects.toThrow(/requester listing is not available/i);
  });

  it('should throw error when target listing is not available', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test shoe listings - target listing is not available
    const listings = await db.insert(shoeListingsTable)
      .values([
        { ...testListing1, user_id: users[0].id },
        { ...testListing2, user_id: users[1].id, is_available: false }
      ])
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listings[0].id,
      target_listing_id: listings[1].id,
      message: 'This should fail'
    };

    await expect(createExchangeRequest(testInput)).rejects.toThrow(/target listing is not available/i);
  });

  it('should throw error when user tries to exchange with their own listing', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    // Create two listings for same user
    const listings = await db.insert(shoeListingsTable)
      .values([
        { ...testListing1, user_id: user[0].id },
        { ...testListing2, user_id: user[0].id }
      ])
      .returning()
      .execute();

    const testInput: CreateExchangeRequestInput = {
      requester_listing_id: listings[0].id,
      target_listing_id: listings[1].id,
      message: 'This should fail'
    };

    await expect(createExchangeRequest(testInput)).rejects.toThrow(/cannot create exchange request with your own listing/i);
  });
});
