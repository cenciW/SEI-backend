# Deploy no Render - Backend

## Configurações realizadas

### 1. Package.json atualizado
- ✅ Adicionado `prebuild`: executa `prisma generate` antes do build
- ✅ Adicionado `postinstall`: executa `prisma generate` após instalar dependências
- ✅ Adicionado `migrate:deploy`: executa migrações do Prisma em produção

### 2. Main.ts atualizado
- ✅ Porta dinâmica: agora usa `process.env.PORT` (obrigatório no Render)
- ✅ Remove porta fixa 3001, mantém como fallback apenas

### 3. Dependências
- ✅ `dotenv` instalado (necessário para Prisma 7)

## Como fazer o deploy no Render (PASSO A PASSO)

### PASSO 1: Criar banco de dados PostgreSQL
1. Acesse [render.com](https://render.com) e faça login
2. No dashboard, clique em **"New +"** → **"PostgreSQL"**
3. Configure o banco:
   - **Name**: `sistema-irrigacao-db` (ou qualquer nome)
   - **Database**: `irrigacao`
   - **User**: `irrigacao_user` (ou deixe o padrão)
   - **Region**: escolha a mais próxima (ex: **Oregon (US West)**)
   - **Plan**: **Free**
4. Clique em **"Create Database"**
5. ⚠️ **IMPORTANTE**: Copie a **"Internal Database URL"** (começará com `postgresql://...`)

### PASSO 2: Criar Web Service
1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub:
   - Se for a primeira vez, clique em **"Connect GitHub"** e autorize o Render
   - Procure por **"SEI-backend"** ou **"cenciW/SEI-backend"**
   - Clique em **"Connect"**

3. Configure o serviço:
   - **Name**: `sistema-irrigacao-backend` (ou qualquer nome)
   - **Region**: mesma região do banco (**Oregon**)
   - **Branch**: `master`
   - **Root Directory**: **deixe VAZIO** (não preencha nada)
   - **Runtime**: **Docker** ⚠️ (IMPORTANTE: selecione Docker, não Node)
   - **Dockerfile Path**: `Dockerfile` (ou deixe o padrão)
   - **Docker Context**: `.` (ou deixe o padrão)
   - **Plan**: **Free**

   ℹ️ **Nota**: O Dockerfile já contém os comandos de build e start, não precisa configurá-los manualmente.

### PASSO 3: Configurar variáveis de ambiente
Ainda na configuração do Web Service, role até **"Environment Variables"**:

1. Adicione `DATABASE_URL`:
   - **Key**: `DATABASE_URL`
   - **Value**: Cole a **Internal Database URL** que você copiou do banco PostgreSQL
   - Exemplo: `postgresql://irrigacao_user:senha@dpg-xxxxx.oregon-postgres.render.com/irrigacao`

2. Adicione `OPENAI_API_KEY`:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: sua chave da API OpenAI (começa com `sk-...`)

3. Adicione `NODE_VERSION` (opcional mas recomendado):
   - **Key**: `NODE_VERSION`
   - **Value**: `20.x`

### PASSO 4: Deploy
1. Clique em **"Create Web Service"**
2. O Render começará o deploy automaticamente
3. Acompanhe os logs - o processo deve:
   - Instalar dependências
   - Executar `prisma generate`
   - Fazer build do NestJS
   - Executar migrações do banco
   - Iniciar o servidor

### PASSO 5: Testar
Quando o deploy terminar com sucesso:
- A URL do seu serviço aparecerá no topo (ex: `https://sistema-irrigacao-backend.onrender.com`)
- Teste acessando a URL no navegador
- Você deve ver a resposta da API

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
