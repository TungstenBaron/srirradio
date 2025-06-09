const ytdl = require('@distube/ytdl-core');
const YoutubeSearchApi = require('youtube-search-api');
const fs = require('fs-extra');
const path = require('path');

class MusicManager {
    constructor() {
        this.playlist = [];
        this.currentIndex = 0;
        this.playlistPath = path.join(__dirname, '../data/playlist.json');
        this.lastShuffleTime = 0;
        this.shuffleInterval = 30 * 60 * 1000; // Reshuffle every 30 minutes
        
        this.loadPlaylist();
    }

    async loadPlaylist() {
        try {
            // Ensure data directory exists
            await fs.ensureDir(path.dirname(this.playlistPath));
            
            if (await fs.pathExists(this.playlistPath)) {
                const data = await fs.readJson(this.playlistPath);
                this.playlist = data.songs || [];
                console.log(`📚 Loaded ${this.playlist.length} songs from playlist`);
            } else {
                // Create default playlist with some popular tracks
                this.playlist = await this.createDefaultPlaylist();
                await this.savePlaylist();
            }
            
            this.shufflePlaylist();
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.playlist = await this.createDefaultPlaylist();
        }
    }

    async createDefaultPlaylist() {
        console.log('🎵 Creating default playlist...');
        const defaultSongs = [
            // Mix of popular songs across genres
            'Bohemian Rhapsody Queen',
            'Hotel California Eagles',
            'Stairway to Heaven Led Zeppelin',
            'Imagine John Lennon',
            'Sweet Child O Mine Guns N Roses',
            'Billie Jean Michael Jackson',
            'Smells Like Teen Spirit Nirvana',
            'Wonderwall Oasis',
            'Hey Jude The Beatles',
            'Don\'t Stop Believin Journey',
            'Thunderstruck AC/DC',
            'Bohemian Like You The Dandy Warhols',
            'Mr. Brightside The Killers',
            'Seven Nation Army The White Stripes',
            'Radioactive Imagine Dragons',
            'Uptown Funk Bruno Mars',
            'Shape of You Ed Sheeran',
            'Blinding Lights The Weeknd',
            'Levitating Dua Lipa',
            'Good 4 U Olivia Rodrigo'
        ];

        const playlist = [];
        for (const song of defaultSongs) {
            try {
                console.log(`🔍 Searching for: ${song}`);
                const searchResults = await YoutubeSearchApi.GetListByKeyword(song, false, 1);
                if (searchResults.items && searchResults.items.length > 0) {
                    const video = searchResults.items[0];
                    playlist.push({
                        title: video.title,
                        url: `https://www.youtube.com/watch?v=${video.id}`,
                        duration: video.length?.simpleText || 'Unknown',
                        artist: song.split(' ').slice(-1)[0], // Last word as artist approximation
                        addedAt: new Date().toISOString()
                    });
                    console.log(`✅ Added: ${video.title}`);
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`❌ Error searching for ${song}:`, error.message);
            }
        }

        console.log(`🎵 Created default playlist with ${playlist.length} songs`);
        return playlist;
    }

    shufflePlaylist() {
        console.log('🔀 Shuffling playlist...');
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
        this.currentIndex = 0;
        this.lastShuffleTime = Date.now();
    }

    async getNextTrack() {
        try {
            // Check if we need to reshuffle
            if (Date.now() - this.lastShuffleTime > this.shuffleInterval) {
                this.shufflePlaylist();
            }

            // If we've reached the end, reshuffle and start over
            if (this.currentIndex >= this.playlist.length) {
                this.shufflePlaylist();
            }

            if (this.playlist.length === 0) {
                console.log('Playlist is empty, attempting to reload...');
                await this.loadPlaylist();
                return null;
            }

            const track = this.playlist[this.currentIndex];
            this.currentIndex++;

            // Get streamable URL
            const stream = await this.getStreamableUrl(track.url);
            
            return {
                ...track,
                stream: stream,
                inputType: 'arbitrary'
            };
        } catch (error) {
            console.error('Error getting next track:', error);
            // Skip to next track on error
            this.currentIndex++;
            return this.getNextTrack();
        }
    }

    async getStreamableUrl(youtubeUrl) {
        try {
            const info = await ytdl.getInfo(youtubeUrl);
            const format = ytdl.chooseFormat(info.formats, { 
                quality: 'highestaudio',
                filter: 'audioonly'
            });
            
            return ytdl(youtubeUrl, { format: format });
        } catch (error) {
            console.error('Error getting streamable URL:', error);
            throw error;
        }
    }

    async addSong(query) {
        try {
            const searchResults = await YoutubeSearchApi.GetListByKeyword(query, false, 1);
            if (searchResults.items && searchResults.items.length > 0) {
                const video = searchResults.items[0];
                const song = {
                    title: video.title,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    duration: video.length?.simpleText || 'Unknown',
                    artist: 'Unknown',
                    addedAt: new Date().toISOString()
                };
                
                this.playlist.push(song);
                await this.savePlaylist();
                console.log(`➕ Added song: ${song.title}`);
                return song;
            }
            return null;
        } catch (error) {
            console.error('Error adding song:', error);
            return null;
        }
    }

    async removeSong(index) {
        if (index >= 0 && index < this.playlist.length) {
            const removed = this.playlist.splice(index, 1)[0];
            await this.savePlaylist();
            console.log(`➖ Removed song: ${removed.title}`);
            return removed;
        }
        return null;
    }

    async savePlaylist() {
        try {
            await fs.writeJson(this.playlistPath, {
                songs: this.playlist,
                lastUpdated: new Date().toISOString()
            }, { spaces: 2 });
            console.log('💾 Playlist saved');
        } catch (error) {
            console.error('Error saving playlist:', error);
        }
    }

    getCurrentTrack() {
        if (this.currentIndex > 0 && this.currentIndex <= this.playlist.length) {
            return this.playlist[this.currentIndex - 1];
        }
        return null;
    }

    getPlaylistInfo() {
        return {
            totalSongs: this.playlist.length,
            currentIndex: this.currentIndex,
            currentTrack: this.getCurrentTrack(),
            nextTrack: this.playlist[this.currentIndex] || null
        };
    }

    async searchSongs(query, limit = 5) {
        try {
            const searchResults = await YoutubeSearchApi.GetListByKeyword(query, false, limit);
            return searchResults.items?.map(video => ({
                title: video.title,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                duration: video.length?.simpleText || 'Unknown',
                thumbnail: video.thumbnail?.thumbnails?.[0]?.url
            })) || [];
        } catch (error) {
            console.error('Error searching songs:', error);
            return [];
        }
    }
}

module.exports = MusicManager; 