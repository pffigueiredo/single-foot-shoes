
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  location: 'New York, NY'
};

const testInputWithoutLocation: CreateUserInput = {
  email: 'test2@example.com',
  name: 'Test User 2',
  location: null
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with location', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.location).toEqual('New York, NY');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a user without location', async () => {
    const result = await createUser(testInputWithoutLocation);

    // Basic field validation
    expect(result.email).toEqual('test2@example.com');
    expect(result.name).toEqual('Test User 2');
    expect(result.location).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].location).toEqual('New York, NY');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    await createUser(testInput);

    // Try to create another user with the same email
    await expect(createUser(testInput)).rejects.toThrow(/duplicate key value/i);
  });
});
