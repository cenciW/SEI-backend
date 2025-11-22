import { NestFactory } from '@nestjs/core';
// Force restart again 6
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
