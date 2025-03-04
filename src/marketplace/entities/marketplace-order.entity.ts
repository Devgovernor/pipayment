import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { MarketplaceSeller } from './marketplace-seller.entity';
import { Payment } from '../../database/entities/payment.entity';
import { MarketplaceOrderItem } from './marketplace-order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('marketplace_orders')
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment)
  payment: Payment;

  @ManyToOne(() => MarketplaceSeller)
  seller: MarketplaceSeller;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column('decimal')
  totalAmount: number;

  @Column('decimal')
  commissionAmount: number;

  @Column('decimal')
  sellerAmount: number;

  @Column()
  currency: string;

  @OneToMany(() => MarketplaceOrderItem, item => item.order, {
    cascade: true,
  })
  items: MarketplaceOrderItem[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}