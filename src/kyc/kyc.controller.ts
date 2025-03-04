import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { CreateKycVerificationDto } from './dto/create-kyc-verification.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { KycVerification } from './entities/kyc-verification.entity';

@ApiTags('Admin - KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('merchants/:merchantId/verification')
  @ApiOperation({ summary: 'Create KYC verification for merchant' })
  @ApiResponse({ status: 201, description: 'KYC verification created successfully' })
  async create(
    @Param('merchantId') merchantId: string,
    @Body() createKycVerificationDto: CreateKycVerificationDto,
  ): Promise<KycVerification> {
    return this.kycService.create(merchantId, createKycVerificationDto);
  }

  @Get('verifications')
  @ApiOperation({ summary: 'Get all KYC verifications' })
  @ApiResponse({ status: 200, description: 'Return all KYC verifications' })
  async findAll(): Promise<KycVerification[]> {
    return this.kycService.findAll();
  }

  @Get('verifications/:id')
  @ApiOperation({ summary: 'Get KYC verification by id' })
  @ApiResponse({ status: 200, description: 'Return KYC verification by id' })
  async findOne(@Param('id') id: string): Promise<KycVerification> {
    return this.kycService.findOne(id);
  }

  @Patch('verifications/:id/status')
  @ApiOperation({ summary: 'Update KYC verification status' })
  @ApiResponse({ status: 200, description: 'KYC verification status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateKycStatusDto: UpdateKycStatusDto,
  ): Promise<KycVerification> {
    return this.kycService.updateStatus(id, updateKycStatusDto);
  }
}