import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';

@Entity('checkout_templates')
export class CheckoutTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant)
  merchant: Merchant;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  template: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    logo?: {
      url: string;
      position: 'left' | 'center' | 'right';
    };
    layout: {
      type: 'single-page' | 'multi-step';
      steps?: string[];
    };
    customFields: {
      name: string;
      type: 'text' | 'email' | 'phone' | 'select' | 'checkbox';
      label: string;
      required: boolean;
      options?: string[];
    }[];
    buttons: {
      text: string;
      style: 'filled' | 'outlined';
    };
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}