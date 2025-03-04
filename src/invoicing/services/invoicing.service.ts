import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { Merchant } from '../../database/entities/merchant.entity';
import { CustomersService } from '../../customers/services/customers.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { Role } from '../../auth/enums/role.enum';

@Injectable()
export class InvoicingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly customersService: CustomersService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(merchant: Merchant, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const customer = await this.customersService.findOne(createInvoiceDto.customerId);

    const items = createInvoiceDto.items.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const invoice = this.invoiceRepository.create({
      merchant,
      customer,
      number: await this.generateInvoiceNumber(merchant.id),
      currency: createInvoiceDto.currency,
      dueDate: new Date(createInvoiceDto.dueDate),
      items,
      amount: totalAmount,
      metadata: createInvoiceDto.metadata,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create a mock user object for the customer
    const customerUser = {
      id: customer.id,
      email: customer.email,
      role: Role.MERCHANT,
      isActive: true,
      otpSecret: '',
      otpEnabled: false,
      phoneNumber: customer.phone || '',
      phoneVerified: false,
      settings: {
        emailNotifications: true,
        smsNotifications: true,
        inAppNotifications: true,
      },
      password: '',
      tempOtpSecret: '',
      resetPasswordToken: '',
      resetPasswordExpires: new Date(0),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    // Send notification to customer
    await this.notificationService.sendAccountNotification(
      customerUser,
      'New Invoice',
      `A new invoice (#${savedInvoice.number}) has been created for ${totalAmount} ${createInvoiceDto.currency}`,
      {
        type: 'invoice_created',
        invoiceId: savedInvoice.id,
        amount: totalAmount,
        currency: createInvoiceDto.currency,
      },
    );

    return savedInvoice;
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['merchant', 'customer'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }

    return invoice;
  }

  async findByMerchant(merchantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { merchant: { id: merchantId } },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = status;
    return this.invoiceRepository.save(invoice);
  }

  private async generateInvoiceNumber(merchantId: string): Promise<string> {
    const count = await this.invoiceRepository.count({
      where: { merchant: { id: merchantId } },
    });
    return `INV-${merchantId.slice(0, 8)}-${(count + 1).toString().padStart(6, '0')}`;
  }
}