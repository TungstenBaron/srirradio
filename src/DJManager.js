const Anthropic = require('@anthropic-ai/sdk');
const gtts = require('node-gtts');
const fs = require('fs-extra');
const path = require('path');

class DJManager {
    constructor() {
        this.anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        }) : null;
        
        this.tts = gtts(process.env.TTS_LANGUAGE || 'en');
        this.audioPath = path.join(__dirname, '../temp');
        this.djPrompts = this.getDJPrompts();
        this.lastDJContent = [];
        
        this.ensureAudioDirectory();
    }

    async ensureAudioDirectory() {
        await fs.ensureDir(this.audioPath);
    }

    getDJPrompts() {
        return [
            {
                type: 'welcome',
                prompt: `You are a friendly radio DJ for SriRadio. Create a warm, enthusiastic welcome message for new listeners. Keep it under 30 words. Be energetic and mention the continuous music stream.`
            },
            {
                type: 'transition',
                prompt: `You are a smooth radio DJ. Create a brief transition comment between songs. Mention how the music never stops on SriRadio. Keep it under 25 words and sound natural.`
            },
            {
                type: 'time_of_day',
                prompt: `You are a radio DJ. Create a time-appropriate greeting (morning, afternoon, evening, or late night) for SriRadio listeners. Keep it under 30 words and be engaging.`
            },
            {
                type: 'music_fact',
                prompt: `You are a knowledgeable radio DJ. Share a brief, interesting music fact or trivia. Keep it under 35 words and make it engaging for music lovers.`
            },
            {
                type: 'station_id',
                prompt: `You are a radio DJ doing a station identification. Mention SriRadio in a creative, memorable way. Keep it under 20 words and make it catchy.`
            },
            {
                type: 'weather_music',
                prompt: `You are a radio DJ. Make a brief comment connecting current weather/season to music vibes. Keep it under 30 words and be relatable.`
            },
            {
                type: 'community',
                prompt: `You are a radio DJ. Create a brief message thanking listeners and building community around SriRadio. Keep it under 30 words and be genuine.`
            }
        ];
    }

    async generateDJBreak() {
        try {
            if (!this.anthropic) {
                console.log('Claude not configured, using default DJ message');
                return this.generateDefaultDJBreak();
            }

            const prompt = this.getRandomPrompt();
            const djText = await this.generateDJText(prompt);
            
            if (djText) {
                const audioBuffer = await this.textToSpeech(djText);
                return audioBuffer;
            }
            
            return this.generateDefaultDJBreak();
        } catch (error) {
            console.error('Error generating DJ break:', error);
            return this.generateDefaultDJBreak();
        }
    }

    getRandomPrompt() {
        const currentHour = new Date().getHours();
        let availablePrompts = [...this.djPrompts];

        // Favor time-appropriate prompts
        if (currentHour >= 6 && currentHour < 12) {
            availablePrompts = availablePrompts.concat(
                Array(3).fill(this.djPrompts.find(p => p.type === 'time_of_day'))
            );
        } else if (currentHour >= 12 && currentHour < 18) {
            availablePrompts = availablePrompts.concat(
                Array(2).fill(this.djPrompts.find(p => p.type === 'transition'))
            );
        } else if (currentHour >= 18 && currentHour < 22) {
            availablePrompts = availablePrompts.concat(
                Array(2).fill(this.djPrompts.find(p => p.type === 'music_fact'))
            );
        } else {
            availablePrompts = availablePrompts.concat(
                Array(2).fill(this.djPrompts.find(p => p.type === 'community'))
            );
        }

        return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    }

    async generateDJText(prompt) {
        try {
            const completion = await this.anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 100,
                temperature: 0.8,
                system: `${prompt.prompt} 

                IMPORTANT RULES:
                - Keep response very brief and conversational
                - Sound natural when spoken aloud
                - No hashtags, emojis, or special characters
                - Speak directly to listeners
                - Avoid repeating previous content: ${this.lastDJContent.slice(-3).join(', ')}`,
                messages: [
                    {
                        role: "user",
                        content: `Generate a ${prompt.type} message for SriRadio.`
                    }
                ]
            });

            const djText = completion.content[0]?.text?.trim();
            
            if (djText) {
                // Track recent content to avoid repetition
                this.lastDJContent.push(djText);
                if (this.lastDJContent.length > 10) {
                    this.lastDJContent = this.lastDJContent.slice(-10);
                }
                
                console.log(`🎤 DJ (Claude): ${djText}`);
                return djText;
            }
            
            return null;
        } catch (error) {
            console.error('Error generating DJ text with Claude:', error);
            return null;
        }
    }

    async textToSpeech(text) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `dj_${Date.now()}.mp3`;
                const filepath = path.join(this.audioPath, filename);
                
                this.tts.save(filepath, text, () => {
                    // Read the file and return as buffer
                    fs.readFile(filepath, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        // Clean up the file after reading
                        fs.unlink(filepath, (unlinkErr) => {
                            if (unlinkErr) console.error('Error cleaning up TTS file:', unlinkErr);
                        });
                        
                        resolve(data);
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async generateDefaultDJBreak() {
        const defaultMessages = [
            "You're listening to SriRadio, where the music never stops!",
            "SriRadio keeps the beats flowing twenty four seven.",
            "Thanks for tuning in to SriRadio, your non-stop music destination.",
            "This is SriRadio, bringing you continuous music all day long.",
            "Keep it locked to SriRadio for the best music mix.",
            "SriRadio, where every song is a good song.",
            "You're vibing with SriRadio, your favorite music stream.",
            "Stay tuned to SriRadio for more amazing music.",
            "SriRadio, broadcasting the best tunes around the clock.",
            "Thanks for listening to SriRadio, where music lives."
        ];

        const randomMessage = defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
        console.log(`🎤 DJ (Default): ${randomMessage}`);
        
        try {
            return await this.textToSpeech(randomMessage);
        } catch (error) {
            console.error('Error generating default TTS:', error);
            return null;
        }
    }

    async generateCustomAnnouncement(text) {
        try {
            console.log(`🎤 Custom DJ: ${text}`);
            return await this.textToSpeech(text);
        } catch (error) {
            console.error('Error generating custom announcement:', error);
            return null;
        }
    }

    getDJStats() {
        return {
            aiEnabled: !!this.anthropic,
            recentMessages: this.lastDJContent.slice(-5),
            totalMessages: this.lastDJContent.length
        };
    }

    // Clean up old temporary files
    async cleanupTempFiles() {
        try {
            const files = await fs.readdir(this.audioPath);
            const now = Date.now();
            const maxAge = 60 * 60 * 1000; // 1 hour

            for (const file of files) {
                if (file.startsWith('dj_') && file.endsWith('.mp3')) {
                    const filepath = path.join(this.audioPath, file);
                    const stats = await fs.stat(filepath);
                    
                    if (now - stats.mtime.getTime() > maxAge) {
                        await fs.unlink(filepath);
                        console.log(`🧹 Cleaned up old TTS file: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }
}

module.exports = DJManager; 