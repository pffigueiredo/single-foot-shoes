
import { db } from '../db';
import { shoeListingsTable, usersTable } from '../db/schema';
import { type CreateShoeListingInput, type ShoeListing } from '../schema';
import { eq } from 'drizzle-orm';

export const createShoeListing = async (input: CreateShoeListingInput): Promise<ShoeListing> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Insert shoe listing record
    const result = await db.insert(shoeListingsTable)
      .values({
        user_id: input.user_id,
        brand: input.brand,
        model: input.model,
        size: input.size.toString(), // Convert number to string for numeric column
        size_system: input.size_system,
        foot: input.foot,
        condition: input.condition,
        color: input.color,
        description: input.description,
        image_url: input.image_url
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const shoeListing = result[0];
    return {
      ...shoeListing,
      size: parseFloat(shoeListing.size) // Convert string back to number
    };
  } catch (error) {
    console.error('Shoe listing creation failed:', error);
    throw error;
  }
};
