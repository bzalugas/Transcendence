import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from '../../lib/auth';
import { InterestsService } from './interests.service';

@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  // Returns the complete interest catalog used by the frontend picker.
  @Get()
  findAll() {
    return this.interestsService.findAll();
  }

  // Returns the interests attached to the current better-auth session user.
  @Get('me')
  async findMine(@Req() req: Request) {
    const userId = await this.getSessionUserId(req);
    return this.interestsService.findForUser(userId);
  }

  // Adds one interest to the current better-auth session user.
  @Post('me/:interestId')
  async joinMine(
    @Req() req: Request,
    @Param('interestId', ParseIntPipe) interestId: number,
  ) {
    const userId = await this.getSessionUserId(req);
    return this.interestsService.joinForUser(userId, interestId);
  }

  private async getSessionUserId(req: Request): Promise<string> {
    const session = await auth.api.getSession({
      headers: this.toHeaders(req),
    });

    if (!session?.user?.id) {
      throw new UnauthorizedException('Authentication required');
    }

    return session.user.id;
  }

  private toHeaders(req: Request): Headers {
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    }

    return headers;
  }
}
