import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { JaccardService } from './jaccard.service';

@Controller('suggestions')
export class JaccardController {
  constructor(private readonly jaccardService: JaccardService) {}

  @Get(':userId')
  getSuggestions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
  ) {
    return this.jaccardService.getSuggestions(userId, limit);
  }
}

