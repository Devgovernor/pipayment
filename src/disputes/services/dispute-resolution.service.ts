import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Dispute } from '../entities/dispute.entity';
import { DisputeEvidence } from '../entities/dispute-evidence.entity';
import { DisputeComment } from '../entities/dispute-comment.entity';
import { DisputeHistory } from '../entities/dispute-history.entity';
import { DisputeStatus } from '../enums/dispute-status.enum';
import { User } from '../../database/entities/user.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { DateUtils } from '../../common/utils/date.utils';
import { Role } from '../../auth/enums/role.enum';

@Injectable()
export class DisputeResolutionService {
  private readonly logger = new Logger(DisputeResolutionService.name);
  private readonly SYSTEM_USER: User = {
    id: 'system',
    email: 'system@pipaymentgateway.com',
    password: '',
    role: Role.ADMIN,
    isActive: true,
    otpSecret: '',
    otpEnabled: false,
    phoneNumber: '',
    phoneVerified: false,
    settings: {},
    tempOtpSecret: '',
    resetPasswordToken: '',
    resetPasswordExpires: new Date(0),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    @InjectRepository(DisputeEvidence)
    private readonly evidenceRepository: Repository<DisputeEvidence>,
    @InjectRepository(DisputeComment)
    private readonly commentRepository: Repository<DisputeComment>,
    @InjectRepository(DisputeHistory)
    private readonly historyRepository: Repository<DisputeHistory>,
    private readonly notificationService: NotificationService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async submitEvidence(
    dispute: Dispute,
    user: User,
    evidence: {
      fileUrl: string;
      fileType: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<DisputeEvidence> {
    try {
      const disputeEvidence = this.evidenceRepository.create({
        dispute,
        uploadedBy: user,
        ...evidence,
      });

      const savedEvidence = await this.evidenceRepository.save(disputeEvidence);

      // Update dispute status
      if (user.id === dispute.payment.merchant.user.id) {
        dispute.merchantEvidenceSubmitted = true;
      } else {
        dispute.customerEvidenceSubmitted = true;
      }
      await this.disputeRepository.save(dispute);

      // Record history
      await this.recordHistory(dispute, user, 'evidence_submitted', {
        evidenceId: savedEvidence.id,
      });

      // Send notification
      await this.notificationService.sendAccountNotification(
        dispute.payment.merchant.user,
        'Evidence Submitted',
        `New evidence has been submitted for dispute ${dispute.id}`,
        {
          type: 'dispute_evidence',
          disputeId: dispute.id,
          evidenceId: savedEvidence.id,
        },
      );

      // Record metric
      this.monitoringService.recordMetric('dispute.evidence_submitted', 1, {
        disputeId: dispute.id,
        fileType: evidence.fileType,
      });

      return savedEvidence;
    } catch (error) {
      this.logger.error(`Failed to submit evidence: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addComment(
    dispute: Dispute,
    user: User,
    comment: string,
    internal: boolean = false,
  ): Promise<DisputeComment> {
    try {
      const disputeComment = this.commentRepository.create({
        dispute,
        user,
        comment,
        internal,
      });

      const savedComment = await this.commentRepository.save(disputeComment);

      // Record history
      await this.recordHistory(dispute, user, 'comment_added', {
        commentId: savedComment.id,
        internal,
      });

      // Send notification if not internal
      if (!internal) {
        await this.notificationService.sendAccountNotification(
          dispute.payment.merchant.user,
          'New Dispute Comment',
          `A new comment has been added to dispute ${dispute.id}`,
          {
            type: 'dispute_comment',
            disputeId: dispute.id,
            commentId: savedComment.id,
          },
        );
      }

      return savedComment;
    } catch (error) {
      this.logger.error(`Failed to add comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateStatus(
    dispute: Dispute,
    user: User | null,
    newStatus: DisputeStatus,
    resolution?: string,
  ): Promise<Dispute> {
    try {
      const oldStatus = dispute.status;
      dispute.status = newStatus;

      if (resolution) {
        dispute.resolution = resolution;
      }

      if (newStatus === DisputeStatus.RESOLVED) {
        dispute.resolvedAt = new Date();
      }

      const savedDispute = await this.disputeRepository.save(dispute);

      // Record history
      await this.recordHistory(dispute, user || this.SYSTEM_USER, 'status_updated', {
        oldStatus,
        newStatus,
        resolution,
      });

      // Send notification
      await this.notificationService.sendAccountNotification(
        dispute.payment.merchant.user,
        'Dispute Status Updated',
        `The status of dispute ${dispute.id} has been updated to ${newStatus}`,
        {
          type: 'dispute_status',
          disputeId: dispute.id,
          oldStatus,
          newStatus,
        },
      );

      // Record metric
      await this.monitoringService.recordMetric('dispute.status_updated', 1, {
        disputeId: dispute.id,
        oldStatus,
        newStatus,
      });

      return savedDispute;
    } catch (error) {
      this.logger.error(`Failed to update status: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async recordHistory(
    dispute: Dispute,
    user: User,
    action: string,
    metadata?: Record<string, any>,
  ): Promise<DisputeHistory> {
    const history = this.historyRepository.create({
      dispute,
      user,
      action,
      metadata,
    });

    return this.historyRepository.save(history);
  }

  async checkEvidenceDeadlines(): Promise<void> {
    try {
      const disputes = await this.disputeRepository.find({
        where: {
          status: DisputeStatus.UNDER_REVIEW,
          evidenceDueDate: LessThan(new Date()),
        },
        relations: ['payment', 'payment.merchant', 'payment.merchant.user'],
      });

      for (const dispute of disputes) {
        // Auto-resolve disputes past evidence deadline
        if (!dispute.merchantEvidenceSubmitted) {
          await this.updateStatus(
            dispute,
            null, // System action
            DisputeStatus.RESOLVED,
            'Resolved in favor of customer due to no merchant response',
          );
        }

        // Send reminder notifications
        const daysUntilDue = DateUtils.addDays(dispute.evidenceDueDate, -1);
        if (daysUntilDue.getTime() === new Date().getTime()) {
          await this.notificationService.sendAccountNotification(
            dispute.payment.merchant.user,
            'Evidence Deadline Reminder',
            `The evidence deadline for dispute ${dispute.id} is tomorrow`,
            {
              type: 'dispute_reminder',
              disputeId: dispute.id,
              dueDate: dispute.evidenceDueDate.toISOString(),
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check evidence deadlines: ${error.message}`, error.stack);
    }
  }
}