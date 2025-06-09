# 🎵 SriRadio Discord Bot

A 24/7 Discord music bot with AI DJ functionality that streams continuous music with occasional AI-powered announcements and TTS.

## ✨ Features

- **24/7 Music Streaming**: Continuous music playback from a shuffled playlist
- **AI DJ Breaks**: Intelligent DJ announcements using OpenAI GPT models
- **Text-to-Speech**: High-quality TTS for DJ announcements
- **Auto Playlist Management**: Automatically shuffles playlist every 30 minutes
- **YouTube Integration**: Streams music directly from YouTube
- **Discord Commands**: Full set of slash commands for playlist management
- **Railway Ready**: Configured for easy deployment on Railway
- **Auto-Join**: Automatically joins voice channels and starts playing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Discord Bot Token
- OpenAI API Key (optional, for AI DJ)
- Railway Account (for deployment)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd srirradio
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Fill in your `.env` file:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_bot_client_id
   DISCORD_GUILD_ID=your_server_id
   OPENAI_API_KEY=your_openai_key
   VOICE_CHANNEL_ID=optional_default_channel_id
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

### Discord Bot Setup

1. **Create Bot**: Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. **Get Token**: Copy your bot token to `.env`
3. **Bot Permissions**: 
   - Connect
   - Speak
   - Use Slash Commands
   - Send Messages
   - Read Message History
4. **Invite Bot**: Generate invite URL with above permissions

## 🎛️ Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/status` | Check bot status and current track | Everyone |
| `/add [song]` | Add song to playlist | Everyone |
| `/search [query]` | Search for songs | Everyone |
| `/playlist` | View current playlist | Everyone |
| `/help` | Show all commands | Everyone |
| `/skip` | Skip current song | Admin |
| `/announce [message]` | Custom DJ announcement | Admin |

## 🚀 Railway Deployment

### Method 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Method 2: Manual Deploy

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - New Project → Deploy from GitHub repo
   - Select your forked repository

2. **Environment Variables**
   Add these variables in Railway dashboard:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_bot_client_id  
   DISCORD_GUILD_ID=your_server_id
   OPENAI_API_KEY=your_openai_key
   DJ_BREAK_INTERVAL=300000
   PORT=3000
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Bot will start and join voice channels automatically

## 🎵 Music Management

### Default Playlist
The bot comes with a curated playlist of popular songs across genres. It automatically:
- Shuffles the playlist every 30 minutes
- Handles failed tracks gracefully
- Maintains continuous playback

### Adding Music
- Use `/add [song name]` to add individual songs
- Use `/search [query]` to find specific tracks
- Playlist automatically saves to `data/playlist.json`

## 🎤 AI DJ Features

### AI-Powered Announcements
When OpenAI API key is provided:
- **Time-based greetings**: Morning, afternoon, evening messages
- **Music facts**: Interesting trivia and facts
- **Station identification**: Creative SriRadio mentions
- **Community messages**: Listener appreciation
- **Weather connections**: Seasonal music vibes

### Fallback System
Without OpenAI API key:
- Uses predefined announcement templates
- Still provides DJ breaks and station identification
- Maintains professional radio feel

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | ✅ | - | Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | - | Discord application ID |
| `DISCORD_GUILD_ID` | ✅ | - | Discord server ID |
| `OPENAI_API_KEY` | ❌ | - | OpenAI API key for AI DJ |
| `VOICE_CHANNEL_ID` | ❌ | - | Default voice channel |
| `DJ_BREAK_INTERVAL` | ❌ | 300000 | DJ break interval (ms) |
| `TTS_LANGUAGE` | ❌ | en | TTS language code |
| `PORT` | ❌ | 3000 | Web server port |

### Advanced Settings
- **DJ Break Interval**: Adjust frequency of DJ announcements
- **TTS Language**: Change announcement language
- **Auto-Join Logic**: Modify voice channel selection in `index.js`

## 🛠️ Development

### Project Structure
```
├── index.js              # Main bot file
├── src/
│   ├── MusicManager.js    # Playlist and music handling
│   ├── DJManager.js       # AI DJ and TTS functionality
│   └── commands/          # Discord slash commands
├── data/                  # Playlist storage
├── temp/                  # Temporary TTS files
└── package.json           # Dependencies
```

### Adding Features
1. **New Commands**: Add to `src/commands/index.js`
2. **Music Sources**: Extend `MusicManager.js`
3. **DJ Personalities**: Modify prompts in `DJManager.js`

## 🐛 Troubleshooting

### Common Issues

**Bot not joining voice channel:**
- Check bot permissions (Connect, Speak)
- Verify `VOICE_CHANNEL_ID` or ensure voice channels exist
- Check console logs for connection errors

**Music not playing:**
- Verify YouTube video availability
- Check FFmpeg installation on deployment platform
- Monitor rate limiting from YouTube

**AI DJ not working:**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API quota and billing
- Bot falls back to default messages automatically

**Railway deployment issues:**
- Ensure all environment variables are set
- Check build logs for dependency issues
- Verify Node.js version compatibility

### Logs and Monitoring
- All activities are logged to console
- Use Railway logs dashboard for monitoring
- Bot includes health check endpoint at `/`

## 📄 License

MIT License - feel free to use and modify for your own Discord servers!

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**SriRadio** - Your 24/7 Discord Music Companion 🎵 