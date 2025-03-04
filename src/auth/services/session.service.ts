import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(user: User, deviceInfo: any, ip: string): Promise<Session> {
    const session = this.sessionRepository.create({
      user,
      deviceInfo,
      ipAddress: ip,
      lastActivity: new Date(),
    });
    return this.sessionRepository.save(session);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      isActive: false,
      endedAt: new Date(),
    });
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        user: { id: userId },
        isActive: true,
      },
      order: { lastActivity: 'DESC' },
    });
  }
}