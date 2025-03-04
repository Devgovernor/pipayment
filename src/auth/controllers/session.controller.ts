import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SessionService } from '../services/session.service';
import { Session } from '../entities/session.entity';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Auth - Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Return active sessions' })
  async getActiveSessions(@User() user: any): Promise<Session[]> {
    return this.sessionService.getActiveSessions(user.id);
  }

  @Post(':id/invalidate')
  @ApiOperation({ summary: 'Invalidate session' })
  @ApiResponse({ status: 200, description: 'Session invalidated successfully' })
  async invalidateSession(@Param('id') id: string): Promise<void> {
    return this.sessionService.invalidateSession(id);
  }
}