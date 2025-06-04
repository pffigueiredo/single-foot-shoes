
import { db } from '../db';
import { exchangeRequestsTable, shoeListingsTable } from '../db/schema';
import { type CreateExchangeRequestInput, type ExchangeRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const createExchangeRequest = async (input: CreateExchangeRequestInput): Promise<ExchangeRequest> => {
  try {
    // Verify both shoe listings exist and are available
    const requesterListing = await db.select()
      .from(shoeListingsTable)
      .where(eq(shoeListingsTable.id, input.requester_listing_id))
      .execute();

    if (requesterListing.length === 0) {
      throw new Error('Requester listing not found');
    }

    if (!requesterListing[0].is_available) {
      throw new Error('Requester listing is not available');
    }

    const targetListing = await db.select()
      .from(shoeListingsTable)
      .where(eq(shoeListingsTable.id, input.target_listing_id))
      .execute();

    if (targetListing.length === 0) {
      throw new Error('Target listing not found');
    }

    if (!targetListing[0].is_available) {
      throw new Error('Target listing is not available');
    }

    // Prevent users from requesting exchanges with their own listings
    if (requesterListing[0].user_id === targetListing[0].user_id) {
      throw new Error('Cannot create exchange request with your own listing');
    }

    // Insert exchange request record
    const result = await db.insert(exchangeRequestsTable)
      .values({
        requester_listing_id: input.requester_listing_id,
        target_listing_id: input.target_listing_id,
        message: input.message,
        status: 'pending' // Default status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Exchange request creation failed:', error);
    throw error;
  }
};
