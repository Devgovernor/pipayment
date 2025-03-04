import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { PaymentMethod } from './payment-method.entity';
import { Invoice } from '../../invoicing/entities/invoice.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant)
  merchant: Merchant;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => PaymentMethod, method => method.customer)
  paymentMethods: PaymentMethod[];

  @OneToMany(() => Invoice, invoice => invoice.customer)
  invoices: Invoice[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}