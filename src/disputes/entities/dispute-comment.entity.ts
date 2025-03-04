import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Dispute } from './dispute.entity';
import { User } from '../../database/entities/user.entity';

@Entity('dispute_comments')
export class DisputeComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dispute)
  dispute: Dispute;

  @ManyToOne(() => User)
  user: User;

  @Column('text')
  comment: string;

  @Column({ default: false })
  internal: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}