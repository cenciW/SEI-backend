import { Injectable, OnModuleInit } from '@nestjs/common';
import * as swipl from 'swipl-stdio';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PrologService implements OnModuleInit {
  private engine: any;
  private isAvailable: boolean = false;

  onModuleInit() {
    try {
      // Initialize SWI-Prolog engine
      this.engine = new swipl.Engine();

      // Load the knowledge base
      // Try dist path first (production), then source path (development)
      let kbPath = path.join(__dirname, '../../../prolog/knowledge_base.pl');

      if (!fs.existsSync(kbPath)) {
        // In development, files might be in the source directory
        kbPath = path.join(process.cwd(), 'prolog/knowledge_base.pl');
      }

      // Escape backslashes for Prolog string
      const prologPath = kbPath.replace(/\\/g, '/');

      console.log(`Loading Prolog KB from: ${prologPath}`);
      this.engine.call(`consult('${prologPath}')`);
      this.isAvailable = true;
      console.log('✅ Prolog engine initialized successfully');
    } catch (error) {
      console.warn(
        '⚠️ Prolog engine not available. Prolog features will be disabled.',
      );
      console.warn(
        'To enable Prolog: Install SWI-Prolog from https://www.swi-prolog.org/download/stable',
      );
      this.isAvailable = false;
    }
  }

  async query(goal: string): Promise<any> {
    if (!this.isAvailable) {
      throw new Error(
        'Prolog engine is not available. Please install SWI-Prolog.',
      );
    }
    try {
      const query = await this.engine.call(goal);
      return query;
    } catch (error) {
      console.error(`Prolog query failed: ${goal}`, error);
      throw error;
    }
  }

  async assertFact(fact: string): Promise<void> {
    if (!this.isAvailable) {
      throw new Error(
        'Prolog engine is not available. Please install SWI-Prolog.',
      );
    }
    try {
      await this.engine.call(`assertz(${fact})`);
    } catch (error) {
      console.error(`Failed to assert fact: ${fact}`, error);
      throw error;
    }
  }

  async getRecommendation(crop: string, location: string): Promise<any> {
    if (!this.isAvailable) {
      throw new Error(
        'Prolog engine is not available. Please install SWI-Prolog.',
      );
    }
    // irrigation_decision(Crop, Location, decision(Need, Score, VolumeL, Advice))
    // Quote atoms to handle uppercase inputs
    const goal = `irrigation_decision('${crop}', '${location}', decision(Need, Score, VolumeL, Advice))`;
    const result = await this.engine.call(goal);
    return result;
  }

  isPrologAvailable(): boolean {
    return this.isAvailable;
  }
}
