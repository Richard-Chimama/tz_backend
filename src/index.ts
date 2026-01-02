import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import prisma from './lib/prisma';
import { Context } from './types/context';
import { getUserFromToken, getUserFromApiKey } from './lib/auth';

dotenv.config();

const port = process.env.PORT || 4000;

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req }) => {
          let user = null;
          const authHeader = req.headers.authorization || '';
          const apiKey = req.headers['x-api-key'];

          if (apiKey && typeof apiKey === 'string') {
             user = await getUserFromApiKey(apiKey);
          } else if (authHeader) {
             const token = authHeader.replace(/^Bearer\s+/i, '');
             user = await getUserFromToken(token);
          }
          
          return {
            token: authHeader,
            prisma,
            user
          };
        },
    }),
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`Health check at http://localhost:${port}/health`);
};

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
