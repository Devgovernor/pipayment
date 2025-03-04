import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { User } from '../database/entities/user.entity';
import { ApiKey } from '../database/entities/api-key.entity';
import { Merchant } from '../database/entities/merchant.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Role } from './enums/role.enum';
import { NotificationService } from '../notifications/services/notification.service';
import { EmailService } from '../notifications/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  private hashPassword(password: string, salt: string = randomBytes(16).toString('hex')): { hash: string; salt: string } {
    const hash = createHash('sha256')
      .update(salt + password)
      .digest('hex');
    return { hash, salt };
  }

  private verifyPassword(password: string, hash: string, salt: string): boolean {
    const inputHash = createHash('sha256')
      .update(salt + password)
      .digest('hex');
    return timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && user.isActive) {
      const [storedHash, storedSalt] = user.password.split(':');
      if (this.verifyPassword(password, storedHash, storedSalt)) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create merchant
    const merchant = this.merchantRepository.create({
      businessName: registerDto.businessName,
      email: registerDto.email,
      phone: registerDto.phone,
    });
    await this.merchantRepository.save(merchant);

    // Create user
    const { hash, salt } = this.hashPassword(registerDto.password);
    const password = `${hash}:${salt}`;

    const user = this.userRepository.create({
      email: registerDto.email,
      password,
      role: Role.MERCHANT,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create initial API key
    const apiKey = this.apiKeyRepository.create({
      name: 'Default API Key',
      key: this.generateApiKey(),
      merchant,
    });
    await this.apiKeyRepository.save(apiKey);

    // Send welcome email
    await this.emailService.sendTemplatedEmail(
      user.email,
      'welcome',
      {
        businessName: merchant.businessName,
        apiKey: apiKey.key,
      },
    );

    return {
      access_token: this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      }),
      api_key: apiKey.key,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await this.userRepository.save(user);

    await this.emailService.sendTemplatedEmail(
      email,
      'reset-password',
      {
        resetToken,
        expiryTime: tokenExpiry.toISOString(),
      },
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const { hash, salt } = this.hashPassword(newPassword);
    user.password = `${hash}:${salt}`;
    user.resetPasswordToken = '';
    user.resetPasswordExpires = new Date(0);
    await this.userRepository.save(user);
  }

  private generateApiKey(): string {
    return randomBytes(32).toString('hex');
  }

  async createAdmin(createAdminDto: CreateAdminDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (createAdminDto.role === Role.MERCHANT) {
      throw new UnauthorizedException('Cannot create merchant users through this endpoint');
    }

    const { hash, salt } = this.hashPassword(createAdminDto.password);
    const password = `${hash}:${salt}`;

    const user = this.userRepository.create({
      ...createAdminDto,
      password,
      isActive: true,
      settings: {
        emailNotifications: true,
        smsNotifications: true,
        inAppNotifications: true,
      },
    });

    const savedUser = await this.userRepository.save(user);

    await this.notificationService.sendAccountNotification(
      savedUser,
      'Welcome to the Admin Team',
      `Your admin account has been created with role: ${createAdminDto.role}`,
      {
        role: createAdminDto.role,
        type: 'admin_creation',
      },
    );

    return savedUser;
  }

  async findAllAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { role: Role.ADMIN },
        { role: Role.SUPER_ADMIN },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.userRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role === Role.SUPER_ADMIN) {
      throw new UnauthorizedException('Cannot delete super admin');
    }

    await this.userRepository.remove(admin);
  }

  async updateMerchantVerification(id: string, verified: boolean): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    merchant.isVerified = verified;
    const savedMerchant = await this.merchantRepository.save(merchant);

    await this.notificationService.sendAccountNotification(
      merchant.user,
      'Verification Status Updated',
      `Your merchant account has been ${verified ? 'verified' : 'unverified'}`,
      {
        type: 'verification_update',
        verified,
      },
    );

    return savedMerchant;
  }

  async updateMerchantSuspension(id: string, suspended: boolean): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    merchant.isActive = !suspended;
    const savedMerchant = await this.merchantRepository.save(merchant);

    await this.notificationService.sendAccountNotification(
      merchant.user,
      'Account Status Updated',
      `Your merchant account has been ${suspended ? 'suspended' : 'reactivated'}`,
      {
        type: 'suspension_update',
        suspended,
      },
    );

    return savedMerchant;
  }

  async adjustMerchantBalance(merchantId: string, amount: number): Promise<void> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID "${merchantId}" not found`);
    }

    const currentBalance = merchant.settings?.balance || 0;
    const newBalance = currentBalance + amount;

    await this.merchantRepository.update(merchantId, {
      settings: {
        ...merchant.settings,
        balance: newBalance,
      },
    });

    if (merchant.user) {
      await this.notificationService.sendTransactionNotification(
        merchant.user,
        'Balance Adjustment',
        `Your account balance has been ${amount >= 0 ? 'credited with' : 'debited by'} ${Math.abs(amount)} PI`,
        {
          amount,
          previousBalance: currentBalance,
          newBalance,
          type: 'balance_adjustment',
        },
      );
    }
  }

  async impersonate(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        impersonated: true,
      }),
    };
  }

  async validateApiKey(apiKey: string): Promise<ApiKey | undefined> {
    const key = await this.apiKeyRepository.findOne({
      where: { key: apiKey, isActive: true },
      relations: ['merchant'],
    });

    if (!key || (key.expiresAt && key.expiresAt < new Date())) {
      return undefined;
    }

    await this.apiKeyRepository.update(key.id, {
      lastUsedAt: new Date(),
    });

    return key;
  }
}