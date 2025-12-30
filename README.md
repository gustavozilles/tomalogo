# 💊 TomaLogoBot

> **O assistente de TDAH que não te deixa esquecer de tomar seus remédios.**

Um sistema completo de lembretes de medicação com notificações via Telegram, escalação por chamada de voz (Twilio), e gestão de estoque via web app.

---

## ✨ Features

| Feature | Descrição |
|---------|-----------|
| 🔔 **Lembretes Inteligentes** | Notificações no horário exato, agrupadas por dose |
| 📞 **Escalação por Voz** | Ligação automática via Twilio se você não responder |
| 📦 **Gestão de Estoque** | Acompanhe quantos comprimidos restam |
| 📍 **GPS Home Snooze** | "Lembra quando eu chegar em casa" |
| 🩺 **Link pro Médico** | Botão direto pro WhatsApp do médico quando estoque baixar |
| 🌐 **Web App** | Interface amigável pra gerenciar tudo |

---

## 🛠️ Tech Stack

- **Bot:** [grammY](https://grammy.dev/) (Telegram Bot API)
- **Web App:** Next.js 16 + React
- **Database:** SQLite + Prisma ORM
- **Voice Calls:** Twilio IVR
- **Scheduler:** Node.js setInterval (1 min tick)
- **Deploy:** PM2 on Hetzner VPS

---

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/gustavozilles/tomalogo.git
cd tomalogo

# Instale dependências
npm install

# Configure o banco
npx prisma db push

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais
```

### Variáveis de Ambiente

```env
TELEGRAM_BOT_TOKEN=seu_token_do_botfather
TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_PHONE_NUMBER=+1234567890
PUBLIC_URL=seu_ip_ou_dominio
```

---

## 🚀 Rodando

```bash
# Dev (bot + web)
npm run dev

# Produção
npm run build
pm2 start 'npx tsx --env-file=.env scripts/dev-bot.ts' --name 'toma-bot'
pm2 start 'npm run start' --name 'toma-web'
```

---

## 📱 Comandos do Bot

| Comando | Ação |
|---------|------|
| `/start` | Inicia o bot |
| `/remedios` | Lista todos os remédios |
| `/add Nome Dose Qtd` | Adiciona remédio rápido |
| `/casa` | Configura localização de casa |

---

## 📸 Screenshots

*Coming soon*

---

## 🏷️ Versões

| Tag | Descrição |
|-----|-----------|
| `v1.0-alpha` | Primeira versão estável com copywriting refresh e fix de horário |

---

## 👨‍💻 Autor

Feito com 💙 por [@gustavozilles](https://github.com/gustavozilles)

---

## 📄 Licença

MIT
