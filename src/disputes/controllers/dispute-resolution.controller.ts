import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DisputeResolutionService } from '../services/dispute-resolution.service';
import { DisputesService } from '../disputes.service';
import { User } from '../../common/decorators/user.decorator';
import { SubmitEvidenceDto } from '../dto/submit-evidence.dto';
import { AddCommentDto } from '../dto/add-comment.dto';
import { DisputeEvidence } from '../entities/dispute-evidence.entity';
import { DisputeComment } from '../entities/dispute-comment.entity';
import { DisputeHistory } from '../entities/dispute-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('Admin - Dispute Resolution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/disputes')
export class DisputeResolutionController {
  constructor(
    private readonly disputeResolutionService: DisputeResolutionService,
    private readonly disputesService: DisputesService,
    @InjectRepository(DisputeEvidence)
    private readonly evidenceRepository: Repository<DisputeEvidence>,
    @InjectRepository(DisputeComment)
    private readonly commentRepository: Repository<DisputeComment>,
    @InjectRepository(DisputeHistory)
    private readonly historyRepository: Repository<DisputeHistory>,
  ) {}

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Submit dispute evidence' })
  @ApiResponse({ status: 201, description: 'Evidence submitted successfully' })
  async submitEvidence(
    @Param('id') id: string,
    @Body() submitEvidenceDto: SubmitEvidenceDto,
    @User() user: any,
  ): Promise<DisputeEvidence> {
    const dispute = await this.disputesService.findOne(id);
    return this.disputeResolutionService.submitEvidence(dispute, user, submitEvidenceDto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add dispute comment' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  async addComment(
    @Param('id') id: string,
    @Body() addCommentDto: AddCommentDto,
    @User() user: any,
  ): Promise<DisputeComment> {
    const dispute = await this.disputesService.findOne(id);
    return this.disputeResolutionService.addComment(
      dispute,
      user,
      addCommentDto.comment,
      addCommentDto.internal,
    );
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Get dispute evidence' })
  @ApiResponse({ status: 200, description: 'Return dispute evidence' })
  async getEvidence(@Param('id') id: string): Promise<DisputeEvidence[]> {
    const dispute = await this.disputesService.findOne(id);
    return this.evidenceRepository.find({
      where: { dispute: { id: dispute.id } },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get dispute comments' })
  @ApiResponse({ status: 200, description: 'Return dispute comments' })
  async getComments(@Param('id') id: string): Promise<DisputeComment[]> {
    const dispute = await this.disputesService.findOne(id);
    return this.commentRepository.find({
      where: { dispute: { id: dispute.id } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get dispute history' })
  @ApiResponse({ status: 200, description: 'Return dispute history' })
  async getHistory(@Param('id') id: string): Promise<DisputeHistory[]> {
    const dispute = await this.disputesService.findOne(id);
    return this.historyRepository.find({
      where: { dispute: { id: dispute.id } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}