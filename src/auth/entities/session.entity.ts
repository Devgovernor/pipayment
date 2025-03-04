import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'jsonb' })
  deviceInfo: Record<string, any>;

  @Column({ type: 'inet' })
  ipAddress: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz' })
  lastActivity: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}