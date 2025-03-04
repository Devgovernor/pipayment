import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { AddPaymentMethodDto } from '../dto/add-payment-method.dto';
import { Merchant } from '../../database/entities/merchant.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(merchant: Merchant, createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findOne({
      where: {
        merchant: { id: merchant.id },
        email: createCustomerDto.email,
      },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      merchant,
    });

    return this.customerRepository.save(customer);
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['paymentMethods', 'invoices'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return customer;
  }

  async findByMerchant(merchantId: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { merchant: { id: merchantId } },
      relations: ['paymentMethods'],
      order: { createdAt: 'DESC' },
    });
  }

  async addPaymentMethod(
    customerId: string,
    addPaymentMethodDto: AddPaymentMethodDto,
  ): Promise<PaymentMethod> {
    const customer = await this.findOne(customerId);

    if (addPaymentMethodDto.isDefault) {
      // Update existing default payment methods
      await this.paymentMethodRepository.update(
        { customer: { id: customerId }, isDefault: true },
        { isDefault: false },
      );
    }

    const paymentMethod = this.paymentMethodRepository.create({
      ...addPaymentMethodDto,
      customer,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async removePaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: {
        id: paymentMethodId,
        customer: { id: customerId },
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    await this.paymentMethodRepository.remove(paymentMethod);
  }
}