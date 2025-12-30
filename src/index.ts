import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';

dotenv.config();

const port = process.env.PORT || 4000;

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
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
        context: async ({ req }) => ({ token: req.headers.token }),
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
