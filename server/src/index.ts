
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createUserInputSchema,
  createShoeListingInputSchema,
  createExchangeRequestInputSchema,
  updateExchangeStatusInputSchema,
  searchShoesInputSchema
} from './schema';

import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createShoeListing } from './handlers/create_shoe_listing';
import { getShoeListings } from './handlers/get_shoe_listings';
import { searchShoes } from './handlers/search_shoes';
import { createExchangeRequest } from './handlers/create_exchange_request';
import { getExchangeRequests } from './handlers/get_exchange_requests';
import { updateExchangeStatus } from './handlers/update_exchange_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User operations
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  // Shoe listing operations
  createShoeListing: publicProcedure
    .input(createShoeListingInputSchema)
    .mutation(({ input }) => createShoeListing(input)),
  
  getShoeListings: publicProcedure
    .query(() => getShoeListings()),
  
  searchShoes: publicProcedure
    .input(searchShoesInputSchema)
    .query(({ input }) => searchShoes(input)),
  
  // Exchange operations
  createExchangeRequest: publicProcedure
    .input(createExchangeRequestInputSchema)
    .mutation(({ input }) => createExchangeRequest(input)),
  
  getExchangeRequests: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getExchangeRequests(input.userId)),
  
  updateExchangeStatus: publicProcedure
    .input(updateExchangeStatusInputSchema)
    .mutation(({ input }) => updateExchangeStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
