#!/bin/bash

# Configuration
SERVER_IP="135.181.97.102"
USER="root"
PASS="velobot"
DEST_DIR="/root/scarlet-helix"

echo "🚀 Iniciando Deploy para $SERVER_IP..."

# 1. Create remote directory
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=accept-new "$USER@$SERVER_IP" "mkdir -p $DEST_DIR"

# 2. Transfer files (excluding bulky stuff and database)
echo "📦 Transferindo arquivos..."
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='_src_backup' \
    --exclude='*.db' \
    --exclude='prisma/dev.db' \
    -e "sshpass -p '$PASS' ssh -o StrictHostKeyChecking=accept-new" \
    ./ "$USER@$SERVER_IP:$DEST_DIR/"

# 3. Install and Build on Server
echo "🏗️ Instalando dependências e construindo o projeto no servidor..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=accept-new "$USER@$SERVER_IP" "cd $DEST_DIR && rm -rf .next && npm install && npx prisma db push && npm run build"

# 4. Start with PM2
echo "🎬 Iniciando processos com PM2..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=accept-new "$USER@$SERVER_IP" "cd $DEST_DIR && \
    pm2 delete all || true && \
    pm2 start 'npx tsx --env-file=.env scripts/dev-bot.ts' --name 'toma-bot' && \
    pm2 start 'npm run start' --name 'toma-web'"

echo "✅ Deploy concluído!"
