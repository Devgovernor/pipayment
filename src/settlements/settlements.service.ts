import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from './entities/settlement.entity';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementStatus } from './enums/settlement-status.enum';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
  ) {}

  async create(createSettlementDto: CreateSettlementDto): Promise<Settlement> {
    const settlement = this.settlementRepository.create({
      ...createSettlementDto,
      status: SettlementStatus.PENDING,
    });
    return this.settlementRepository.save(settlement);
  }

  async findAll(): Promise<Settlement[]> {
    return this.settlementRepository.find({
      relations: ['merchant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement with ID "${id}" not found`);
    }

    return settlement;
  }

  async updateStatus(id: string, status: SettlementStatus): Promise<Settlement> {
    const settlement = await this.findOne(id);
    settlement.status = status;
    return this.settlementRepository.save(settlement);
  }
}