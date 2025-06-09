require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const express = require('express');
const MusicManager = require('./src/MusicManager');
const DJManager = require('./src/DJManager');
const commands = require('./src/commands');

class SriRadioBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.musicManager = new MusicManager();
        this.djManager = new DJManager();
        this.connection = null;
        this.player = createAudioPlayer();
        this.isPlaying = false;
        this.playNextTimeout = null;
        this.shouldAutoPlay = true;
        
        this.setupEventHandlers();
        this.setupWebServer();
    }

    setupEventHandlers() {
        this.client.once('ready', () => {
            console.log(`🎵 SriRadio Bot is online as ${this.client.user.tag}!`);
            this.client.user.setActivity('Saint Rasso Imperial Radio - Long Live The Emperor', { type: ActivityType.Streaming, url: 'https://twitch.tv/srirradio' });
            this.autoJoinAndPlay();
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = commands.find(cmd => cmd.data.name === interaction.commandName);
            if (command) {
                try {
                    await command.execute(interaction, this);
                } catch (error) {
                    console.error('Command execution error:', error);
                    const content = 'There was an error executing this command!';
                    
                    try {
                        if (interaction.deferred) {
                            await interaction.editReply({ content, ephemeral: true });
                        } else if (!interaction.replied) {
                            await interaction.reply({ content, ephemeral: true });
                        }
                    } catch (replyError) {
                        console.error('Failed to send error message:', replyError);
                    }
                }
            }
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            if (this.shouldAutoPlay) {
                this.playNext();
            }
        });

        this.player.on('error', (error) => {
            console.error('Audio player error:', error);
            this.playNext();
        });

        // Add error handler for unhandled rejections
        process.on('unhandledRejection', (error) => {
            console.error('Unhandled rejection:', error);
        });

        // Add error handler for the client
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
        });
    }

    setupWebServer() {
        const app = express();
        const port = process.env.PORT || 3000;

        app.get('/', (req, res) => {
            res.json({
                status: 'online',
                bot: this.client.user?.tag || 'Not ready',
                uptime: process.uptime(),
                playing: this.isPlaying
            });
        });

        app.listen(port, () => {
            console.log(`🌐 Web server running on port ${port}`);
        });
    }

    async autoJoinAndPlay() {
        try {
            const guild = this.client.guilds.cache.first();
            if (!guild) {
                console.log('No guild found');
                return;
            }

            let voiceChannel;
            if (process.env.VOICE_CHANNEL_ID) {
                voiceChannel = guild.channels.cache.get(process.env.VOICE_CHANNEL_ID);
            }

            if (!voiceChannel) {
                voiceChannel = guild.channels.cache.find(channel => 
                    channel.type === 2 && // Voice channel type
                    channel.members.size > 0
                );
            }

            if (!voiceChannel) {
                voiceChannel = guild.channels.cache.find(channel => channel.type === 2);
            }

            if (voiceChannel) {
                await this.joinChannel(voiceChannel);
                this.startRadio();
            } else {
                console.log('No voice channel found to join');
            }
        } catch (error) {
            console.error('Auto join error:', error);
        }
    }

    async joinChannel(voiceChannel) {
        this.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        this.connection.subscribe(this.player);

        this.connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Disconnected from voice channel');
            setTimeout(() => {
                if (this.connection.state.status === VoiceConnectionStatus.Disconnected) {
                    console.log('Attempting to reconnect...');
                    try {
                        this.connection.rejoin();
                    } catch (error) {
                        console.error('Failed to rejoin voice channel:', error);
                        this.connection.destroy();
                        // Attempt to rejoin the channel after a delay
                        setTimeout(() => {
                            this.autoJoinAndPlay();
                        }, 10000);
                    }
                }
            }, 5000);
        });

        this.connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('Voice connection destroyed, attempting to rejoin...');
            setTimeout(() => {
                this.autoJoinAndPlay();
            }, 5000);
        });

        this.connection.on('error', (error) => {
            console.error('Voice connection error:', error);
        });

        console.log(`🔊 Joined voice channel: ${voiceChannel.name}`);
    }

    startRadio() {
        console.log('🎵 Starting SriRadio...');
        this.playNext();
        this.scheduleDJBreak();
    }

    async playNext() {
        try {
            // Clear any existing timeout
            if (this.playNextTimeout) {
                clearTimeout(this.playNextTimeout);
                this.playNextTimeout = null;
            }
            
            const track = await this.musicManager.getNextTrack();
            if (track) {
                console.log(`🎵 Now playing: ${track.title}`);
                const resource = createAudioResource(track.stream, {
                    inputType: track.inputType,
                    inlineVolume: true
                });
                
                resource.volume.setVolume(0.8);
                this.player.play(resource);
                this.isPlaying = true;
            } else {
                console.log('No tracks available, retrying in 10 seconds...');
                this.playNextTimeout = setTimeout(() => this.playNext(), 10000);
            }
        } catch (error) {
            console.error('Error playing next track:', error);
            this.playNextTimeout = setTimeout(() => this.playNext(), 5000);
        }
    }

    skipToNext() {
        console.log('⏭️ Skipping to next track...');
        this.shouldAutoPlay = true;
        this.player.stop(); // This will trigger AudioPlayerStatus.Idle -> playNext()
    }

    stopPlayback() {
        console.log('⏹️ Stopping playback...');
        this.shouldAutoPlay = false;
        this.player.stop();
        this.isPlaying = false;
        
        // Clear any scheduled playNext calls
        if (this.playNextTimeout) {
            clearTimeout(this.playNextTimeout);
            this.playNextTimeout = null;
        }
    }

    resumePlayback() {
        console.log('▶️ Resuming playback...');
        this.shouldAutoPlay = true;
        this.playNext();
    }

    scheduleDJBreak() {
        const interval = parseInt(process.env.DJ_BREAK_INTERVAL) || 300000; // 5 minutes default
        
        setTimeout(async () => {
            await this.playDJBreak();
            this.scheduleDJBreak(); // Schedule next DJ break
        }, interval);
    }

    async playDJBreak() {
        try {
            console.log('🎤 DJ Break starting...');
            const djAudio = await this.djManager.generateDJBreak();
            
            if (djAudio) {
                const resource = createAudioResource(djAudio, {
                    inputType: 'arbitrary',
                    inlineVolume: true
                });
                
                resource.volume.setVolume(0.9);
                this.player.play(resource);
                
                // Wait for DJ break to finish, then resume music
                this.player.once(AudioPlayerStatus.Idle, () => {
                    setTimeout(() => this.playNext(), 2000);
                });
            } else {
                console.log('Failed to generate DJ break, continuing with music');
                this.playNext();
            }
        } catch (error) {
            console.error('DJ break error:', error);
            this.playNext();
        }
    }

    async registerCommands() {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
                { body: commands.map(cmd => cmd.data.toJSON()) }
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    async start() {
        await this.registerCommands();
        await this.client.login(process.env.DISCORD_TOKEN);
    }
}

// Start the bot
const bot = new SriRadioBot();
bot.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down SriRadio Bot...');
    bot.client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

module.exports = SriRadioBot; 