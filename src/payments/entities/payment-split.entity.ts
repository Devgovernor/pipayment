import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Merchant } from '../../database/entities/merchant.entity';

@Entity('payment_splits')
export class PaymentSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment)
  payment: Payment;

  @ManyToOne(() => Merchant)
  recipient: Merchant;

  @Column('decimal')
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'decimal', default: 0 })
  feePercentage: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}