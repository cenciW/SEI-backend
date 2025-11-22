import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { CacheService } from './cache.service';

@Module({
  providers: [AIService, CacheService],
  exports: [AIService, CacheService],
})
export class AIModule {}
