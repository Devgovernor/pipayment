import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { VirtualTerminalService } from '../services/virtual-terminal.service';
import { VirtualTerminalPaymentDto } from '../dto/virtual-terminal-payment.dto';
import { Payment } from '../../database/entities/payment.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Virtual Terminal')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/virtual-terminal')
export class VirtualTerminalController {
  constructor(private readonly virtualTerminalService: VirtualTerminalService) {}

  @Post('payments')
  @ApiOperation({ summary: 'Process virtual terminal payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(
    @Body() paymentDto: VirtualTerminalPaymentDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Payment> {
    return this.virtualTerminalService.processPayment(merchant, paymentDto);
  }
}