
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoeListingsTable } from '../db/schema';
import { getShoeListings } from '../handlers/get_shoe_listings';

describe('getShoeListings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no listings exist', async () => {
    const result = await getShoeListings();
    expect(result).toEqual([]);
  });

  it('should return all shoe listings', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test shoe listings
    await db.insert(shoeListingsTable)
      .values([
        {
          user_id: userId,
          brand: 'Nike',
          model: 'Air Jordan 1',
          size: '10.5',
          size_system: 'us',
          foot: 'left',
          condition: 'good',
          color: 'red'
        },
        {
          user_id: userId,
          brand: 'Adidas',
          model: 'Stan Smith',
          size: '9.0',
          size_system: 'eu',
          foot: 'right',
          condition: 'new',
          color: 'white'
        }
      ])
      .execute();

    const result = await getShoeListings();

    expect(result).toHaveLength(2);
    
    // Verify first listing
    expect(result[0].brand).toEqual('Nike');
    expect(result[0].model).toEqual('Air Jordan 1');
    expect(result[0].size).toEqual(10.5);
    expect(typeof result[0].size).toBe('number');
    expect(result[0].size_system).toEqual('us');
    expect(result[0].foot).toEqual('left');
    expect(result[0].condition).toEqual('good');
    expect(result[0].color).toEqual('red');
    expect(result[0].is_available).toEqual(true);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second listing
    expect(result[1].brand).toEqual('Adidas');
    expect(result[1].model).toEqual('Stan Smith');
    expect(result[1].size).toEqual(9.0);
    expect(typeof result[1].size).toBe('number');
    expect(result[1].size_system).toEqual('eu');
    expect(result[1].foot).toEqual('right');
    expect(result[1].condition).toEqual('new');
    expect(result[1].color).toEqual('white');
  });

  it('should include all required fields', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test shoe listing with all fields
    await db.insert(shoeListingsTable)
      .values({
        user_id: userId,
        brand: 'Converse',
        model: 'Chuck Taylor',
        size: '8.5',
        size_system: 'uk',
        foot: 'left',
        condition: 'like_new',
        color: 'black',
        description: 'Great condition shoes',
        image_url: 'https://example.com/image.jpg'
      })
      .execute();

    const result = await getShoeListings();

    expect(result).toHaveLength(1);
    const listing = result[0];

    // Verify all required fields are present
    expect(listing.id).toBeDefined();
    expect(listing.user_id).toEqual(userId);
    expect(listing.brand).toEqual('Converse');
    expect(listing.model).toEqual('Chuck Taylor');
    expect(listing.size).toEqual(8.5);
    expect(listing.size_system).toEqual('uk');
    expect(listing.foot).toEqual('left');
    expect(listing.condition).toEqual('like_new');
    expect(listing.color).toEqual('black');
    expect(listing.description).toEqual('Great condition shoes');
    expect(listing.image_url).toEqual('https://example.com/image.jpg');
    expect(listing.is_available).toEqual(true);
    expect(listing.created_at).toBeInstanceOf(Date);
  });
});
