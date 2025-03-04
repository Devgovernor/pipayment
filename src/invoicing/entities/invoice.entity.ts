import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { CurrencyCode } from '../enums/currency-code.enum';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant)
  merchant: Merchant;

  @ManyToOne(() => Customer)
  customer: Customer;

  @Column()
  number: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column('decimal')
  amount: number;

  @Column({
    type: 'enum',
    enum: CurrencyCode,
  })
  currency: CurrencyCode;

  @Column()
  dueDate: Date;

  @Column({ type: 'jsonb' })
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}