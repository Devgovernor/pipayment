import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { SecurityUtils } from '../../common/utils/security.utils';

@Injectable()
export class MerchantProfileService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(merchantId: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return merchant;
  }

  async updateProfile(merchantId: string, updateProfileDto: UpdateProfileDto): Promise<Merchant> {
    const merchant = await this.getProfile(merchantId);
    Object.assign(merchant, updateProfileDto);
    return this.merchantRepository.save(merchant);
  }

  async updatePassword(merchantId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const merchant = await this.getProfile(merchantId);
    const user = await this.userRepository.findOne({
      where: { id: merchant.user.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const [currentHash, currentSalt] = user.password.split(':');
    const isValid = SecurityUtils.verifyPassword(
      updatePasswordDto.currentPassword,
      currentHash,
      currentSalt,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    const { hash, salt } = SecurityUtils.hashPassword(updatePasswordDto.newPassword);
    user.password = `${hash}:${salt}`;
    await this.userRepository.save(user);
  }
}