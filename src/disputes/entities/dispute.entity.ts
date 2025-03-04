import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { DisputeStatus } from '../enums/dispute-status.enum';
import { DisputeReason } from '../enums/dispute-reason.enum';

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DisputeReason,
  })
  reason: DisputeReason;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @ManyToOne(() => Payment)
  payment: Payment;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ nullable: true })
  evidenceDueDate: Date;

  @Column({ default: false })
  merchantEvidenceSubmitted: boolean;

  @Column({ default: false })
  customerEvidenceSubmitted: boolean;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}