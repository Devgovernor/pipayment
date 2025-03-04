import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { MarketplaceOrder } from './marketplace-order.entity';
import { MarketplaceProduct } from './marketplace-product.entity';

@Entity('marketplace_order_items')
export class MarketplaceOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MarketplaceOrder)
  order: MarketplaceOrder;

  @ManyToOne(() => MarketplaceProduct)
  product: MarketplaceProduct;

  @Column()
  quantity: number;

  @Column('decimal')
  unitPrice: number;

  @Column('decimal')
  totalPrice: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}