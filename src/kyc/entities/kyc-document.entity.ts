import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { KycDocumentType } from '../enums/kyc-document-type.enum';
import { KycVerification } from './kyc-verification.entity';

@Entity('kyc_documents')
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: KycDocumentType,
  })
  type: KycDocumentType;

  @Column()
  documentUrl: string;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @ManyToOne(() => KycVerification, verification => verification.documents)
  verification: KycVerification;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}