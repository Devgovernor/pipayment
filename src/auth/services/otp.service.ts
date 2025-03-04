import { Injectable, NotFoundException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../../notifications/services/email.service';
import { SmsService } from '../../notifications/services/sms.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  verifyOtp(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }

  async enableOtp(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    user.otpSecret = this.generateSecret();
    user.otpEnabled = true;
    return this.userRepository.save(user);
  }

  async disableOtp(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    user.otpSecret = '';
    user.otpEnabled = false;
    return this.userRepository.save(user);
  }

  async sendEmailOtp(email: string, templateId: string): Promise<void> {
    const otp = authenticator.generate(this.generateSecret());
    await this.emailService.sendTemplatedEmail(email, templateId, { otp });
  }

  async sendSmsOtp(phoneNumber: string, templateId: string): Promise<void> {
    const otp = authenticator.generate(this.generateSecret());
    await this.smsService.sendTemplatedSms(phoneNumber, templateId, { otp });
  }
}