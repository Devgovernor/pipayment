import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { MarketplaceSeller } from './marketplace-seller.entity';
import { ProductType } from '../enums/product-type.enum';

@Entity('marketplace_products')
export class MarketplaceProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MarketplaceSeller)
  seller: MarketplaceSeller;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  sku: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type: ProductType;

  @Column({ type: 'int', nullable: true })
  inventoryCount: number;

  @Column({ type: 'jsonb', nullable: true })
  digitalContent: {
    downloadUrl?: string;
    accessInstructions?: string;
    expiryDays?: number;
    maxDownloads?: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}