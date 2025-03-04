import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import DeviceDetector from 'device-detector-js';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class DeviceFingerprintService {
  private readonly logger = new Logger(DeviceFingerprintService.name);
  private readonly deviceDetector = new DeviceDetector();

  constructor(private readonly monitoringService: MonitoringService) {}

  generateFingerprint(requestData: {
    userAgent: string;
    ip: string;
    headers: Record<string, string>;
  }): string {
    try {
      const device = this.deviceDetector.parse(requestData.userAgent);
      
      const fingerprintData = {
        ip: requestData.ip,
        device: {
          type: device.device?.type,
          brand: device.device?.brand,
          model: device.device?.model,
        },
        os: {
          name: device.os?.name,
          version: device.os?.version,
        },
        client: {
          type: device.client?.type,
          name: device.client?.name,
          version: device.client?.version,
        },
        headers: {
          accept: requestData.headers['accept'],
          language: requestData.headers['accept-language'],
          encoding: requestData.headers['accept-encoding'],
        },
      };

      const fingerprint = createHash('sha256')
        .update(JSON.stringify(fingerprintData))
        .digest('hex');

      this.monitoringService.recordMetric('fraud.fingerprint_generated', 1, {
        deviceType: device.device?.type,
        osName: device.os?.name,
      });

      return fingerprint;
    } catch (error) {
      this.logger.error(`Failed to generate device fingerprint: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('fraud.fingerprint_error', 1);
      return '';
    }
  }

  async calculateDeviceTrustScore(fingerprint: string): Promise<number> {
    try {
      // TODO: Implement device trust scoring based on:
      // - Historical behavior
      // - Successful transaction rate
      // - Age of first seen
      // - Geographical patterns
      return 0.5; // Default moderate trust score
    } catch (error) {
      this.logger.error(`Failed to calculate device trust score: ${error.message}`, error.stack);
      return 0;
    }
  }
}