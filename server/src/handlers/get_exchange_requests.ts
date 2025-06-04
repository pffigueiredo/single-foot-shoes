
import { db } from '../db';
import { exchangeRequestsTable, shoeListingsTable } from '../db/schema';
import { type ExchangeRequest } from '../schema';
import { eq, or } from 'drizzle-orm';

export const getExchangeRequests = async (userId: number): Promise<ExchangeRequest[]> => {
  try {
    // Get exchange requests where the user is either the requester or the target
    // Need to join with shoe listings to check user ownership
    const results = await db.select({
      id: exchangeRequestsTable.id,
      requester_listing_id: exchangeRequestsTable.requester_listing_id,
      target_listing_id: exchangeRequestsTable.target_listing_id,
      status: exchangeRequestsTable.status,
      message: exchangeRequestsTable.message,
      created_at: exchangeRequestsTable.created_at,
      updated_at: exchangeRequestsTable.updated_at,
    })
      .from(exchangeRequestsTable)
      .innerJoin(shoeListingsTable, or(
        eq(exchangeRequestsTable.requester_listing_id, shoeListingsTable.id),
        eq(exchangeRequestsTable.target_listing_id, shoeListingsTable.id)
      ))
      .where(eq(shoeListingsTable.user_id, userId))
      .execute();

    // Remove duplicates that might occur from the join
    const uniqueRequests = new Map<number, ExchangeRequest>();
    
    results.forEach(result => {
      if (!uniqueRequests.has(result.id)) {
        uniqueRequests.set(result.id, result);
      }
    });

    return Array.from(uniqueRequests.values());
  } catch (error) {
    console.error('Get exchange requests failed:', error);
    throw error;
  }
};
