import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from './database/seeder/seeder.module';
import { SeederService } from './database/seeder/seeder.service';

async function bootstrap() {
  const logger = new Logger('SeederBootstrap');
  
  try {
    logger.log('Bootstrapping seeder context...');
    const appContext = await NestFactory.createApplicationContext(SeederModule);
    
    const seederService = appContext.get(SeederService);
    
    logger.log('Starting seeding...');
    await seederService.seed();
    
    logger.log('Seeding completed successfully');
    await appContext.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', error.stack);
    process.exit(1);
  }
}

bootstrap();
