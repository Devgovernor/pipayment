import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { MarketplaceSeller } from '../entities/marketplace-seller.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductType } from '../enums/product-type.enum';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(MarketplaceProduct)
    private readonly productRepository: Repository<MarketplaceProduct>,
    @InjectRepository(MarketplaceSeller)
    private readonly sellerRepository: Repository<MarketplaceSeller>,
    private readonly monitoringService: MonitoringService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(sellerId: string, createProductDto: CreateProductDto): Promise<MarketplaceProduct> {
    try {
      const seller = await this.sellerRepository.findOne({
        where: { id: sellerId, isActive: true },
        relations: ['merchant'],
      });

      if (!seller) {
        throw new NotFoundException('Seller not found or inactive');
      }

      // Validate digital product requirements
      if (createProductDto.type === ProductType.DIGITAL) {
        if (!createProductDto.digitalContent) {
          throw new BadRequestException('Digital products require digital content information');
        }

        if (!createProductDto.digitalContent.downloadUrl && !createProductDto.digitalContent.accessInstructions) {
          throw new BadRequestException('Digital products must have either a download URL or access instructions');
        }
      }

      // Only physical products can have inventory
      if (createProductDto.type !== ProductType.PHYSICAL && createProductDto.inventoryCount !== undefined) {
        throw new BadRequestException('Only physical products can have inventory');
      }

      const product = this.productRepository.create({
        ...createProductDto,
        seller,
      });

      const savedProduct = await this.productRepository.save(product);

      // Record metric
      this.monitoringService.recordMetric('marketplace.product_created', 1, {
        sellerId,
        productType: createProductDto.type,
        hasInventory: !!createProductDto.inventoryCount,
      });

      // Send notification
      await this.notificationService.sendAccountNotification(
        seller.merchant.user,
        'New Product Added',
        `A new ${createProductDto.type} product "${createProductDto.name}" has been added to your marketplace`,
        {
          type: 'product_added',
          productId: savedProduct.id,
          productType: createProductDto.type,
        },
      );

      return savedProduct;
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findBySeller(sellerId: string): Promise<MarketplaceProduct[]> {
    return this.productRepository.find({
      where: { seller: { id: sellerId }, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MarketplaceProduct> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ['seller'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<MarketplaceProduct> {
    const product = await this.findOne(id);

    // Validate digital product updates
    if (updateProductDto.type === ProductType.DIGITAL) {
      if (updateProductDto.digitalContent) {
        if (!updateProductDto.digitalContent.downloadUrl && !updateProductDto.digitalContent.accessInstructions) {
          throw new BadRequestException('Digital products must have either a download URL or access instructions');
        }
      }
    }

    // Validate inventory updates
    if (updateProductDto.type && updateProductDto.type !== ProductType.PHYSICAL) {
      product.inventoryCount = 0; // Set to 0 instead of undefined/null
    } else if (updateProductDto.inventoryCount !== undefined && updateProductDto.inventoryCount < 0) {
      throw new BadRequestException('Inventory count cannot be negative');
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    // Record metric
    await this.monitoringService.recordMetric('marketplace.product_updated', 1, {
      productId: id,
      productType: product.type,
      hasInventory: !!product.inventoryCount,
    });

    return updatedProduct;
  }

  async deactivate(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);

    // Record metric
    this.monitoringService.recordMetric('marketplace.product_deactivated', 1, {
      productId: id,
      productType: product.type,
    });
  }

  async updateInventory(id: string, quantity: number): Promise<MarketplaceProduct> {
    const product = await this.findOne(id);
    
    if (product.type !== ProductType.PHYSICAL) {
      return product; // Digital products don't need inventory management
    }
    
    if (product.inventoryCount === null) {
      throw new BadRequestException('Product does not track inventory');
    }

    const newInventory = product.inventoryCount - quantity;
    if (newInventory < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    product.inventoryCount = newInventory;
    const updatedProduct = await this.productRepository.save(product);

    // Record metric
    this.monitoringService.recordMetric('marketplace.inventory_updated', 1, {
      productId: id,
      quantityChange: -quantity,
      newInventory,
    });

    // Send low inventory notification
    if (newInventory <= 5) {
      await this.notificationService.sendAccountNotification(
        product.seller.merchant.user,
        'Low Inventory Alert',
        `Product "${product.name}" has low inventory (${newInventory} units remaining)`,
        {
          type: 'low_inventory',
          productId: id,
          inventory: newInventory,
        },
      );
    }

    return updatedProduct;
  }
}