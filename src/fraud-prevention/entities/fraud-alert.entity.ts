import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';

export enum FraudAlertType {
  SUSPICIOUS_AMOUNT = 'suspicious_amount',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  UNUSUAL_LOCATION = 'unusual_location',
  VELOCITY_CHECK = 'velocity_check',
}

@Entity('fraud_alerts')
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FraudAlertType,
  })
  type: FraudAlertType;

  @Column()
  description: string;

  @ManyToOne(() => Payment)
  payment: Payment;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  resolved: boolean;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolution: string;

  @CreateDateColumn()
  createdAt: Date;
}