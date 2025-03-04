import { Controller, Post, Get, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { AddPaymentMethodDto } from '../dto/add-payment-method.dto';
import { Customer } from '../entities/customer.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Customers')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Customer> {
    return this.customersService.create(merchant, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant customers' })
  @ApiResponse({ status: 200, description: 'Return merchant customers' })
  async findMerchantCustomers(
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Customer[]> {
    return this.customersService.findByMerchant(merchant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponse({ status: 200, description: 'Return customer by id' })
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Post(':id/payment-methods')
  @ApiOperation({ summary: 'Add payment method to customer' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  async addPaymentMethod(
    @Param('id') id: string,
    @Body() addPaymentMethodDto: AddPaymentMethodDto,
  ): Promise<PaymentMethod> {
    return this.customersService.addPaymentMethod(id, addPaymentMethodDto);
  }

  @Delete(':customerId/payment-methods/:methodId')
  @ApiOperation({ summary: 'Remove payment method from customer' })
  @ApiResponse({ status: 200, description: 'Payment method removed successfully' })
  async removePaymentMethod(
    @Param('customerId') customerId: string,
    @Param('methodId') methodId: string,
  ): Promise<void> {
    return this.customersService.removePaymentMethod(customerId, methodId);
  }
}