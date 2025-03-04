import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column()
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string | null;

  @Column()
  userAgent: string;

  @CreateDateColumn()
  timestamp: Date;
}