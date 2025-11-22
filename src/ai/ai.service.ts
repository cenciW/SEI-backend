import OpenAI from 'openai';

export interface AIRecommendationInput {
  crop: string;
  location: string;
  moisture: number;
  temp: number;
  humidity: number;
  rain: number;
  stage?: string;
  week?: number;
  ec?: number;
  system?: string;
  goal?: string;
  potSize?: number;
  isPot?: boolean;
}

export interface AIRecommendationOutput {
  shouldIrrigate: 'SIM' | 'NÃO';
  volumeL: number;
  advice: string;
  reasoning?: string;
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private buildPrompt(input: AIRecommendationInput): string {
    const baseContext = `Você é um especialista em irrigação agrícola.

Condições Atuais:
- Umidade do Solo: ${input.moisture}%
- Temperatura do Ar: ${input.temp}°C
- Umidade do Ar: ${input.humidity}%
- Chuva nas últimas 24h: ${input.rain}mm`;

    let cropSpecificContext = '';

    switch (input.crop) {
      case 'cannabis':
        cropSpecificContext = this.buildCannabisPrompt(input);
        break;
      case 'tomato':
        cropSpecificContext = this.buildTomatoPrompt(input);
        break;
      case 'wheat':
        cropSpecificContext = this.buildWheatPrompt(input);
        break;
      case 'corn':
        cropSpecificContext = this.buildCornPrompt(input);
        break;
      case 'lettuce':
        cropSpecificContext = this.buildLettucePrompt(input);
        break;
      default:
        cropSpecificContext = this.buildGenericPrompt(input);
    }

    const instructions = `
Forneça uma recomendação de irrigação no seguinte formato JSON:
{
  "shouldIrrigate": "SIM" ou "NÃO",
  "volumeL": <número>,
  "advice": "<texto curto com recomendação>"
}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional.`;

    return `${baseContext}\n\n${cropSpecificContext}\n\n${instructions}`;
  }

  private buildCannabisPrompt(input: AIRecommendationInput): string {
    const potSize = input.potSize || 10;
    const stage = input.stage || 'vegetative';
    
    // Calcular volumes baseados no estágio
    let shotPercent = 0.03; // vegetativo padrão
    let frequency = 5;
    if (stage === 'seedling') {
      shotPercent = 0.01;
      frequency = 2;
    } else if (stage === 'blooming') {
      shotPercent = 0.06;
      frequency = 6;
    }
    
    const shotSize = potSize * shotPercent;
    const dailyVolume = shotSize * frequency;
    
    return `Cultura: Cannabis ${input.isPot ? `(VASO ${potSize}L)` : '(CAMPO)'}
Estágio: ${stage}, Semana ${input.week || 1}
EC do Solo: ${input.ec || 'não medido'}
Umidade do Solo: ${input.moisture}%

${input.isPot ? `
CÁLCULO DE VOLUME PARA VASO - SIGA EXATAMENTE:

1. **Tamanho do Vaso**: ${potSize}L

2. **Volume por Rega (Shot Size)**:
   - ${stage === 'seedling' ? 'Seedling: 1%' : stage === 'blooming' ? 'Floração: 6%' : 'Vegetativo: 3%'} do vaso
   - Shot = ${potSize}L × ${shotPercent} = ${shotSize.toFixed(2)}L

3. **Frequência Diária**:
   - ${stage === 'seedling' ? '1-2x/dia' : stage === 'blooming' ? '4-9x/dia' : '3-6x/dia'}
   - Frequência média: ${frequency}x/dia

4. **VOLUME TOTAL DIÁRIO**:
   - ${shotSize.toFixed(2)}L × ${frequency} = ${dailyVolume.toFixed(2)}L/dia

**LIMITES CRÍTICOS**:
- Volume MÍNIMO: 0.1L/dia
- Volume MÁXIMO: ${(potSize * 0.6).toFixed(1)}L/dia (60% do vaso)
- **NUNCA exceda ${potSize}L/dia (tamanho do vaso)**

Contexto EC:
- Se EC > 2.6: Sugerir FLUSH (aumentar volume 1.5x)
- Se EC < 1.2: Aumentar nutrientes (manter volume)
` : `
CÁLCULO PARA CAMPO:
- Calcule em L/m² baseado na umidade do solo
- Volume típico: 3-8 L/m²
`}`;
  }

  private buildTomatoPrompt(input: AIRecommendationInput): string {
    const goal = input.goal || 'balanced';
    const isPot = input.isPot;
    const potSize = input.potSize || 10;
    const ec = input.ec || 1.5;
    
    // Calcular ajustes baseados na meta de crescimento (igual ao Prolog)
    let waterModifier = 1.0;
    let goalDescription = '';
    
    if (goal === 'vegetative') {
      waterModifier = 1.15; // 15% mais água
      goalDescription = 'VEGETATIVO (15% mais água - prioriza folhagem)';
    } else if (goal === 'generative') {
      waterModifier = 0.85; // 15% menos água
      goalDescription = 'GENERATIVO (15% menos água - prioriza frutos)';
    } else {
      waterModifier = 1.0;
      goalDescription = 'BALANCEADO (equilíbrio entre folhagem e frutos)';
    }
    
    // Calcular volume base
    let baseVolume = 0;
    if (isPot) {
      // Para vasos: 3-5% do tamanho do vaso por dia
      baseVolume = potSize * 0.04; // 4% como média
    } else {
      // Para campo: 4-6 L/m² base
      baseVolume = 5; // L/m²
    }
    
    // Ajustar pelo goal
    const adjustedVolume = (baseVolume * waterModifier).toFixed(2);
    
    return `Cultura: Tomate ${isPot ? `(VASO ${potSize}L)` : '(CAMPO)'}
Meta de Crescimento: ${goalDescription}
EC do Solo: ${ec} (ideal: 2.0-3.5)
Estágio: ${input.stage || 'vegetative'}
Umidade do Solo: ${input.moisture}%

${isPot ? `
CÁLCULO DE VOLUME PARA TOMATE EM VASO - SIGA EXATAMENTE:

1. **Volume Base Diário**:
   - Tomate em vaso: 3-5% do tamanho do vaso/dia
   - Vaso de ${potSize}L: base = ${baseVolume.toFixed(2)}L/dia

2. **AJUSTE PELA META DE CRESCIMENTO** (CRÍTICO):
   ${goal === 'vegetative' ? `
   - Meta VEGETATIVA = mais água (+15%)
   - Volume = ${baseVolume.toFixed(2)}L × 1.15 = ${adjustedVolume}L/dia
   - Objetivo: Estimular crescimento de folhas e caules` : ''}${goal === 'generative' ? `
   - Meta GENERATIVA = menos água (-15%)
   - Volume = ${baseVolume.toFixed(2)}L × 0.85 = ${adjustedVolume}L/dia
   - Objetivo: Estimular produção de frutos (stress controlado)` : ''}${goal === 'balanced' ? `
   - Meta BALANCEADA = volume base (sem ajuste)
   - Volume = ${baseVolume.toFixed(2)}L × 1.0 = ${adjustedVolume}L/dia
   - Objetivo: Equilíbrio entre crescimento e produção` : ''}

3. **Gestão de EC** (Condutividade Elétrica):
   - EC atual: ${ec}
   - EC ideal para tomate: 2.0-3.5
   ${ec < 2.0 ? '- AÇÃO: EC baixa - aumentar concentração de nutrientes' : ''}${ec > 3.5 ? '- AÇÃO: EC alta - fazer FLUSH com água pura (2x volume normal)' : ''}

**LIMITES CRÍTICOS**:
- Volume MÍNIMO: 0.2L/dia
- Volume MÁXIMO: ${(potSize * 0.5).toFixed(1)}L/dia (50% do vaso)
- **USE O VALOR AJUSTADO: ${adjustedVolume}L/dia**
` : `
CÁLCULO PARA TOMATE EM CAMPO - SIGA EXATAMENTE:

1. **Volume Base**:
   - Tomate em campo: 4-6 L/m²/dia
   - Base = ${baseVolume} L/m²

2. **AJUSTE PELA META DE CRESCIMENTO** (CRÍTICO):
   ${goal === 'vegetative' ? `
   - Meta VEGETATIVA = mais água (+15%)
   - Volume = ${baseVolume} × 1.15 = ${adjustedVolume} L/m²/dia
   - Objetivo: Crescimento vigoroso de plantas` : ''}${goal === 'generative' ? `
   - Meta GENERATIVA = menos água (-15%)
   - Volume = ${baseVolume} × 0.85 = ${adjustedVolume} L/m²/dia
   - Objetivo: Concentrar energia na produção de frutos` : ''}${goal === 'balanced' ? `
   - Meta BALANCEADA = volume base
   - Volume = ${baseVolume} × 1.0 = ${adjustedVolume} L/m²/dia
   - Objetivo: Crescimento e produção equilibrados` : ''}

3. **Gestão de EC**:
   - EC atual: ${ec}
   - EC ideal: 2.0-3.5
   ${ec < 2.0 ? '- Aumentar fertilização' : ''}${ec > 3.5 ? '- Reduzir fertilização ou fazer lixiviação' : ''}

**LIMITES**:
- Mínimo: 2 L/m²/dia
- Máximo: 10 L/m²/dia
- **USE O VALOR AJUSTADO: ${adjustedVolume} L/m²**
`}

**IMPORTANTE**: O ajuste pela meta de crescimento (${waterModifier}x) é ESSENCIAL para tomates. Respeite rigorosamente este multiplicador.`;
  }

  private buildWheatPrompt(input: AIRecommendationInput): string {
    return `Cultura: Trigo
Estágio: ${input.stage || 'vegetative'}
Sistema de Irrigação: ${input.system || 'drip'}

Contexto Especializado:
- Trigo tem estágios críticos (Perfilhamento, Alongamento do Caule, Folha Bandeira)
- Eficiência do sistema varia: Gotejamento 95%, Pivô 85%, Sulco 60%

Considere a eficiência do sistema (${input.system}) no cálculo do volume.
Forneça volume em L/m².`;
  }

  private buildCornPrompt(input: AIRecommendationInput): string {
    // Calcular eficiência do sistema
    let efficiency = 0.85; // pivot padrão
    let efficiencyText = '85%';
    if (input.system === 'drip') {
      efficiency = 0.95;
      efficiencyText = '95%';
    } else if (input.system === 'furrow') {
      efficiency = 0.60;
      efficiencyText = '60%';
    }
    
    return `Cultura: Milho (CAMPO)
Sistema de Irrigação: ${input.system || 'pivot'} (Eficiência: ${efficiencyText})
Estágio: ${input.stage || 'vegetative'}
Umidade do Solo: ${input.moisture}%

CÁLCULO DE VOLUME PARA MILHO - SIGA EXATAMENTE:

1. **Calcule o volume BASE** (sem ajuste):
   - Se umidade < 40%: base = 8 L/m²
   - Se umidade 40-60%: base = 5 L/m²
   - Se umidade > 60%: base = 3 L/m²

2. **AJUSTE pela eficiência do sistema**:
   - Volume Final = Volume Base / Eficiência
   - Sistema ${input.system || 'pivot'}: Volume Final = Base / ${efficiency}
   
3. **EXEMPLO COMPLETO**:
   - Umidade atual: ${input.moisture}%
   - Base estimado: ${input.moisture < 40 ? '8' : input.moisture > 60 ? '3' : '5'} L/m²
   - Ajuste: ${input.moisture < 40 ? '8' : input.moisture > 60 ? '3' : '5'} / ${efficiency} = ${((input.moisture < 40 ? 8 : input.moisture > 60 ? 3 : 5) / efficiency).toFixed(2)} L/m²

**LIMITES CRÍTICOS**:
- Volume MÍNIMO: 3 L/m²
- Volume MÁXIMO: 15 L/m²
- **SE SEU CÁLCULO ULTRAPASSAR 15 L/m², REDUZA PARA 15 L/m²**
- **NUNCA sugira mais de 20 L/m² em NENHUMA circunstância**

Forneça volume em L/m² (litros por metro quadrado).`;
  }

  private buildLettucePrompt(input: AIRecommendationInput): string {
    return `Cultura: Alface
Temperatura: ${input.temp}°C
Umidade: ${input.humidity}%

Contexto Especializado:
- Alface é sensível ao DPV (Déficit de Pressão de Vapor)
- DPV alto dispara irrigação preventiva mesmo se o solo estiver úmido
- DPV = f(temperatura, umidade)

Considere o DPV na sua recomendação.`;
  }

  private buildGenericPrompt(input: AIRecommendationInput): string {
    return `Cultura: ${input.crop}
Estágio: ${input.stage || 'vegetative'}

Forneça uma recomendação de irrigação baseada nas condições atuais.`;
  }

  async getRecommendation(input: AIRecommendationInput): Promise<AIRecommendationOutput> {
    try {
      const prompt = this.buildPrompt(input);

      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em irrigação agrícola. Responda sempre em JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent responses
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from AI');
      }

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        shouldIrrigate: result.shouldIrrigate === 'SIM' ? 'SIM' : 'NÃO',
        volumeL: parseFloat(result.volumeL) || 0,
        advice: result.advice || 'Sem recomendação específica',
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Failed to get AI recommendation: ${error.message}`);
    }
  }
}
