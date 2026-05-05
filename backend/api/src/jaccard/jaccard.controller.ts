import { Controller, Get, Param, Query } from '@nestjs/common';
import { JaccardService } from './jaccard.service';

@Controller('suggestions')
export class JaccardController {
  constructor(private readonly jaccardService: JaccardService) {}

  @Get(':userId')
  getSuggestions(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.jaccardService.getSuggestions(
      userId,
      limit ? Number(limit) : undefined,
    );
  }
}
