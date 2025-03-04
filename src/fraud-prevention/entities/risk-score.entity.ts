import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';

@Entity('risk_scores')
export class RiskScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment)
  payment: Payment;

  @Column('float')
  score: number;

  @Column({ type: 'jsonb' })
  factors: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}