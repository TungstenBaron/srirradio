const { SlashCommandBuilder } = require('discord.js');

const commands = [
    // Status command
    {
        data: new SlashCommandBuilder()
            .setName('status')
            .setDescription('Check SriRadio bot status and current playing info'),
        async execute(interaction, bot) {
            const musicInfo = bot.musicManager.getPlaylistInfo();
            const djStats = bot.djManager.getDJStats();
            
            const embed = {
                color: 0x00ff00,
                title: '🎵 SriRadio Status',
                fields: [
                    {
                        name: '🔊 Currently Playing',
                        value: musicInfo.currentTrack ? 
                            `**${musicInfo.currentTrack.title}**\nDuration: ${musicInfo.currentTrack.duration}` :
                            'No track playing',
                        inline: true
                    },
                    {
                        name: '📚 Playlist Info',
                        value: `Total Songs: ${musicInfo.totalSongs}\nCurrent Position: ${musicInfo.currentIndex}/${musicInfo.totalSongs}`,
                        inline: true
                    },
                    {
                        name: '🎤 DJ Status',
                        value: `AI DJ: ${djStats.aiEnabled ? '✅ Enabled' : '❌ Disabled'}\nTotal Announcements: ${djStats.totalMessages}`,
                        inline: true
                    },
                    {
                        name: '⏭️ Up Next',
                        value: musicInfo.nextTrack ? musicInfo.nextTrack.title : 'Shuffling...',
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'SriRadio - 24/7 Music Stream'
                }
            };

            await interaction.reply({ embeds: [embed] });
        }
    },

    // Add song command
    {
        data: new SlashCommandBuilder()
            .setName('add')
            .setDescription('Add a song to the playlist')
            .addStringOption(option =>
                option.setName('song')
                    .setDescription('Song title or YouTube search query')
                    .setRequired(true)
            ),
        async execute(interaction, bot) {
            await interaction.deferReply();
            
            const query = interaction.options.getString('song');
            const addedSong = await bot.musicManager.addSong(query);
            
            if (addedSong) {
                const embed = {
                    color: 0x00ff00,
                    title: '✅ Song Added',
                    description: `**${addedSong.title}** has been added to the playlist!`,
                    fields: [
                        {
                            name: 'Duration',
                            value: addedSong.duration,
                            inline: true
                        },
                        {
                            name: 'Position in Queue',
                            value: `${bot.musicManager.playlist.length}`,
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString()
                };
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    content: '❌ Could not find or add that song. Please try a different search term.',
                    ephemeral: true
                });
            }
        }
    },

    // Search songs command
    {
        data: new SlashCommandBuilder()
            .setName('search')
            .setDescription('Search for songs to add to playlist')
            .addStringOption(option =>
                option.setName('query')
                    .setDescription('Search query for songs')
                    .setRequired(true)
            ),
        async execute(interaction, bot) {
            await interaction.deferReply();
            
            const query = interaction.options.getString('query');
            const results = await bot.musicManager.searchSongs(query, 5);
            
            if (results.length > 0) {
                const embed = {
                    color: 0x0099ff,
                    title: `🔍 Search Results for "${query}"`,
                    description: 'Use `/add [song title]` to add any of these songs:',
                    fields: results.map((song, index) => ({
                        name: `${index + 1}. ${song.title}`,
                        value: `Duration: ${song.duration}`,
                        inline: false
                    })),
                    timestamp: new Date().toISOString()
                };
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    content: '❌ No songs found for that search query.',
                    ephemeral: true
                });
            }
        }
    },

    // Skip command (admin only)
    {
        data: new SlashCommandBuilder()
            .setName('skip')
            .setDescription('Skip the current song (Admin only)'),
        async execute(interaction, bot) {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has('Administrator')) {
                await interaction.reply({
                    content: '❌ You need administrator permissions to use this command.',
                    ephemeral: true
                });
                return;
            }

            const currentTrack = bot.musicManager.getCurrentTrack();
            if (currentTrack && bot.isPlaying) {
                bot.skipToNext();
                
                await interaction.reply({
                    content: `⏭️ Skipped **${currentTrack.title}**`,
                    ephemeral: false
                });
            } else {
                await interaction.reply({
                    content: '❌ No song is currently playing.',
                    ephemeral: true
                });
            }
        }
    },

    // Stop command (admin only)
    {
        data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stop music playback completely (Admin only)'),
        async execute(interaction, bot) {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has('Administrator')) {
                await interaction.reply({
                    content: '❌ You need administrator permissions to use this command.',
                    ephemeral: true
                });
                return;
            }

            if (bot.isPlaying) {
                bot.stopPlayback();
                
                await interaction.reply({
                    content: `⏹️ Music playback stopped. Use \`/resume\` to continue playing.`,
                    ephemeral: false
                });
            } else {
                await interaction.reply({
                    content: '❌ No music is currently playing.',
                    ephemeral: true
                });
            }
        }
    },

    // Resume command (admin only)
    {
        data: new SlashCommandBuilder()
            .setName('resume')
            .setDescription('Resume music playback (Admin only)'),
        async execute(interaction, bot) {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has('Administrator')) {
                await interaction.reply({
                    content: '❌ You need administrator permissions to use this command.',
                    ephemeral: true
                });
                return;
            }

            if (!bot.isPlaying) {
                bot.resumePlayback();
                
                await interaction.reply({
                    content: `▶️ Music playback resumed!`,
                    ephemeral: false
                });
            } else {
                await interaction.reply({
                    content: '❌ Music is already playing.',
                    ephemeral: true
                });
            }
        }
    },

    // Announce command (admin only)
    {
        data: new SlashCommandBuilder()
            .setName('announce')
            .setDescription('Make a custom DJ announcement (Admin only)')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('The announcement message')
                    .setRequired(true)
            ),
        async execute(interaction, bot) {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has('Administrator')) {
                await interaction.reply({
                    content: '❌ You need administrator permissions to use this command.',
                    ephemeral: true
                });
                return;
            }

            await interaction.deferReply();
            
            const message = interaction.options.getString('message');
            
            try {
                const announcement = await bot.djManager.generateCustomAnnouncement(message);
                if (announcement) {
                    // Play the announcement immediately
                    const { createAudioResource } = require('@discordjs/voice');
                    const resource = createAudioResource(announcement, {
                        inputType: 'arbitrary',
                        inlineVolume: true
                    });
                    
                    bot.player.play(resource);
                    
                    await interaction.editReply({
                        content: `📢 Announcement queued: "${message}"`
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Failed to generate announcement.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Announcement error:', error);
                await interaction.editReply({
                    content: '❌ Error creating announcement.',
                    ephemeral: true
                });
            }
        }
    },

    // Playlist command
    {
        data: new SlashCommandBuilder()
            .setName('playlist')
            .setDescription('View current playlist information'),
        async execute(interaction, bot) {
            const musicInfo = bot.musicManager.getPlaylistInfo();
            const recentSongs = bot.musicManager.playlist.slice(
                Math.max(0, musicInfo.currentIndex - 3),
                musicInfo.currentIndex + 2
            );

            const embed = {
                color: 0xff9900,
                title: '📚 Current Playlist',
                description: `Showing recent songs around current position (${musicInfo.currentIndex}/${musicInfo.totalSongs})`,
                fields: recentSongs.map((song, index) => {
                    const actualIndex = Math.max(0, musicInfo.currentIndex - 3) + index;
                    const isCurrent = actualIndex === musicInfo.currentIndex - 1;
                    return {
                        name: `${isCurrent ? '▶️' : '⏸️'} ${actualIndex + 1}. ${song.title}`,
                        value: `Duration: ${song.duration} | Added: ${new Date(song.addedAt).toLocaleDateString()}`,
                        inline: false
                    };
                }),
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Total songs: ${musicInfo.totalSongs} | Playlist reshuffles every 30 minutes`
                }
            };

            await interaction.reply({ embeds: [embed] });
        }
    },

    // Help command
    {
        data: new SlashCommandBuilder()
            .setName('help')
            .setDescription('Show all available commands'),
        async execute(interaction) {
            const embed = {
                color: 0x9932cc,
                title: '🎵 SriRadio Commands',
                description: 'Here are all the available commands:',
                fields: [
                    {
                        name: '🔍 `/status`',
                        value: 'Check bot status and current playing info',
                        inline: false
                    },
                    {
                        name: '➕ `/add [song]`',
                        value: 'Add a song to the playlist',
                        inline: false
                    },
                    {
                        name: '🔍 `/search [query]`',
                        value: 'Search for songs',
                        inline: false
                    },
                    {
                        name: '📚 `/playlist`',
                        value: 'View current playlist',
                        inline: false
                    },
                    {
                        name: '⏭️ `/skip` (Admin)',
                        value: 'Skip current song',
                        inline: false
                    },
                    {
                        name: '⏹️ `/stop` (Admin)',
                        value: 'Stop music playback completely',
                        inline: false
                    },
                    {
                        name: '▶️ `/resume` (Admin)',
                        value: 'Resume music playback',
                        inline: false
                    },
                    {
                        name: '📢 `/announce [message]` (Admin)',
                        value: 'Make custom DJ announcement',
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'SriRadio - Your 24/7 Music Companion'
                }
            };

            await interaction.reply({ embeds: [embed] });
        }
    }
];

module.exports = commands; 