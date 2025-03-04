import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { KycStatus } from '../enums/kyc-status.enum';
import { KycDocument } from './kyc-document.entity';
import { Merchant } from '../../database/entities/merchant.entity';

@Entity('kyc_verifications')
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({ type: 'jsonb' })
  businessInfo: {
    registrationNumber: string;
    taxId: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };

  @Column({ type: 'jsonb' })
  representativeInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    position: string;
  };

  @OneToMany(() => KycDocument, document => document.verification, {
    cascade: true,
  })
  documents: KycDocument[];

  @OneToOne(() => Merchant)
  @JoinColumn()
  merchant: Merchant;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}