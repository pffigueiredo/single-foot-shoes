
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoeListingsTable } from '../db/schema';
import { type CreateUserInput, type CreateShoeListingInput, type SearchShoesInput } from '../schema';
import { searchShoes } from '../handlers/search_shoes';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  location: 'Test City'
};

const testShoeListing: CreateShoeListingInput = {
  user_id: 1,
  brand: 'Nike',
  model: 'Air Max 90',
  size: 10.5,
  size_system: 'us',
  foot: 'left',
  condition: 'good',
  color: 'red',
  description: 'Great condition shoes',
  image_url: 'https://example.com/image.jpg'
};

const testShoeListing2: CreateShoeListingInput = {
  user_id: 1,
  brand: 'Adidas',
  model: 'Stan Smith',
  size: 9.0,
  size_system: 'eu',
  foot: 'right',
  condition: 'new',
  color: 'white',
  description: 'Brand new shoes',
  image_url: 'https://example.com/image2.jpg'
};

describe('searchShoes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all shoes when no filters provided', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create shoe listings
    await db.insert(shoeListingsTable).values({
      ...testShoeListing,
      size: testShoeListing.size.toString()
    }).execute();

    await db.insert(shoeListingsTable).values({
      ...testShoeListing2,
      size: testShoeListing2.size.toString()
    }).execute();

    const searchInput: SearchShoesInput = {};
    const results = await searchShoes(searchInput);

    expect(results).toHaveLength(2);
    expect(results[0].brand).toEqual('Nike');
    expect(results[1].brand).toEqual('Adidas');
    expect(typeof results[0].size).toBe('number');
    expect(results[0].size).toEqual(10.5);
    expect(typeof results[1].size).toBe('number');
    expect(results[1].size).toEqual(9.0);
  });

  it('should filter by brand', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create shoe listings
    await db.insert(shoeListingsTable).values({
      ...testShoeListing,
      size: testShoeListing.size.toString()
    }).execute();

    await db.insert(shoeListingsTable).values({
      ...testShoeListing2,
      size: testShoeListing2.size.toString()
    }).execute();

    const searchInput: SearchShoesInput = {
      brand: 'Nike'
    };
    const results = await searchShoes(searchInput);

    expect(results).toHaveLength(1);
    expect(results[0].brand).toEqual('Nike');
    expect(results[0].model).toEqual('Air Max 90');
  });

  it('should filter by multiple criteria', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create shoe listings
    await db.insert(shoeListingsTable).values({
      ...testShoeListing,
      size: testShoeListing.size.toString()
    }).execute();

    await db.insert(shoeListingsTable).values({
      ...testShoeListing2,
      size: testShoeListing2.size.toString()
    }).execute();

    const searchInput: SearchShoesInput = {
      size_system: 'us',
      foot: 'left',
      condition: 'good'
    };
    const results = await searchShoes(searchInput);

    expect(results).toHaveLength(1);
    expect(results[0].brand).toEqual('Nike');
    expect(results[0].size_system).toEqual('us');
    expect(results[0].foot).toEqual('left');
    expect(results[0].condition).toEqual('good');
  });

  it('should filter by user_id', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable).values(testUser).returning().execute();
    const user2Result = await db.insert(usersTable).values({
      ...testUser,
      email: 'user2@example.com',
      name: 'User 2'
    }).returning().execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create shoe listings for both users
    await db.insert(shoeListingsTable).values({
      ...testShoeListing,
      user_id: user1Id,
      size: testShoeListing.size.toString()
    }).execute();

    await db.insert(shoeListingsTable).values({
      ...testShoeListing2,
      user_id: user2Id,
      size: testShoeListing2.size.toString()
    }).execute();

    const searchInput: SearchShoesInput = {
      user_id: user1Id
    };
    const results = await searchShoes(searchInput);

    expect(results).toHaveLength(1);
    expect(results[0].user_id).toEqual(user1Id);
    expect(results[0].brand).toEqual('Nike');
  });

  it('should return empty array when no matches found', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create shoe listing
    await db.insert(shoeListingsTable).values({
      ...testShoeListing,
      size: testShoeListing.size.toString()
    }).execute();

    const searchInput: SearchShoesInput = {
      brand: 'NonExistentBrand'
    };
    const results = await searchShoes(searchInput);

    expect(results).toHaveLength(0);
  });

  it('should filter by size correctly', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create shoe listings with different sizes
    await db.insert(shoeListingsTable).values({
      ...testShoeListing,
      size: '10.5'
    }).execute();

    await db.insert(shoeListingsTable).values({
      ...testShoeListing2,
      size: '9.0'
    }).execute();

    const searchInput: SearchShoesInput = {
      size: 10.5
    };
    const results = await searchShoes(searchInput);

    expect(results).toHaveLength(1);
    expect(results[0].size).toEqual(10.5);
    expect(typeof results[0].size).toBe('number');
  });
});
