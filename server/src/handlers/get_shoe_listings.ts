
import { db } from '../db';
import { shoeListingsTable } from '../db/schema';
import { type ShoeListing } from '../schema';

export const getShoeListings = async (): Promise<ShoeListing[]> => {
  try {
    const results = await db.select()
      .from(shoeListingsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(listing => ({
      ...listing,
      size: parseFloat(listing.size) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to get shoe listings:', error);
    throw error;
  }
};
