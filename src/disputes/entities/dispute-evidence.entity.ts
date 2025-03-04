import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Dispute } from './dispute.entity';
import { User } from '../../database/entities/user.entity';

@Entity('dispute_evidence')
export class DisputeEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dispute)
  dispute: Dispute;

  @Column()
  fileUrl: string;

  @Column()
  fileType: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}