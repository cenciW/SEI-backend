# Deploy no Render - Backend

## Configurações realizadas

### 1. Package.json atualizado
- ✅ Adicionado `prebuild`: executa `prisma generate` antes do build
- ✅ Adicionado `postinstall`: executa `prisma generate` após instalar dependências
- ✅ Adicionado `migrate:deploy`: executa migrações do Prisma em produção

### 2. Main.ts atualizado
- ✅ Porta dinâmica: agora usa `process.env.PORT` (obrigatório no Render)
- ✅ Remove porta fixa 3001, mantém como fallback apenas

### 3. Arquivo render.yaml criado
Configuração completa para deploy automático no Render

## Como fazer o deploy no Render

### Opção 1: Deploy via render.yaml (Recomendado)
1. Faça commit das alterações:
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push
   ```

2. Acesse [render.com](https://render.com) e faça login
3. Clique em "New" → "Blueprint"
4. Conecte seu repositório GitHub
5. O Render detectará automaticamente o `render.yaml`
6. Configure as variáveis de ambiente:
   - `OPENAI_API_KEY`: sua chave da API OpenAI
   - `DATABASE_URL`: será preenchido automaticamente pelo banco Postgres

### Opção 2: Deploy manual
1. Acesse [render.com](https://render.com)
2. Crie um novo PostgreSQL Database:
   - Database Name: `irrigacao`
   - User: `irrigacao_user`
   - Region: escolha a mais próxima

3. Crie um novo Web Service:
   - Conecte seu repositório
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run migrate:deploy && npm run start:prod`
   - **Environment**: Node

4. Configure as variáveis de ambiente:
   - `DATABASE_URL`: copie do banco Postgres criado (Internal Database URL)
   - `OPENAI_API_KEY`: sua chave da API OpenAI
   - `NODE_VERSION`: `20.x`

## Verificação

Após o deploy, você pode verificar:
- Os logs do serviço mostrarão "Backend running on port XXXX"
- Teste a URL fornecida pelo Render (ex: `https://seu-app.onrender.com`)

## Troubleshooting

### Erro de conexão com banco
- Verifique se a variável `DATABASE_URL` está configurada corretamente
- Use a "Internal Database URL" do banco Postgres (não a External)

### Erro de build
- Verifique os logs de build no Render
- Certifique-se de que todas as dependências estão no `package.json`

### Erro de migração
- As migrações devem estar em `prisma/migrations/`
- O comando `prisma migrate deploy` aplica apenas migrações já criadas
- Se precisar criar novas migrações, rode localmente: `npx prisma migrate dev`

## Comandos úteis localmente

```bash
# Gerar Prisma Client
npm run prebuild

# Build do projeto
npm run build

# Executar migrações
npm run migrate:deploy

# Iniciar em produção
npm run start:prod
```
