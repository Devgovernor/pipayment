import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';

@Entity('batch_payments')
export class BatchPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant)
  merchant: Merchant;

  @Column()
  fileName: string;

  @Column('decimal')
  totalAmount: number;

  @Column()
  currency: string;

  @Column()
  status: string;

  @Column()
  processedCount: number;

  @Column()
  totalCount: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}