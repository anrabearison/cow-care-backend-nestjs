import { DataSource } from 'typeorm';
import { EventType } from './modules/event-types/entities/event-type.entity';
import { config } from 'dotenv';

config();

async function addPurchaseEventType() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ombiko',
    entities: [EventType],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const eventTypeRepo = dataSource.getRepository(EventType);
    
    // Check if "Achat" already exists
    const existing = await eventTypeRepo.findOne({ where: { name: 'Achat' } });
    if (existing) {
      console.log('Event type "Achat" already exists');
    } else {
      const newEventType = eventTypeRepo.create({
        name: 'Achat',
        icon: '🛒',
        description: 'Entrée dans le troupeau par achat',
      });
      await eventTypeRepo.save(newEventType);
      console.log('Event type "Achat" added successfully');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPurchaseEventType();
