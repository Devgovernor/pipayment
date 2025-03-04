import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MarketplaceOrder } from '../entities/marketplace-order.entity';
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { MarketplaceSeller } from '../entities/marketplace-seller.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentsService } from '../../payments/payments.service';
import { ProductService } from './product.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem)
    private readonly orderItemRepository: Repository<MarketplaceOrderItem>,
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly productService: ProductService,
    private readonly notificationService: NotificationService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<MarketplaceOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate and process order items
      let totalAmount = 0;
      const orderItems: Partial<MarketplaceOrderItem>[] = [];

      for (const item of createOrderDto.items) {
        const product = await this.productService.findOne(item.productId);
        
        // Check inventory
        if (product.inventoryCount !== null && product.inventoryCount < item.quantity) {
          throw new BadRequestException(`Insufficient inventory for product ${product.name}`);
        }

        const totalPrice = product.price * item.quantity;
        totalAmount += totalPrice;

        orderItems.push({
          product,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice,
        });

        // Update inventory
        if (product.inventoryCount !== null) {
          await this.productService.updateInventory(product.id, item.quantity);
        }
      }

      // Create payment
      const payment = await this.paymentsService.create({
        amount: totalAmount,
        currency: createOrderDto.currency,
        merchant: createOrderDto.merchant,
        metadata: {
          type: 'marketplace_order',
          ...createOrderDto.metadata,
        },
      });

      // Calculate commission
      const seller = await queryRunner.manager.findOne(MarketplaceSeller, {
        where: { id: createOrderDto.sellerId },
      });

      if (!seller) {
        throw new NotFoundException('Seller not found');
      }

      const commissionAmount = (totalAmount * seller.commissionRate) / 100;
      const sellerAmount = totalAmount - commissionAmount;

      // Create order
      const order = this.orderRepository.create({
        seller,
        payment,
        status: OrderStatus.PENDING,
        totalAmount,
        commissionAmount,
        sellerAmount,
        currency: createOrderDto.currency,
        metadata: createOrderDto.metadata,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items
      for (const item of orderItems) {
        const orderItem = this.orderItemRepository.create({
          ...item,
          order: savedOrder,
        });
        await queryRunner.manager.save(orderItem);
      }

      await queryRunner.commitTransaction();

      // Record metrics
      this.monitoringService.recordMetric('marketplace.order_created', 1, {
        orderId: savedOrder.id,
        sellerId: seller.id,
        amount: totalAmount,
        itemCount: orderItems.length,
      });

      // Send notifications
      await this.notificationService.sendAccountNotification(
        seller.merchant.user,
        'New Order Received',
        `You have received a new order for ${totalAmount} ${createOrderDto.currency}`,
        {
          type: 'new_order',
          orderId: savedOrder.id,
          amount: totalAmount,
        },
      );

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<MarketplaceOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['seller', 'payment', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async findBySeller(sellerId: string): Promise<MarketplaceOrder[]> {
    return this.orderRepository.find({
      where: { seller: { id: sellerId } },
      relations: ['payment', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<MarketplaceOrder> {
    const order = await this.findOne(id);
    order.status = status;
    
    const savedOrder = await this.orderRepository.save(order);

    // Record metric
    this.monitoringService.recordMetric('marketplace.order_status_updated', 1, {
      orderId: id,
      status,
    });

    // Send notification
    await this.notificationService.sendAccountNotification(
      order.seller.merchant.user,
      'Order Status Updated',
      `Order ${id} status has been updated to ${status}`,
      {
        type: 'order_status_update',
        orderId: id,
        status,
      },
    );

    return savedOrder;
  }
}