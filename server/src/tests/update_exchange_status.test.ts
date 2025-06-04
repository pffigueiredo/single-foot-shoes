
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, shoeListingsTable, exchangeRequestsTable } from '../db/schema';
import { type UpdateExchangeStatusInput, type CreateUserInput, type CreateShoeListingInput, type CreateExchangeRequestInput } from '../schema';
import { updateExchangeStatus } from '../handlers/update_exchange_status';
import { eq } from 'drizzle-orm';

// Test input
const testStatusInput: UpdateExchangeStatusInput = {
  id: 1,
  status: 'accepted'
};

describe('updateExchangeStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update exchange request status', async () => {
    // Create prerequisite data
    const userInput1: CreateUserInput = {
      email: 'user1@test.com',
      name: 'User One',
      location: 'Test City'
    };

    const userInput2: CreateUserInput = {
      email: 'user2@test.com',
      name: 'User Two',
      location: 'Test City'
    };

    const users = await db.insert(usersTable)
      .values([userInput1, userInput2])
      .returning()
      .execute();

    const shoeInput1: CreateShoeListingInput = {
      user_id: users[0].id,
      brand: 'Nike',
      model: 'Air Max',
      size: 10.5,
      size_system: 'us',
      foot: 'left',
      condition: 'good',
      color: 'black',
      description: 'Great condition',
      image_url: 'https://example.com/shoe1.jpg'
    };

    const shoeInput2: CreateShoeListingInput = {
      user_id: users[1].id,
      brand: 'Adidas',
      model: 'Stan Smith',
      size: 10.5,
      size_system: 'us',
      foot: 'left',
      condition: 'like_new',
      color: 'white',
      description: 'Barely worn',
      image_url: 'https://example.com/shoe2.jpg'
    };

    const shoes = await db.insert(shoeListingsTable)
      .values([
        {
          ...shoeInput1,
          size: shoeInput1.size.toString()
        },
        {
          ...shoeInput2,
          size: shoeInput2.size.toString()
        }
      ])
      .returning()
      .execute();

    const exchangeInput: CreateExchangeRequestInput = {
      requester_listing_id: shoes[0].id,
      target_listing_id: shoes[1].id,
      message: 'Would like to exchange'
    };

    const exchangeRequest = await db.insert(exchangeRequestsTable)
      .values(exchangeInput)
      .returning()
      .execute();

    const updateInput: UpdateExchangeStatusInput = {
      id: exchangeRequest[0].id,
      status: 'accepted'
    };

    // Test the update
    const result = await updateExchangeStatus(updateInput);

    expect(result.id).toEqual(exchangeRequest[0].id);
    expect(result.status).toEqual('accepted');
    expect(result.requester_listing_id).toEqual(shoes[0].id);
    expect(result.target_listing_id).toEqual(shoes[1].id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should save status update to database', async () => {
    // Create prerequisite data
    const userInput: CreateUserInput = {
      email: 'user@test.com',
      name: 'Test User',
      location: 'Test City'
    };

    const user = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();

    const shoeInput1: CreateShoeListingInput = {
      user_id: user[0].id,
      brand: 'Nike',
      model: 'Air Force 1',
      size: 9.0,
      size_system: 'us',
      foot: 'right',
      condition: 'new',
      color: 'white',
      description: null,
      image_url: null
    };

    const shoeInput2: CreateShoeListingInput = {
      user_id: user[0].id,
      brand: 'Converse',
      model: 'Chuck Taylor',
      size: 9.0,
      size_system: 'us',
      foot: 'right',
      condition: 'good',
      color: 'black',
      description: null,
      image_url: null
    };

    const shoes = await db.insert(shoeListingsTable)
      .values([
        {
          ...shoeInput1,
          size: shoeInput1.size.toString()
        },
        {
          ...shoeInput2,
          size: shoeInput2.size.toString()
        }
      ])
      .returning()
      .execute();

    const exchangeInput: CreateExchangeRequestInput = {
      requester_listing_id: shoes[0].id,
      target_listing_id: shoes[1].id,
      message: null
    };

    const exchangeRequest = await db.insert(exchangeRequestsTable)
      .values(exchangeInput)
      .returning()
      .execute();

    const updateInput: UpdateExchangeStatusInput = {
      id: exchangeRequest[0].id,
      status: 'completed'
    };

    await updateExchangeStatus(updateInput);

    // Verify in database
    const updatedExchange = await db.select()
      .from(exchangeRequestsTable)
      .where(eq(exchangeRequestsTable.id, exchangeRequest[0].id))
      .execute();

    expect(updatedExchange).toHaveLength(1);
    expect(updatedExchange[0].status).toEqual('completed');
    expect(updatedExchange[0].updated_at).toBeInstanceOf(Date);
    expect(updatedExchange[0].updated_at.getTime()).toBeGreaterThan(updatedExchange[0].created_at.getTime());
  });

  it('should throw error when exchange request not found', async () => {
    const updateInput: UpdateExchangeStatusInput = {
      id: 999,
      status: 'cancelled'
    };

    await expect(updateExchangeStatus(updateInput)).rejects.toThrow(/exchange request.*not found/i);
  });
});
