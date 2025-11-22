import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PrologService } from './prolog/prolog.service';
import { AIService } from '../ai/ai.service';
import { CacheService } from '../ai/cache.service';

@Controller('agents')
export class AgentsController {
  // Force restart for KB update
  constructor(
    private readonly prologService: PrologService,
    private readonly aiService: AIService,
    private readonly cacheService: CacheService,
  ) {}

  @Post('sensor')
  async updateSensor(@Body() body: { location: string; type: string; value: number }) {
    // sensor(Type, Location, Value)
    
    // Retract previous sensor reading for this type/location to avoid stale data
    const retract = `retractall(sensor('${body.type}', '${body.location}', _))`;
    await this.prologService.query(retract);

    // Quote atoms to handle uppercase inputs (which would otherwise be variables)
    const fact = `sensor('${body.type}', '${body.location}', ${body.value})`;
    console.log(`Asserting: ${fact}`);
    await this.prologService.assertFact(fact);
    return { status: 'success', fact };
  }

  @Post('context')
  async updateContext(@Body() body: { location: string; mode: 'field' | 'pot'; size?: number }) {
    // planting_mode(Location, Mode, Size)
    // Retract previous mode for this location first (to avoid duplicates)
    const retract = `retractall(planting_mode('${body.location}', _, _))`;
    await this.prologService.query(retract);

    const size = body.size || 0;
    const fact = `planting_mode('${body.location}', ${body.mode}, ${size})`;
    console.log(`Asserting Context: ${fact}`);
    await this.prologService.assertFact(fact);
    return { status: 'success', fact };
  }

  @Post('stage')
  async updateStage(@Body() body: { location: string; stage: 'vegetative' | 'blooming' | 'seedling'; week: number }) {
    // plant_stage(Location, Stage, Week)
    const retract = `retractall(plant_stage('${body.location}', _, _))`;
    await this.prologService.query(retract);

    const fact = `plant_stage('${body.location}', ${body.stage}, ${body.week})`;
    console.log(`Asserting Stage: ${fact}`);
    await this.prologService.assertFact(fact);
    return { status: 'success', fact };
  }

  @Post('advanced')
  async updateAdvanced(@Body() body: { location: string; ec?: number; system?: string; goal?: string }) {
    // sensor(ec, Location, Value)
    if (body.ec !== undefined) {
        const retract = `retractall(sensor(ec, '${body.location}', _))`;
        await this.prologService.query(retract);
        const fact = `sensor(ec, '${body.location}', ${body.ec})`;
        await this.prologService.assertFact(fact);
    }

    // system_type(Location, Type)
    if (body.system) {
        const retract = `retractall(system_type('${body.location}', _))`;
        await this.prologService.query(retract);
        const fact = `system_type('${body.location}', ${body.system})`;
        await this.prologService.assertFact(fact);
    }

    // growth_goal(Location, Goal)
    if (body.goal) {
        const retract = `retractall(growth_goal('${body.location}', _))`;
        await this.prologService.query(retract);
        const fact = `growth_goal('${body.location}', ${body.goal})`;
        await this.prologService.assertFact(fact);
    }

    return { status: 'success' };
  }

  @Get('recommendation')
  async getRecommendation(@Query('crop') crop: string, @Query('location') location: string) {
    const result = await this.prologService.getRecommendation(crop, location);
    return result;
  }

  @Get('ai-recommendation')
  async getAIRecommendation(@Query() query: any) {
    const input = {
      crop: query.crop,
      location: query.location,
      moisture: parseFloat(query.moisture) || 0,
      temp: parseFloat(query.temp) || 0,
      humidity: parseFloat(query.humidity) || 0,
      rain: parseFloat(query.rain) || 0,
      stage: query.stage,
      week: query.week ? parseInt(query.week) : undefined,
      ec: query.ec ? parseFloat(query.ec) : undefined,
      system: query.system,
      goal: query.goal,
      potSize: query.potSize ? parseFloat(query.potSize) : undefined,
      isPot: query.isPot === 'true',
    };

    // Generate cache key
    const cacheKey = this.cacheService.generateCacheKey(input);

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return { ...(cached as object), cached: true };
    }

    // Call AI service
    const result = await this.aiService.getRecommendation(input);

    // Store in cache
    await this.cacheService.set(cacheKey, result);

    return { ...result, cached: false };
  }

  @Post('cache/clear')
  async clearCache() {
    await this.cacheService.clear();
    return { status: 'success', message: 'Cache cleared' };
  }

  @Get('cache/stats')
  async getCacheStats() {
    const stats = await this.cacheService.getStats();
    return stats;
  }
}
