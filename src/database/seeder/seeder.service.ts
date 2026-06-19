import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Category } from '../../entities/category.entity';
import { Character } from '../../entities/character.entity';
import { Status } from '../../entities/status.entity';
import { EventType } from '../../entities/event-type.entity';
import { Medicament } from '../../entities/medicament.entity';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { Owner } from '../../entities/owner.entity';
import { User, UserRole } from '../../entities/user.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { Cattle, Gender, SourceType } from '../../entities/cattle.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Event } from '../../entities/event.entity';
import { Treatment, TreatmentType, DosageUnit, AdministrationRoute } from '../../entities/treatment.entity';

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
      const categories = [
        { id: 'CAT001', name: 'Veau' },
        { id: 'CAT002', name: 'Génisse' },
        { id: 'CAT003', name: 'Vache' },
        { id: 'CAT004', name: 'Taurillon' },
        { id: 'CAT005', name: 'Taureau' },
        { id: 'CAT006', name: 'Bœuf' },
      ];
      for (const cat of categories) {
        await this.categoryRepo.save(this.categoryRepo.create(cat));
      }
      this.logger.log('Categories seeded');

      // 2. Characters
      const characters = [
        { id: 'CHR001', name: 'Docile' },
        { id: 'CHR002', name: 'Agressif' },
        { id: 'CHR003', name: 'Timide' },
        { id: 'CHR004', name: 'Énergique' },
        { id: 'CHR005', name: 'Calme' },
      ];
      for (const char of characters) {
        await this.characterRepo.save(this.characterRepo.create(char));
      }
      this.logger.log('Characters seeded');

      // 3. Status
      const statuses = [
        { id: 'STA001', name: 'En bonne santé' },
        { id: 'STA002', name: 'Malade' },
        { id: 'STA003', name: 'En traitement' },
        { id: 'STA004', name: 'Vendu' },
        { id: 'STA005', name: 'Mort' },
      ];
      for (const status of statuses) {
        await this.statusRepo.save(this.statusRepo.create(status));
      }
      this.logger.log('Statuses seeded');

      // 4. Event Types
      const eventTypes = [
        { id: 'EVT001', nom: 'Naissance', description: 'Enregistrement de la naissance', icone: 'baby' },
        { id: 'EVT002', nom: 'Vaccination', description: 'Administration de vaccin', icone: 'syringe' },
        { id: 'EVT003', nom: 'Pesée', description: 'Suivi du poids', icone: 'scale' },
        { id: 'EVT004', nom: 'Saillie', description: 'Activité de reproduction', icone: 'heart' },
        { id: 'EVT005', nom: 'Vêlage', description: 'Mise bas', icone: 'home' },
        { id: 'EVT006', nom: 'Traitement', description: 'Soin médical', icone: 'medkit' },
        { id: 'EVT007', nom: 'Vente', description: 'Sortie du troupeau par vente', icone: 'cart' },
      ];
      for (const et of eventTypes) {
        await this.eventTypeRepo.save(this.eventTypeRepo.create(et));
      }
      this.logger.log('Event types seeded');

      // 5. Medicaments
      const medicaments = [
        { id: 'MED001', name: 'Ivermectine', type: 'Vermifuge', withdrawalPeriodMeat: 28, withdrawalPeriodMilk: 7 },
        { id: 'MED002', name: 'Terramycine', type: 'Antibiotique', withdrawalPeriodMeat: 14, withdrawalPeriodMilk: 3 },
        { id: 'MED003', name: 'Vitamine B12', type: 'Supplément', withdrawalPeriodMeat: 0, withdrawalPeriodMilk: 0 },
      ];
      for (const med of medicaments) {
        await this.medicamentRepo.save(this.medicamentRepo.create(med));
      }
      this.logger.log('Medicaments seeded');

      // 6. Veterinarians
      const veterinarians = [
        { id: 'VET001', name: 'Dr. Rakoto', specialite: 'Médecine générale bovine' },
        { id: 'VET002', name: 'Dr. Ranaivo', specialite: 'Chirurgie et reproduction' },
      ];
      for (const vet of veterinarians) {
        await this.veterinarianRepo.save(this.veterinarianRepo.create(vet));
      }
      this.logger.log('Veterinarians seeded');

      // 7. Owner
      const owner = await this.ownerRepo.save(this.ownerRepo.create({
        id: 'OWR-001',
        name: "Ferme d'Ambatobe",
        contactInfo: '034 00 000 00',
        address: 'Ambatobe, Antananarivo',
      }));
      this.logger.log('Owner seeded');

      // 8. User (Password: admin123)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.userRepo.save(this.userRepo.create({
        id: 'USR-001',
        name: 'Admin Ombiko',
        email: 'admin@ombiko.mg',
        hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        ownerId: owner.id,
      }));
      this.logger.log('User seeded');

      // 9. HerdBook
      const herdBook = await this.herdBookRepo.save(this.herdBookRepo.create({
        id: 'HB-2024-001',
        reference: 'HB-2024',
        year: 2024,
        description: 'Livre principal 2024',
        ownerId: owner.id,
      }));
      this.logger.log('HerdBook seeded');

      // 10. Cattle
      const cattle1 = await this.cattleRepo.save(this.cattleRepo.create({
        id: 'BOV-001',
        name: 'Feno',
        nickname: 'Le brave',
        gender: Gender.M,
        birthDate: new Date('2022-05-15'),
        characterId: 'CHR001',
        sourceType: 'ACHETE' as any,
      }));
      const cattle2 = await this.cattleRepo.save(this.cattleRepo.create({
        id: 'BOV-002',
        name: 'Mialy',
        nickname: 'La douce',
        gender: Gender.F,
        birthDate: new Date('2023-02-10'),
        characterId: 'CHR005',
        sourceType: 'NE_DANS_TROUPEAU' as any,
      }));
      this.logger.log('Cattle seeded');

      // 11. HerdBookCattle
      await this.herdBookCattleRepo.save(this.herdBookCattleRepo.create({
        id: 'HBC-001',
        herdBookId: herdBook.id,
        cattleId: cattle1.id,
        nCarnet: 'A-123',
        categoryId: 'CAT005',
        statusId: 'STA001',
      }));
      await this.herdBookCattleRepo.save(this.herdBookCattleRepo.create({
        id: 'HBC-002',
        herdBookId: herdBook.id,
        cattleId: cattle2.id,
        nCarnet: 'B-456',
        categoryId: 'CAT003',
        statusId: 'STA001',
      }));
      this.logger.log('HerdBookCattle seeded');

      // 12. Events
      await this.eventRepo.save(this.eventRepo.create({
        id: 'EV-001',
        cattleId: cattle1.id,
        eventTypeId: 'EVT003',
        date: new Date('2024-01-10'),
        description: 'Pesée mensuelle : 450kg',
      }));
      await this.eventRepo.save(this.eventRepo.create({
        id: 'EV-002',
        cattleId: cattle2.id,
        eventTypeId: 'EVT001',
        date: new Date('2023-02-10'),
        description: 'Naissance naturelle',
      }));
      this.logger.log('Events seeded');

      // 13. Treatments
      await this.treatmentRepo.save(this.treatmentRepo.create({
        id: 'TR-001',
        cattleId: cattle1.id,
        type: TreatmentType.VERMIFUGE,
        date: new Date('2024-02-01'),
        medicamentId: 'MED001',
        veterinarianId: 'VET001',
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
