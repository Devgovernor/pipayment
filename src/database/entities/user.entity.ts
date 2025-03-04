import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../auth/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.MERCHANT,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  otpSecret: string;

  @Column({ default: false })
  otpEnabled: boolean;

  @Column({ nullable: true })
  tempOtpSecret: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    inAppNotifications?: boolean;
  };

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;
}