import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { SubscriptionInterval } from '../enums/subscription-interval.enum';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant)
  merchant: Merchant;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: SubscriptionInterval,
  })
  interval: SubscriptionInterval;

  @Column({ type: 'int' })
  intervalCount: number;

  @Column({ type: 'int', nullable: true })
  trialPeriodDays: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}