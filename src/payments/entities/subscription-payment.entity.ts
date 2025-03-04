import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Subscription } from './subscription.entity';

@Entity('subscription_payments')
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription)
  subscription: Subscription;

  @ManyToOne(() => Payment)
  payment: Payment;

  @Column()
  billingPeriodStart: Date;

  @Column()
  billingPeriodEnd: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}