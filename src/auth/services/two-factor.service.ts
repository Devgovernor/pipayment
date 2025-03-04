import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { User } from '../../database/entities/user.entity';
import { Merchant } from '../../database/entities/merchant.entity';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async enable(merchantId: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      merchant.email,
      'Pi Payment Gateway',
      secret,
    );

    // Store secret temporarily
    merchant.user.tempOtpSecret = secret;
    await this.userRepository.save(merchant.user);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpAuthUrl);

    return {
      secret,
      qrCode,
    };
  }

  async verify(merchantId: string, token: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const isValid = authenticator.verify({
      token,
      secret: merchant.user.tempOtpSecret || '',
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Activate 2FA
    merchant.user.otpSecret = merchant.user.tempOtpSecret || '';
    merchant.user.tempOtpSecret = '';
    merchant.user.otpEnabled = true;
    await this.userRepository.save(merchant.user);

    return { message: '2FA enabled successfully' };
  }

  async disable(merchantId: string, token: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const isValid = authenticator.verify({
      token,
      secret: merchant.user.otpSecret || '',
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Disable 2FA
    merchant.user.otpSecret = '';
    merchant.user.otpEnabled = false;
    await this.userRepository.save(merchant.user);

    return { message: '2FA disabled successfully' };
  }

  async validateToken(user: User, token: string): Promise<boolean> {
    if (!user.otpEnabled) {
      return true;
    }

    return authenticator.verify({
      token,
      secret: user.otpSecret || '',
    });
  }
}