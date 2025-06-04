
import { db } from '../db';
import { shoeListingsTable } from '../db/schema';
import { type SearchShoesInput, type ShoeListing } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const searchShoes = async (input: SearchShoesInput): Promise<ShoeListing[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    // Add filters based on input
    if (input.brand) {
      conditions.push(eq(shoeListingsTable.brand, input.brand));
    }

    if (input.size !== undefined) {
      conditions.push(eq(shoeListingsTable.size, input.size.toString()));
    }

    if (input.size_system) {
      conditions.push(eq(shoeListingsTable.size_system, input.size_system));
    }

    if (input.foot) {
      conditions.push(eq(shoeListingsTable.foot, input.foot));
    }

    if (input.condition) {
      conditions.push(eq(shoeListingsTable.condition, input.condition));
    }

    if (input.color) {
      conditions.push(eq(shoeListingsTable.color, input.color));
    }

    if (input.user_id !== undefined) {
      conditions.push(eq(shoeListingsTable.user_id, input.user_id));
    }

    // Build query with conditions
    const results = conditions.length === 0
      ? await db.select().from(shoeListingsTable).execute()
      : await db.select()
          .from(shoeListingsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute();

    // Convert numeric fields back to numbers
    return results.map(listing => ({
      ...listing,
      size: parseFloat(listing.size)
    }));
  } catch (error) {
    console.error('Shoe search failed:', error);
    throw error;
  }
};
