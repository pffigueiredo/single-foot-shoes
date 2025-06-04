
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { shoeListingsTable, usersTable } from '../db/schema';
import { type CreateShoeListingInput, type CreateUserInput } from '../schema';
import { createShoeListing } from '../handlers/create_shoe_listing';
import { eq } from 'drizzle-orm';

// Test user input
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  location: 'Test City'
};

// Test shoe listing input
const testInput: CreateShoeListingInput = {
  user_id: 1, // Will be set after creating user
  brand: 'Nike',
  model: 'Air Max 90',
  size: 10.5,
  size_system: 'us',
  foot: 'left',
  condition: 'good',
  color: 'White/Black',
  description: 'Great condition sneakers',
  image_url: 'https://example.com/image.jpg'
};

describe('createShoeListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a shoe listing', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const testInputWithUserId = {
      ...testInput,
      user_id: userResult[0].id
    };

    const result = await createShoeListing(testInputWithUserId);

    // Basic field validation
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.brand).toEqual('Nike');
    expect(result.model).toEqual('Air Max 90');
    expect(result.size).toEqual(10.5);
    expect(typeof result.size).toBe('number');
    expect(result.size_system).toEqual('us');
    expect(result.foot).toEqual('left');
    expect(result.condition).toEqual('good');
    expect(result.color).toEqual('White/Black');
    expect(result.description).toEqual('Great condition sneakers');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.is_available).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save shoe listing to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const testInputWithUserId = {
      ...testInput,
      user_id: userResult[0].id
    };

    const result = await createShoeListing(testInputWithUserId);

    // Query using proper drizzle syntax
    const shoeListings = await db.select()
      .from(shoeListingsTable)
      .where(eq(shoeListingsTable.id, result.id))
      .execute();

    expect(shoeListings).toHaveLength(1);
    expect(shoeListings[0].brand).toEqual('Nike');
    expect(shoeListings[0].model).toEqual('Air Max 90');
    expect(parseFloat(shoeListings[0].size)).toEqual(10.5);
    expect(shoeListings[0].size_system).toEqual('us');
    expect(shoeListings[0].foot).toEqual('left');
    expect(shoeListings[0].condition).toEqual('good');
    expect(shoeListings[0].color).toEqual('White/Black');
    expect(shoeListings[0].description).toEqual('Great condition sneakers');
    expect(shoeListings[0].image_url).toEqual('https://example.com/image.jpg');
    expect(shoeListings[0].is_available).toBe(true);
    expect(shoeListings[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const inputWithNulls: CreateShoeListingInput = {
      user_id: userResult[0].id,
      brand: 'Adidas',
      model: 'Stan Smith',
      size: 9.0,
      size_system: 'eu',
      foot: 'right',
      condition: 'new',
      color: 'White',
      description: null,
      image_url: null
    };

    const result = await createShoeListing(inputWithNulls);

    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.brand).toEqual('Adidas');
    expect(result.model).toEqual('Stan Smith');
    expect(result.size).toEqual(9.0);
    expect(typeof result.size).toBe('number');
  });

  it('should throw error when user does not exist', async () => {
    const inputWithInvalidUserId = {
      ...testInput,
      user_id: 999 // Non-existent user ID
    };

    await expect(createShoeListing(inputWithInvalidUserId))
      .rejects.toThrow(/User with id 999 not found/i);
  });
});
