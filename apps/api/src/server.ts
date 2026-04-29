import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectMySQL, disconnectMySQL } from './config/database';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';

async function bootstrap(): Promise<void> {
  try {
    await connectMySQL();
    await connectMongoDB();

    const server = app.listen(env.PORT, 'localhost', () => {
      console.log(`Sarui API running on http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`API base: http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await disconnectMySQL();
          await disconnectMongoDB();
          console.log('All connections closed. Exiting.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
