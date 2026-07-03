import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Category } from '../../modules/categories/entities/category.entity';
import { Character } from '../../modules/characters/entities/character.entity';
import { Status } from '../../modules/status/entities/status.entity';
import { EventType } from '../../modules/event-types/entities/event-type.entity';
import { Medicament } from '../../modules/medicaments/entities/medicament.entity';
import { Veterinarian } from '../../modules/veterinarians/entities/veterinarian.entity';
import { Owner } from '../../modules/owners/entities/owner.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { HerdBook } from '../../modules/herd-books/entities/herd-book.entity';
import { Cattle, Gender, SourceType } from '../../modules/cattle/entities/cattle.entity';
import { HerdBookCattle } from '../../modules/herd-book-cattle/entities/herd-book-cattle.entity';
import { Event } from '../../modules/events/entities/event.entity';
import { Treatment, TreatmentType, DosageUnit, AdministrationRoute } from '../../modules/treatments/entities/treatment.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
    @InjectRepository(Status) private readonly statusRepo: Repository<Status>,
    @InjectRepository(EventType) private readonly eventTypeRepo: Repository<EventType>,
    @InjectRepository(Medicament) private readonly medicamentRepo: Repository<Medicament>,
    @InjectRepository(Veterinarian) private readonly veterinarianRepo: Repository<Veterinarian>,
    @InjectRepository(Owner) private readonly ownerRepo: Repository<Owner>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(HerdBook) private readonly herdBookRepo: Repository<HerdBook>,
    @InjectRepository(Cattle) private readonly cattleRepo: Repository<Cattle>,
    @InjectRepository(HerdBookCattle) private readonly herdBookCattleRepo: Repository<HerdBookCattle>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Treatment) private readonly treatmentRepo: Repository<Treatment>,
  ) {}

  async seed() {
    try {
      this.logger.log('Starting seeding process...');

      // 1. Categories
      const categoriesData = [
        { name: 'Veau' },
        { name: 'Génisse' },
        { name: 'Vache' },
        { name: 'Taurillon' },
        { name: 'Taureau' },
        { name: 'Bœuf' },
      ];
      const categories = [];
      for (const cat of categoriesData) {
        categories.push(await this.categoryRepo.save(this.categoryRepo.create(cat)));
      }
      this.logger.log('Categories seeded');

      // 2. Characters
      const charactersData = [
        { id: 'docile', name: 'Docile' },
        { id: 'agressif', name: 'Agressif' },
        { id: 'timide', name: 'Timide' },
        { id: 'energique', name: 'Énergique' },
        { id: 'calme', name: 'Calme' },
      ];
      const characters = [];
      for (const char of charactersData) {
        characters.push(await this.characterRepo.save(this.characterRepo.create(char)));
      }
      this.logger.log('Characters seeded');

      // 3. Status
      const statusesData = [
        { name: 'En bonne santé' },
        { name: 'Malade' },
        { name: 'En traitement' },
        { name: 'Vendu' },
        { name: 'Mort' },
      ];
      const statuses = [];
      for (const status of statusesData) {
        statuses.push(await this.statusRepo.save(this.statusRepo.create(status)));
      }
      this.logger.log('Statuses seeded');

      // 4. Event Types
      const eventTypesData = [
        { name: 'Naissance',  description: 'Enregistrement de la naissance', icon: '👶' },
        { name: 'Vaccination', description: 'Administration de vaccin',       icon: '💉' },
        { name: 'Pesée',       description: 'Suivi du poids',                  icon: '⚖️' },
        { name: 'Saillie',     description: 'Activité de reproduction',        icon: '❤️' },
        { name: 'Vêlage',      description: 'Mise bas',                         icon: '🏠' },
        { name: 'Traitement',  description: 'Soin médical',                    icon: '🩺' },
        { name: 'Vente',       description: 'Sortie du troupeau par vente',    icon: '🛒' },
        { name: 'Achat',       description: 'Entrée dans le troupeau par achat', icon: '🛒' },
      ];
      const eventTypes = [];
      for (const et of eventTypesData) {
        const existing = await this.eventTypeRepo.findOne({ where: { name: et.name } });
        if (!existing) {
          eventTypes.push(await this.eventTypeRepo.save(this.eventTypeRepo.create(et)));
        } else {
          eventTypes.push(existing);
        }
      }
      this.logger.log('Event types seeded');

      // 5. Medicaments
      const medicamentsData = [
        { name: 'Ivermectine', type: 'Vermifuge', withdrawalPeriodMeatDays: 28, withdrawalPeriodMilkDays: 7 },
        { name: 'Terramycine', type: 'Antibiotique', withdrawalPeriodMeatDays: 14, withdrawalPeriodMilkDays: 3 },
        { name: 'Vitamine B12', type: 'Supplément', withdrawalPeriodMeatDays: 0, withdrawalPeriodMilkDays: 0 },
      ];
      const medicaments = [];
      for (const med of medicamentsData) {
        medicaments.push(await this.medicamentRepo.save(this.medicamentRepo.create(med)));
      }
      this.logger.log('Medicaments seeded');

      // 6. Veterinarians
      const veterinariansData = [
        { name: 'Dr. Rakoto', specialty: 'Médecine générale bovine' },
        { name: 'Dr. Ranaivo', specialty: 'Chirurgie et reproduction' },
      ];
      const veterinarians = [];
      for (const vet of veterinariansData) {
        veterinarians.push(await this.veterinarianRepo.save(this.veterinarianRepo.create(vet)));
      }
      this.logger.log('Veterinarians seeded');

      // 7. Owner
      const owner = await this.ownerRepo.save(this.ownerRepo.create({
        name: "Ferme d'Ambatobe",
        contactInfo: '034 00 000 00',
        address: 'Ambatobe, Antananarivo',
      }));
      this.logger.log('Owner seeded');

      // 8. User (Password: admin123)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const existingUser = await this.userRepo.findOne({ where: { email: 'admin@ombiko.mg' } });
      if (!existingUser) {
        await this.userRepo.save(this.userRepo.create({
          name: 'Admin Ombiko',
          email: 'admin@ombiko.mg',
          hashedPassword,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          ownerId: owner.id,
        }));
      }
      this.logger.log('User seeded');

      // 9. HerdBook
      const herdBook = await this.herdBookRepo.save(this.herdBookRepo.create({
        reference: 'HB-2024',
        description: 'Livre principal 2024',
        ownerId: owner.id,
      }));
      this.logger.log('HerdBook seeded');

      // 10. Cattle
      const cattle1 = await this.cattleRepo.save(this.cattleRepo.create({
        name: 'Feno',
        nickname: 'Le brave',
        gender: Gender.M,
        ownerId: owner.id,
        birthDate: new Date('2022-05-15'),
        characterId: characters[0].id,
        sourceType: 'ACHETE' as any,
      }));
      const cattle2 = await this.cattleRepo.save(this.cattleRepo.create({
        name: 'Mialy',
        nickname: 'La douce',
        gender: Gender.F,
        ownerId: owner.id,
        birthDate: new Date('2023-02-10'),
        characterId: characters[4].id,
        sourceType: 'NE_DANS_TROUPEAU' as any,
      }));
      this.logger.log('Cattle seeded');

      // 11. HerdBookCattle
      await this.herdBookCattleRepo.save(this.herdBookCattleRepo.create({
        herdBookId: herdBook.id,
        cattleId: cattle1.id,
        nCarnet: 'A-123',
        year: 2024,
        categoryId: categories[4].id,
        statusId: statuses[0].id,
      }));
      await this.herdBookCattleRepo.save(this.herdBookCattleRepo.create({
        herdBookId: herdBook.id,
        cattleId: cattle2.id,
        nCarnet: 'B-456',
        year: 2024,
        categoryId: categories[2].id,
        statusId: statuses[0].id,
      }));
      this.logger.log('HerdBookCattle seeded');

      // 12. Events
      await this.eventRepo.save(this.eventRepo.create({
        cattleId: cattle1.id,
        eventTypeId: eventTypes[2].id,
        date: new Date('2024-01-10'),
        description: 'Pesée mensuelle : 450kg',
      }));
      await this.eventRepo.save(this.eventRepo.create({
        cattleId: cattle2.id,
        eventTypeId: eventTypes[0].id,
        date: new Date('2023-02-10'),
        description: 'Naissance naturelle',
      }));
      this.logger.log('Events seeded');

      // 13. Treatments
      await this.treatmentRepo.save(this.treatmentRepo.create({
        cattleId: cattle1.id,
        type: TreatmentType.VERMIFUGE,
        date: new Date('2024-02-01'),
        medicamentId: medicaments[0].id,
        veterinarianId: veterinarians[0].id,
        notes: 'Traitement préventif de routine',
        administrationRoute: AdministrationRoute.IM,
      }));
      this.logger.log('Treatments seeded');

      this.logger.log('Seeding completed successfully!');
    } catch (error) {
      this.logger.error('Seeding failed', error.stack);
      throw error;
    }
  }
}
