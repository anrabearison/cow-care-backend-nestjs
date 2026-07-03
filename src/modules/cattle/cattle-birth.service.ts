import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Cattle, Gender, SourceType } from './entities/cattle.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Event as EventEntity } from '../events/entities/event.entity';
import { EventType } from '../event-types/entities/event-type.entity';
import { User } from '../users/entities/user.entity';
import { RegisterBirthDto } from './dto/register-birth.dto';
import { STATUS_ACTIVE_ID } from '../../common/constants/status.constants';

@Injectable()
export class CattleBirthService {
    constructor(
        @InjectRepository(Cattle) private readonly cattleRepo: Repository<Cattle>,
        @InjectRepository(HerdBookCattle) private readonly herdBookCattleRepo: Repository<HerdBookCattle>,
        @InjectRepository(EventEntity) private readonly eventRepo: Repository<EventEntity>,
        private readonly dataSource: DataSource,
    ) {}

    async registerBirth(motherId: string, birthData: RegisterBirthDto, user: User, cattleService: any) {
        return this.dataSource.transaction(async (em: EntityManager) => {
            const mother = await em.findOne(Cattle, { where: { id: motherId } });
            if (!mother || mother.gender !== Gender.F) {
                throw new BadRequestException("Invalid mother or not a female");
            }

            const { character, category, birthEventDate, ...restBirthData } = birthData;

            const calf = em.create(Cattle, {
                ...restBirthData,
                ownerId: user.ownerId,
                characterId: character,
                sourceType: SourceType.NE_DANS_TROUPEAU,
                motherId: motherId,
            } as any) as Cattle;
            await em.save(Cattle, calf);

            const motherEntry = await em.findOne(HerdBookCattle, {
                where: { cattleId: motherId },
                order: { createdAt: 'DESC' }
            });

            if (motherEntry) {
                const entry = em.create(HerdBookCattle, {
                    cattleId: calf.id,
                    herdBookId: motherEntry.herdBookId,
                    categoryId: category,
                    statusId: STATUS_ACTIVE_ID,
                    year: new Date().getFullYear(),
                });
                await em.save(HerdBookCattle, entry);
            }

            // Create birth event for calf
            const birthEventType = await em.findOne(EventType, { where: { name: 'Naissance' } });
            if (birthEventType) {
                const birthEvent = em.create(EventEntity, {
                    cattleId: calf.id,
                    eventTypeId: birthEventType.id,
                    date: birthData.birthDate,
                    description: `Né de ${mother.name} (${motherId})`,
                } as any);
                await em.save(EventEntity, birthEvent);
            }

            // Create calving event for mother
            const calvingEventType = await em.findOne(EventType, { where: { name: 'Vêlage' } });
            if (calvingEventType) {
                const calvingEvent = em.create(EventEntity, {
                    cattleId: motherId,
                    eventTypeId: calvingEventType.id,
                    date: birthData.birthDate,
                    description: `Vêlage : naissance de ${calf.name} (${calf.id})`,
                } as any);
                await em.save(EventEntity, calvingEvent);
            }

            return cattleService.findOne(calf.id, user, em);
        });
    }
}
