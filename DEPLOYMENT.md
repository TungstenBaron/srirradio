# 🚀 Railway Deployment Guide for SriRadio Bot

## Prerequisites

Before deploying to Railway, make sure you have:

1. ✅ A [Railway account](https://railway.app) (free tier available)
2. ✅ Discord bot token and application details
3. ✅ Anthropic API key for Claude AI
4. ✅ Your Discord server ID and voice channel ID

## Step 1: Create Railway Project

### Option A: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   # Create a new repository on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/srirradio.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `srirradio` repository
   - Click "Deploy Now"

### Option B: Deploy via Railway CLI

1. **Install Railway CLI:**
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

## Step 2: Configure Environment Variables

In your Railway project dashboard, go to **Variables** tab and add:

```bash
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_server_id_here

# Claude AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Bot Configuration
DJ_BREAK_INTERVAL=300000
VOICE_CHANNEL_ID=your_voice_channel_id_here

# TTS Configuration
TTS_LANG=en
TTS_SLOW=false

# Railway automatically sets PORT - don't add this manually
```

## Step 3: Verify Deployment

1. **Check Logs:**
   - In Railway dashboard, click on your service
   - Go to **Deployments** tab
   - Click on latest deployment to view logs
   - You should see: `🎵 SriRadio Bot is online as YOUR_BOT_NAME!`

2. **Test Bot:**
   - Go to your Discord server
   - Bot should appear online
   - Try `/status` command to verify functionality

## Step 4: Enable Always-On

Railway's free tier includes:
- ✅ Always-on deployments
- ✅ Automatic restarts on crashes
- ✅ 500 hours/month free usage

Your bot will stay online 24/7 automatically!

## Troubleshooting

### Common Issues:

1. **Bot Offline:**
   - Check DISCORD_TOKEN is correct
   - Verify bot has proper permissions in Discord

2. **Commands Not Working:**
   - Ensure DISCORD_CLIENT_ID and DISCORD_GUILD_ID are correct
   - Check bot has slash command permissions

3. **Music Not Playing:**
   - Verify VOICE_CHANNEL_ID is correct
   - Bot needs Connect and Speak permissions in voice channel

4. **AI DJ Not Working:**
   - Check ANTHROPIC_API_KEY is valid
   - Ensure you have credits in your Anthropic account

### View Logs:
```bash
# If using Railway CLI:
railway logs
```

Or check logs in Railway dashboard under **Deployments**.

## Auto-Deploy on Code Changes

Once connected to GitHub, Railway will automatically:
- ✅ Deploy when you push to main branch
- ✅ Show deployment status
- ✅ Roll back if deployment fails

To update your bot:
```bash
git add .
git commit -m "Update bot features"
git push origin main
```

Railway will automatically detect changes and redeploy!

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | `ODc2M...` |
| `DISCORD_CLIENT_ID` | Application ID from Discord | `876543210987654321` |
| `DISCORD_GUILD_ID` | Your Discord server ID | `123456789012345678` |
| `ANTHROPIC_API_KEY` | Claude AI API key | `sk-ant-api03-...` |
| `VOICE_CHANNEL_ID` | Voice channel for auto-join | `987654321098765432` |
| `DJ_BREAK_INTERVAL` | DJ break frequency (ms) | `300000` (5 min) |

## 🎉 Success!

Your SriRadio bot is now deployed and will run 24/7 on Railway!

Features that work automatically:
- ✅ 24/7 music streaming
- ✅ AI DJ breaks every 5 minutes  
- ✅ Slash commands (/add, /skip, /stop, /resume, etc.)
- ✅ Auto-restart on crashes
- ✅ Auto-deploy on code updates

Visit your Discord server and enjoy your always-on radio bot! 🎵 