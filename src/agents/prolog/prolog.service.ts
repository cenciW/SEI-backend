import { Injectable, OnModuleInit } from '@nestjs/common';
import * as swipl from 'swipl-stdio';
import * as path from 'path';

@Injectable()
export class PrologService implements OnModuleInit {
  private engine: any;

  onModuleInit() {
    try {
      // Initialize SWI-Prolog engine
      this.engine = new swipl.Engine();
      
      // Load the knowledge base
      // process.cwd() is usually the project root (where package.json is), i.e., .../backend
      // const kbPath = path.resolve(process.cwd(), '../prolog/knowledge_base.pl');
      // backend/src/agents/prolog/prolog.service.ts
      const kbPath = path.join(__dirname, '../../../prolog/knowledge_base.pl');
      // Escape backslashes for Prolog string
      const prologPath = kbPath.replace(/\\/g, '/');
      
      console.log(`Loading Prolog KB from: ${prologPath}`);
      this.engine.call(`consult('${prologPath}')`);
      
    } catch (error) {
      console.error('Failed to initialize Prolog engine:', error);
    }
  }

  async query(goal: string): Promise<any> {
    try {
      const query = await this.engine.call(goal);
      return query; 
    } catch (error) {
      console.error(`Prolog query failed: ${goal}`, error);
      throw error;
    }
  }

  async assertFact(fact: string): Promise<void> {
    try {
      await this.engine.call(`assertz(${fact})`);
    } catch (error) {
      console.error(`Failed to assert fact: ${fact}`, error);
      throw error;
    }
  }
  
  async getRecommendation(crop: string, location: string): Promise<any> {
      // irrigation_decision(Crop, Location, decision(Need, Score, VolumeL, Advice))
      // Quote atoms to handle uppercase inputs
      const goal = `irrigation_decision('${crop}', '${location}', decision(Need, Score, VolumeL, Advice))`;
      const result = await this.engine.call(goal);
      return result;
  }
}
