
import { db } from '../db';
import { exchangeRequestsTable } from '../db/schema';
import { type UpdateExchangeStatusInput, type ExchangeRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExchangeStatus = async (input: UpdateExchangeStatusInput): Promise<ExchangeRequest> => {
  try {
    // Update the exchange request status
    const result = await db.update(exchangeRequestsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(exchangeRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Exchange request with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Exchange status update failed:', error);
    throw error;
  }
};
