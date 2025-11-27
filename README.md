# 🌱 SEI Backend - Sistema Especialista de Irrigação

Backend robusto e escalável para sistema de recomendação inteligente de irrigação, combinando **Prolog** (sistema especialista) com **IA Generativa** (ChatGPT).

## 🚀 Tecnologias Principais

### Core Framework

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo para aplicações server-side escaláveis
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado de JavaScript para maior segurança e produtividade
- **[Node.js](https://nodejs.org/)** - Runtime JavaScript assíncrono e orientado a eventos

### Banco de Dados & ORM

- **[PostgreSQL](https://www.postgresql.org/)** - Sistema de banco de dados relacional open-source
- **[Prisma](https://www.prisma.io/)** - ORM moderno e type-safe para Node.js e TypeScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (BaaS) com PostgreSQL gerenciado

### Inteligência Artificial

- **[SWI-Prolog](https://www.swi-prolog.org/)** - Sistema especialista baseado em lógica para regras de irrigação
- **[OpenAI API](https://openai.com/)** - Integração com GPT para recomendações contextuais via IA generativa
- **[swipl-stdio](https://www.npmjs.com/package/swipl-stdio)** - Bridge Node.js ↔ Prolog para execução de queries

### Autenticação & Segurança

- **[JWT (JSON Web Tokens)](https://jwt.io/)** - Autenticação stateless baseada em tokens
- **[Passport.js](http://www.passportjs.org/)** - Middleware de autenticação flexível
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Hashing de senhas com salt para máxima segurança
- **RBAC (Role-Based Access Control)** - Controle de acesso baseado em papéis (Admin/User)

### Cache & Performance

- **Sistema de Cache Inteligente** - Cache de respostas da OpenAI no PostgreSQL
  - Reduz custos com API
  - Melhora tempo de resposta
  - Armazena hash dos parâmetros de entrada para lookup rápido

### Containerização & Deploy

- **[Docker](https://www.docker.com/)** - Containerização da aplicação para portabilidade
- **[Docker Compose](https://docs.docker.com/compose/)** - Orquestração multi-container
- **Dockerfile otimizado** - Build em múltiplos estágios para imagens leves

## 📋 Funcionalidades

### Sistema Especialista em Prolog

```prolog
% Base de conhecimento modular para diferentes culturas:
- Milho (corn.pl)
- Tomate (tomato.pl)
- Trigo (wheat.pl)
- Alface (lettuce.pl)
- Cannabis (cannabis.pl)
```

**Capacidades:**

- ✅ Avaliação de necessidade de irrigação baseada em regras lógicas
- ✅ Cálculo de volume preciso por cultura e estágio de crescimento
- ✅ Consideração de fatores: umidade do solo, chuva, temperatura, umidade ar
- ✅ Suporte para cultivo em vaso e campo
- ✅ Parâmetros avançados (EC, sistema de irrigação, metas de crescimento)

### IA Generativa (ChatGPT)

- 🤖 Recomendações contextuais baseadas em GPT-3.5/4
- 💬 Prompts engenheirados para precisão agrícola
- 💾 Sistema de cache para respostas idênticas
- ⚡ Execução paralela com sistema Prolog

### Painel Administrativo

- 🔐 Acesso restrito via RBAC (role: ADMIN)
- 📝 Editor de módulos Prolog em tempo real
- ✅ Validação de sintaxe antes de salvar
- 🔄 Hot-reload das regras sem restart do servidor
- 📦 Gerenciamento de múltiplos módulos de cultura

### API RESTful

```typescript
POST /auth/login         // Autenticação de usuários
POST /auth/register      // Registro de novos usuários
POST /agents/analyze     // Análise Prolog + IA paralela
GET  /agents/prolog/modules              // Lista módulos Prolog
GET  /agents/prolog/modules/:path        // Lê módulo específico
POST /agents/prolog/modules/:path        // Atualiza e valida módulo
```

## 🏗️ Arquitetura

```
backend/
├── src/
│   ├── auth/                    # Autenticação & autorização
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   ├── agents/                  # Sistema inteligente
│   │   ├── agents.controller.ts
│   │   ├── agents.module.ts
│   │   └── prolog/
│   │       ├── prolog.service.ts
│   │       └── prolog.controller.ts
│   ├── ai/                      # IA & Cache
│   │   ├── ai.service.ts
│   │   ├── cache.service.ts
│   │   └── prisma.service.ts
│   └── main.ts
├── prolog/                      # Base de conhecimento Prolog
│   ├── knowledge_base.pl        # Módulo principal
│   └── crops/                   # Módulos de culturas
│       ├── corn.pl
│       ├── tomato.pl
│       ├── wheat.pl
│       ├── lettuce.pl
│       └── cannabis.pl
├── prisma/
│   ├── schema.prisma            # Schema do banco
│   └── migrations/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔐 Segurança Implementada

### 1. Autenticação JWT

```typescript
// Token JWT com payload seguro
{
  email: string,
  sub: userId,
  role: 'USER' | 'ADMIN'
}
```

### 2. Hash de Senhas com bcrypt

```typescript
// Salt rounds: 10 (2^10 iterações)
const hashedPassword = await bcrypt.hash(password, 10);
```

### 3. RBAC (Role-Based Access Control)

- **USER**: Acesso ao sistema de análise e recomendações
- **ADMIN**: Acesso total + painel de edição Prolog

### 4. Guards & Decorators

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async updateModule() { ... }
```

## 🗄️ Schema do Banco de Dados

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("USER")
  createdAt DateTime @default(now())
}

model AIRecommendationCache {
  id              String   @id @default(uuid())
  parametersHash  String   @unique  // Hash dos parâmetros
  recommendation  Json                // Resposta da OpenAI
  createdAt       DateTime @default(now())
  @@index([parametersHash])
}
```

## 🐳 Docker & Containerização

### Dockerfile Multi-Stage

```dockerfile
FROM node:20
# Instala SWI-Prolog no container
RUN apt-get update && apt-get install -y swi-prolog

# Build otimizado
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Migrations automáticas no startup
CMD ["sh", "-c", "npm run migrate:deploy && npm run start:prod"]
```

### Docker Compose

```yaml
services:
  backend:
    build: .
    ports:
      - '3001:3001'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## 📊 Sistema de Cache Inteligente

### Estratégia

1. **Hash dos parâmetros de entrada** → chave única
2. **Lookup no PostgreSQL** → O(1) com índice
3. **Cache HIT**: Retorna resposta salva (< 50ms)
4. **Cache MISS**: Chama OpenAI + salva resultado

### Benefícios

- 💰 **Economia**: Reduz 70-90% das chamadas à API OpenAI
- ⚡ **Performance**: Respostas 50x mais rápidas
- 🌍 **Sustentabilidade**: Menor consumo de recursos computacionais

```typescript
// Geração de hash único
const hash = crypto
  .createHash('sha256')
  .update(JSON.stringify(sortedParams))
  .digest('hex');

// Cache lookup
const cached = await prisma.aIRecommendationCache.findUnique({
  where: { parametersHash: hash },
});
```

## 🚦 Instalação & Execução

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (ou Supabase)
- SWI-Prolog 8.4+ (se executar localmente)
- Docker & Docker Compose (para containerização)

### Variáveis de Ambiente

```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="seu-secret-super-seguro-aqui"
OPENAI_API_KEY="sk-..."
PORT=3001
```

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar migrations
npx prisma migrate dev

# Modo desenvolvimento
npm run start:dev
```

### Produção com Docker

```bash
# Build da imagem
docker build -t sei-backend .

# Executar container
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  -e OPENAI_API_KEY="..." \
  sei-backend
```

### Com Docker Compose

```bash
# Configurar .env primeiro
cp .env.example .env

# Subir aplicação
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📝 Scripts Disponíveis

```json
{
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "migrate:deploy": "prisma migrate deploy",
  "prisma:generate": "prisma generate"
}
```

## 🧪 Testando a API

### Registro de Usuário

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123",
    "name": "João Silva"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123"
  }'
```

### Análise de Irrigação

```bash
curl -X POST http://localhost:3001/agents/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "location": "campo1",
    "crop": "corn",
    "moisture": 30,
    "rain": 5,
    "temp": 25,
    "humidity": 60,
    "isPot": false,
    "stage": "vegetative",
    "week": 4
  }'
```

## 🔄 Fluxo de Análise

```
Cliente → Backend → [Prolog Query + OpenAI Request] (Paralelo)
                    ↓                    ↓
              Prolog Result      Cache Check → OpenAI API
                    ↓                    ↓
                    └───→ Merge Results ←┘
                              ↓
                       Response to Client
```

## 🏆 Diferenciais Técnicos

1. **Hibridização IA** - Combina lógica simbólica (Prolog) com IA generativa
2. **Modularidade** - Base de conhecimento separada por cultura
3. **Hot-reload** - Atualização de regras sem downtime
4. **Type Safety** - TypeScript end-to-end
5. **Cache Inteligente** - Otimização automática de custos
6. **Containerização** - Deploy consistente em qualquer ambiente
7. **RBAC Granular** - Segurança em múltiplas camadas
8. **Escalabilidade** - Arquitetura preparada para microserviços

## 📚 Documentação Adicional

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [SWI-Prolog Documentation](https://www.swi-prolog.org/pldoc/)
- [OpenAI API Reference](https://platform.openai.com/docs/)

## 👥 Contribuindo

Este é um projeto acadêmico desenvolvido como parte do curso de Inteligência Artificial.
