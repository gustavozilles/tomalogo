#!/bin/bash
SERVER_IP="135.181.97.102"
USER="root"
PASS="velobot"
DEST_DIR="/root/scarlet-helix"

echo "📂 Creating directories..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=accept-new "$USER@$SERVER_IP" "mkdir -p $DEST_DIR/app/components/modals $DEST_DIR/lib $DEST_DIR/prisma"

upload_file() {
    local REL_PATH=$1
    echo "📤 Uploading $REL_PATH via SSH Pipe..."
    # Pipe local file content to remote cat command
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=accept-new "$USER@$SERVER_IP" "cat > $DEST_DIR/$REL_PATH" < "$REL_PATH"
}

upload_file "lib/scheduler.ts"
upload_file "lib/bot.ts"
upload_file "lib/env.ts"
upload_file "lib/utils.ts"
upload_file "lib/services.ts"
upload_file "app/page.tsx"
upload_file "app/components/TimePicker.tsx"
upload_file "app/components/modals/AddMedModal.tsx"
upload_file "app/components/modals/EditMedModal.tsx"
upload_file "app/components/modals/SettingsModal.tsx"
upload_file "prisma/schema.prisma"
upload_file "package.json"

echo "🏗️ Rebuilding on Server..."
# Run the build commands on the server
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=accept-new "$USER@$SERVER_IP" "cd $DEST_DIR && npm install && npx prisma db push && npm run build && pm2 restart all"

echo "✅ SSH Pipe Sync Done!"
