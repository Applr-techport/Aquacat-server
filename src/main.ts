import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

console.log('🔄 Starting NestJS application...');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🐱💧 NyangNyang Water API running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
}
bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
