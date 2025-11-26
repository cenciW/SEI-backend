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
        `Prolog engine not available: ${error}. Prolog features will be disabled.`,
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

  async getRules(): Promise<string> {
    let kbPath = path.join(__dirname, '../../../prolog/knowledge_base.pl');
    if (!fs.existsSync(kbPath)) {
      kbPath = path.join(process.cwd(), 'prolog/knowledge_base.pl');
    }
    if (!fs.existsSync(kbPath)) {
      throw new Error('Knowledge base file not found');
    }
    return fs.readFileSync(kbPath, 'utf-8');
  }

  async updateRules(newContent: string): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Prolog engine is not available');
    }

    // 1. Create a temp file
    const tempPath = path.join(process.cwd(), 'prolog/temp_kb.pl');
    fs.writeFileSync(tempPath, newContent);

    try {
      // 2. Try to consult the temp file
      // We use a new engine instance or just try to consult it in the current one?
      // If we consult in current one and it fails, it might leave it in bad state?
      // swipl-stdio engine is persistent.
      // Let's try to consult. If it throws, it's invalid.
      const tempPathEscaped = tempPath.replace(/\\/g, '/');
      await this.engine.call(`consult('${tempPathEscaped}')`);

      // 3. If success, overwrite the actual file
      let kbPath = path.join(__dirname, '../../../prolog/knowledge_base.pl');
      if (!fs.existsSync(kbPath)) {
        kbPath = path.join(process.cwd(), 'prolog/knowledge_base.pl');
      }
      fs.writeFileSync(kbPath, newContent);

      // 4. Reload the main file to be sure
      const kbPathEscaped = kbPath.replace(/\\/g, '/');
      await this.engine.call(`consult('${kbPathEscaped}')`);
      console.log('✅ Prolog rules updated and reloaded successfully');
    } catch (error) {
      console.error('❌ Failed to update Prolog rules:', error);
      throw new Error(`Invalid Prolog rules: ${error}`);
    } finally {
      // 5. Cleanup temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  // Get list of available Prolog modules
  async listModules(): Promise<string[]> {
    const prologDir = path.join(process.cwd(), 'prolog');
    const cropsDir = path.join(prologDir, 'crops');

    const modules = ['knowledge_base.pl'];

    if (fs.existsSync(cropsDir)) {
      const cropFiles = fs
        .readdirSync(cropsDir)
        .filter((file) => file.endsWith('.pl'))
        .map((file) => `crops/${file}`);
      modules.push(...cropFiles);
    }

    return modules;
  }

  // Get content of a specific module
  async getModuleContent(modulePath: string): Promise<string> {
    // Sanitize path to prevent directory traversal
    const safePath = modulePath.replace(/\.\./g, '');
    const fullPath = path.join(process.cwd(), 'prolog', safePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Module not found: ${modulePath}`);
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }

  // Update content of a specific module
  async updateModuleContent(
    modulePath: string,
    newContent: string,
  ): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Prolog engine is not available');
    }

    // Sanitize path
    const safePath = modulePath.replace(/\.\./g, '');
    const fullPath = path.join(process.cwd(), 'prolog', safePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Module not found: ${modulePath}`);
    }

    // Create temp file
    const tempPath = path.join(
      process.cwd(),
      'prolog',
      `temp_${safePath.replace(/\//g, '_')}`,
    );
    fs.writeFileSync(tempPath, newContent);

    try {
      // Validate by consulting temp file
      const tempPathEscaped = tempPath.replace(/\\/g, '/');
      await this.engine.call(`consult('${tempPathEscaped}')`);

      // If valid, save to actual file
      fs.writeFileSync(fullPath, newContent);

      // Reload entire knowledge base to ensure consistency
      const kbPath = path.join(process.cwd(), 'prolog/knowledge_base.pl');
      const kbPathEscaped = kbPath.replace(/\\/g, '/');

      // Use make/0 to reload all modified files if available, otherwise reconsult
      try {
        await this.engine.call('make');
      } catch {
        // If make/0 not available, just reconsult the knowledge base
        await this.engine.call(`consult('${kbPathEscaped}')`);
      }

      console.log(`✅ Module ${modulePath} updated successfully`);
    } catch (error) {
      console.error(`❌ Failed to update module ${modulePath}:`, error);
      throw new Error(`Invalid Prolog syntax: ${error}`);
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
}
