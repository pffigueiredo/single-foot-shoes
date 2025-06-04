
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          name: 'User One',
          location: 'New York'
        },
        {
          email: 'user2@example.com',
          name: 'User Two',
          location: null
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].email).toEqual('user1@example.com');
    expect(result[0].name).toEqual('User One');
    expect(result[0].location).toEqual('New York');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second user
    expect(result[1].email).toEqual('user2@example.com');
    expect(result[1].name).toEqual('User Two');
    expect(result[1].location).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return users in order they were created', async () => {
    // Create users at different times
    const firstUser = await db.insert(usersTable)
      .values({
        email: 'first@example.com',
        name: 'First User',
        location: 'City A'
      })
      .returning()
      .execute();

    const secondUser = await db.insert(usersTable)
      .values({
        email: 'second@example.com',
        name: 'Second User',
        location: 'City B'
      })
      .returning()
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(firstUser[0].id);
    expect(result[1].id).toEqual(secondUser[0].id);
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
