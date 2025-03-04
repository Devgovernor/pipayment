import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    balance?: number;
    webhookUrl?: string;
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
    notificationEvents?: {
      payments?: boolean;
      refunds?: boolean;
      disputes?: boolean;
      settlements?: boolean;
    };
    ipWhitelist?: string[];
    timezone?: string;
    dateFormat?: string;
    defaultCurrency?: string;
  };

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => ApiKey, apiKey => apiKey.merchant)
  apiKeys: ApiKey[];

  @OneToMany(() => Payment, payment => payment.merchant)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}