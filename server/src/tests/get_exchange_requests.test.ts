
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoeListingsTable, exchangeRequestsTable } from '../db/schema';
import { getExchangeRequests } from '../handlers/get_exchange_requests';

describe('getExchangeRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return exchange requests for a user', async () => {
    // Create test users
    const [user1, user2] = await db.insert(usersTable)
      .values([
        { email: 'user1@test.com', name: 'User 1', location: 'City 1' },
        { email: 'user2@test.com', name: 'User 2', location: 'City 2' }
      ])
      .returning()
      .execute();

    // Create shoe listings
    const [listing1, listing2] = await db.insert(shoeListingsTable)
      .values([
        {
          user_id: user1.id,
          brand: 'Nike',
          model: 'Air Max',
          size: '10.5',
          size_system: 'us',
          foot: 'left',
          condition: 'good',
          color: 'red',
          description: 'Great shoes'
        },
        {
          user_id: user2.id,
          brand: 'Adidas',
          model: 'Stan Smith',
          size: '10.0',
          size_system: 'us',
          foot: 'right',
          condition: 'new',
          color: 'white',
          description: 'Brand new'
        }
      ])
      .returning()
      .execute();

    // Create exchange request
    const [exchangeRequest] = await db.insert(exchangeRequestsTable)
      .values({
        requester_listing_id: listing1.id,
        target_listing_id: listing2.id,
        status: 'pending',
        message: 'Would love to exchange!'
      })
      .returning()
      .execute();

    // Test getting exchange requests for user1 (requester)
    const user1Requests = await getExchangeRequests(user1.id);
    expect(user1Requests).toHaveLength(1);
    expect(user1Requests[0].id).toEqual(exchangeRequest.id);
    expect(user1Requests[0].requester_listing_id).toEqual(listing1.id);
    expect(user1Requests[0].target_listing_id).toEqual(listing2.id);
    expect(user1Requests[0].status).toEqual('pending');
    expect(user1Requests[0].message).toEqual('Would love to exchange!');
    expect(user1Requests[0].created_at).toBeInstanceOf(Date);
    expect(user1Requests[0].updated_at).toBeInstanceOf(Date);

    // Test getting exchange requests for user2 (target)
    const user2Requests = await getExchangeRequests(user2.id);
    expect(user2Requests).toHaveLength(1);
    expect(user2Requests[0].id).toEqual(exchangeRequest.id);
  });

  it('should return empty array for user with no exchange requests', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        name: 'Test User',
        location: 'Test City'
      })
      .returning()
      .execute();

    const requests = await getExchangeRequests(user.id);
    expect(requests).toHaveLength(0);
  });

  it('should return multiple exchange requests for a user', async () => {
    // Create test users
    const [user1, user2, user3] = await db.insert(usersTable)
      .values([
        { email: 'user1@test.com', name: 'User 1', location: 'City 1' },
        { email: 'user2@test.com', name: 'User 2', location: 'City 2' },
        { email: 'user3@test.com', name: 'User 3', location: 'City 3' }
      ])
      .returning()
      .execute();

    // Create shoe listings
    const [listing1, listing2, listing3] = await db.insert(shoeListingsTable)
      .values([
        {
          user_id: user1.id,
          brand: 'Nike',
          model: 'Air Max',
          size: '10.5',
          size_system: 'us',
          foot: 'left',
          condition: 'good',
          color: 'red'
        },
        {
          user_id: user2.id,
          brand: 'Adidas',
          model: 'Stan Smith',
          size: '10.0',
          size_system: 'us',
          foot: 'right',
          condition: 'new',
          color: 'white'
        },
        {
          user_id: user3.id,
          brand: 'Puma',
          model: 'Suede',
          size: '9.5',
          size_system: 'us',
          foot: 'left',
          condition: 'like_new',
          color: 'blue'
        }
      ])
      .returning()
      .execute();

    // Create multiple exchange requests involving user1
    await db.insert(exchangeRequestsTable)
      .values([
        {
          requester_listing_id: listing1.id,
          target_listing_id: listing2.id,
          status: 'pending',
          message: 'First request'
        },
        {
          requester_listing_id: listing3.id,
          target_listing_id: listing1.id,
          status: 'accepted',
          message: 'Second request'
        }
      ])
      .execute();

    const requests = await getExchangeRequests(user1.id);
    expect(requests).toHaveLength(2);
    
    // Verify we have both requests
    const statuses = requests.map(r => r.status).sort();
    expect(statuses).toEqual(['accepted', 'pending']);
  });
});
