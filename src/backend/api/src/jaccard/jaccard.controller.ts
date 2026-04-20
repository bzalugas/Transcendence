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

/*@Controller('suggestions') — déclare que toutes les routes de ce controller commencent par /suggestions.

constructor(private readonly jaccardService: JaccardService) — c'est l'injection de dépendances dont on parlait. NestJS injecte automatiquement le service ici.

@Get(':userId') — écoute les requêtes GET /suggestions/:userId. Le :userId est un paramètre dynamique.

@Param('userId', ParseIntPipe) — récupère le :userId dans l'URL et le convertit automatiquement en number (par défaut tout arrive en string depuis l'URL).

@Query('limit') — récupère le paramètre optionnel ?limit=20 dans l'URL */

