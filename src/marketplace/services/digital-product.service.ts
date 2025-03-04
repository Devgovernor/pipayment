import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { sign, verify } from 'jsonwebtoken';
import { createHash } from 'crypto';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { MarketplaceOrder } from '../entities/marketplace-order.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class DigitalProductService {
  private readonly logger = new Logger(DigitalProductService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateLicenseKey(product: MarketplaceProduct, order: MarketplaceOrder): Promise<string> {
    const randomKey = randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(`${randomKey}${order.id}${product.id}`)
      .digest('hex')
      .substring(0, 6);
    
    return `${randomKey.match(/.{1,4}/g)?.join('-')}-${hash}`;
  }

  async generateAccessToken(
    product: MarketplaceProduct,
    order: MarketplaceOrder,
    downloadId: string,
  ): Promise<string> {
    const payload = {
      productId: product.id,
      orderId: order.id,
      downloadId,
      exp: Math.floor(Date.now() / 1000) + (product.digitalContent?.expiryDays || 30) * 24 * 60 * 60,
    };

    const secret = this.configService.get<string>('app.jwt.secret');
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    return sign(payload, secret);
  }

  async verifyAccessToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('app.jwt.secret');
      if (!secret) {
        throw new Error('JWT secret not configured');
      }

      return verify(token, secret);
    } catch (error) {
      this.logger.error(`Error verifying access token: ${error.message}`);
      return null;
    }
  }

  async addWatermark(
    imageBuffer: Buffer,
    watermarkText: string,
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }

      // Create watermark SVG
      const watermarkSvg = Buffer.from(`
        <svg width="${metadata.width}" height="${metadata.height}">
          <style>
            .watermark { fill: rgba(255,255,255,0.5); font-family: Arial; font-size: 24px; }
          </style>
          <text x="50%" y="50%" text-anchor="middle" class="watermark">${watermarkText}</text>
        </svg>
      `);

      return image
        .composite([
          {
            input: watermarkSvg,
            top: 0,
            left: 0,
          },
        ])
        .toBuffer();
    } catch (error) {
      this.logger.error(`Error adding watermark: ${error.message}`);
      throw error;
    }
  }

  async generatePreviewContent(product: MarketplaceProduct): Promise<any> {
    return {
      title: product.name,
      description: product.description,
      previewUrl: product.digitalContent?.downloadUrl
        ? `${product.digitalContent.downloadUrl}?preview=true`
        : null,
      sampleContent: product.metadata?.sampleContent || null,
    };
  }

  async trackDownload(
    product: MarketplaceProduct,
    order: MarketplaceOrder,
    downloadId: string,
  ): Promise<boolean> {
    try {
      const maxDownloads = product.digitalContent?.maxDownloads;
      const downloads = order.metadata?.downloads || [];

      if (maxDownloads && downloads.length >= maxDownloads) {
        return false;
      }

      // Record download
      order.metadata = {
        ...order.metadata,
        downloads: [
          ...downloads,
          {
            id: downloadId,
            timestamp: new Date().toISOString(),
            ip: order.metadata?.customerIp,
            userAgent: order.metadata?.customerUserAgent,
          },
        ],
      };

      return true;
    } catch (error) {
      this.logger.error(`Error tracking download: ${error.message}`);
      return false;
    }
  }
}