import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Dispute } from './dispute.entity';
import { User } from '../../database/entities/user.entity';
import { DisputeStatus } from '../enums/dispute-status.enum';

@Entity('dispute_history')
export class DisputeHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dispute)
  dispute: Dispute;

  @ManyToOne(() => User)
  user: User;

  @Column()
  action: string;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    nullable: true,
  })
  oldStatus: DisputeStatus;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    nullable: true,
  })
  newStatus: DisputeStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}