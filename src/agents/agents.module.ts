import { Module } from '@nestjs/common';
import { PrologService } from './prolog/prolog.service';
import { AgentsController } from './agents.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  providers: [PrologService],
  controllers: [AgentsController],
})
export class AgentsModule {}
