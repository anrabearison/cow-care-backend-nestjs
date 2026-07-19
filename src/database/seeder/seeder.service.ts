import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Category } from '../../modules/platform/categories/entities/category.entity';
import { Character } from '../../modules/platform/characters/entities/character.entity';
import { Status } from '../../modules/platform/status/entities/status.entity';
import { EventType } from '../../modules/platform/event-types/entities/event-type.entity';
import { Medicament } from '../../modules/platform/medicaments/entities/medicament.entity';
import { Veterinarian } from '../../modules/veterinarians/entities/veterinarian.entity';
import { Owner } from '../../modules/platform/owners/entities/owner.entity';
import { User, UserRole } from '../../modules/platform/users/entities/user.entity';
import { AuthProvider, AuthProviderType } from '../../modules/auth/entities/auth-provider.entity';
import { HerdBook } from '../../modules/farm/herd-books/entities/herd-book.entity';
import { Cattle, Gender } from '../../modules/farm/cattle/entities/cattle.entity';
import { HerdBookCattle } from '../../modules/farm/herd-book-cattle/entities/herd-book-cattle.entity';
import { Event } from '../../modules/farm/events/entities/event.entity';
import { Treatment, TreatmentType, DosageUnit, AdministrationRoute } from '../../modules/farm/treatments/entities/treatment.entity';
import { Supplier } from '../../modules/farm/purchases/entities/supplier.entity';

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
    @InjectRepository(AuthProvider) private readonly authProviderRepo: Repository<AuthProvider>,
    @InjectRepository(HerdBook) private readonly herdBookRepo: Repository<HerdBook>,
    @InjectRepository(Cattle) private readonly cattleRepo: Repository<Cattle>,
    @InjectRepository(HerdBookCattle) private readonly herdBookCattleRepo: Repository<HerdBookCattle>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Treatment) private readonly treatmentRepo: Repository<Treatment>,
    @InjectRepository(Supplier) private readonly supplierRepo: Repository<Supplier>,
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
        const existing = await this.categoryRepo.findOne({ where: { name: cat.name } });
        if (!existing) {
          categories.push(await this.categoryRepo.save(this.categoryRepo.create(cat)));
        } else {
          categories.push(existing);
        }
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
        const existing = await this.characterRepo.findOne({ where: { id: char.id } });
        if (!existing) {
          characters.push(await this.characterRepo.save(this.characterRepo.create(char)));
        } else {
          characters.push(existing);
        }
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
        const existing = await this.statusRepo.findOne({ where: { name: status.name } });
        if (!existing) {
          statuses.push(await this.statusRepo.save(this.statusRepo.create(status)));
        } else {
          statuses.push(existing);
        }
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
        const existing = await this.medicamentRepo.findOne({ where: { name: med.name } });
        if (!existing) {
          medicaments.push(await this.medicamentRepo.save(this.medicamentRepo.create(med)));
        } else {
          medicaments.push(existing);
        }
      }
      this.logger.log('Medicaments seeded');

      // 6. Veterinarians
      const veterinariansData = [
        { name: 'Dr. Rakoto', specialty: 'Médecine générale bovine' },
        { name: 'Dr. Ranaivo', specialty: 'Chirurgie et reproduction' },
      ];
      const veterinarians = [];
      for (const vet of veterinariansData) {
        const existing = await this.veterinarianRepo.findOne({ where: { name: vet.name } });
        if (!existing) {
          veterinarians.push(await this.veterinarianRepo.save(this.veterinarianRepo.create(vet)));
        } else {
          veterinarians.push(existing);
        }
      }
      this.logger.log('Veterinarians seeded');

      // 7. Owner
      let owner = await this.ownerRepo.findOne({ where: { name: "Ferme d'Ambatobe" } });
      if (!owner) {
        owner = await this.ownerRepo.save(this.ownerRepo.create({
          name: "Ferme d'Ambatobe",
          contactInfo: '034 00 000 00',
          address: 'Ambatobe, Antananarivo',
        }));
      }
      this.logger.log('Owner seeded');

      // 8. User (Password: admin123)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const existingUser = await this.userRepo.findOne({ where: { email: 'admin@ombiko.mg' } });
      let user;
      if (!existingUser) {
        user = await this.userRepo.save(this.userRepo.create({
          name: 'Admin Ombiko',
          email: 'admin@ombiko.mg',
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          ownerId: owner.id,
        }));
        
        // Create LOCAL auth provider with password hash
        await this.authProviderRepo.save(this.authProviderRepo.create({
          user: user,
          provider: AuthProviderType.LOCAL,
          providerUserId: user.id,
          passwordHash: hashedPassword,
        }));
      } else {
        user = existingUser;
        // Check if LOCAL auth provider exists
        const existingAuthProvider = await this.authProviderRepo.findOne({
          where: { user: { id: user.id }, provider: AuthProviderType.LOCAL }
        });
        if (!existingAuthProvider) {
          await this.authProviderRepo.save(this.authProviderRepo.create({
            user: user,
            provider: AuthProviderType.LOCAL,
            providerUserId: user.id,
            passwordHash: hashedPassword,
          }));
        }
      }
      this.logger.log('User seeded');

      // 9. HerdBook
      const herdBook = await this.herdBookRepo.save(this.herdBookRepo.create({
        reference: 'HB-2024',
        description: 'Livre principal 2024',
        year: 2024,
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
        nCarnet: 123,
        categoryId: categories[4].id,
        statusId: statuses[0].id,
      }));
      await this.herdBookCattleRepo.save(this.herdBookCattleRepo.create({
        herdBookId: herdBook.id,
        cattleId: cattle2.id,
        nCarnet: 456,
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

      // 14. Suppliers
      const suppliersData = [
        { name: 'Alimentation Madagascar', contactInfo: 'contact@alim-mg.mg', phone: '034 22 123 45', ownerId: owner.id },
        { name: 'Pharmacie Vétérinaire Tana', contactInfo: 'info@pharma-vet.mg', phone: '034 22 987 65', ownerId: owner.id },
        { name: 'Ferme Elevage Betsimitatatra', contactInfo: 'ferme@betsi.mg', phone: '034 22 555 66', ownerId: owner.id },
      ];
      for (const supplierData of suppliersData) {
        const existing = await this.supplierRepo.findOne({ where: { name: supplierData.name } });
        if (!existing) {
          await this.supplierRepo.save(this.supplierRepo.create(supplierData));
        }
      }
      this.logger.log('Suppliers seeded');

      this.logger.log('Seeding completed successfully!');
    } catch (error) {
      this.logger.error('Seeding failed', error.stack);
      throw error;
    }
  }
}
