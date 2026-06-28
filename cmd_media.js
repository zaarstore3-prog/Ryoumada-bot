import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Buffer API langsung (Bypass WA Block)
async function fetchMediaBuffer(url) {
    let res = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 30000 
    });
    if (!res.ok) throw new Error("Gagal mengambil buffer");
    return Buffer.from(await res.arrayBuffer());
}

// Targeted Extraction API Server (Anti Error Struktur)
async function fetchDownloadUrl(type, url) {
    try {
        if (type === 'ytmp3') {
            let res = await fetch(`https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res && res.result && res.result.download && res.result.download.url) return res.result.download.url;
            let res2 = await fetch(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res2 && res2.url) return res2.url;
        }
        else if (type === 'ytmp4') {
            let res = await fetch(`https://api.vreden.web.id/api/ytmp4?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res && res.result && res.result.download && res.result.download.url) return res.result.download.url;
            let res2 = await fetch(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res2 && res2.url) return res2.url;
        }
        else if (type === 'ig') {
            let res = await fetch(`https://api.vreden.web.id/api/igdl?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res && res.result) return Array.isArray(res.result) ? res.result : [res.result];
        }
        else if (type === 'fb') {
            let res = await fetch(`https://api.vreden.web.id/api/fbdl?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res && res.result && res.result.Normal_video) return res.result.Normal_video;
            let res2 = await fetch(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`).then(r=>r.json()).catch(()=>null);
            if (res2 && res2.url) return res2.url;
        }
    } catch (e) { return null; }
    return null;
}

export async function handleMedia(sock, msg, from, sender, cmd, args, prefix) {
    switch(cmd) {
        
        case 's': case 'stiker': case 'sticker': {
            const targetMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message.imageMessage;
            if (!targetMessage) return sock.sendMessage(from, { text: `❌ Kirim/balas gambar dengan ${prefix}stiker` });
            await sock.sendMessage(from, { text: `⏳ *Membuat stiker...*` });
            
            try {
                const stream = await downloadContentFromMessage(targetMessage, 'image');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

                const tmpIn = path.join(process.cwd(), `temp_in_${Date.now()}.jpg`);
                const tmpOut = path.join(process.cwd(), `temp_out_${Date.now()}.webp`);
                fs.writeFileSync(tmpIn, buffer);
                
                exec(`ffmpeg -i ${tmpIn} -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${tmpOut}`, async (err) => {
                    if (!err) {
                        await sock.sendMessage(from, { sticker: fs.readFileSync(tmpOut) });
                        fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
                    } else {
                        sock.sendMessage(from, { text: `❌ *Gagal membuat stiker.*\nPastikan 'ffmpeg' terinstal di VPS Anda.` });
                    }
                });
            } catch (e) { sock.sendMessage(from, { text: `❌ *Gagal mengambil gambar.*` }); }
            break;
        }

         case 'hd': case 'remini': {
            const qMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isImage = msg.message?.imageMessage || (qMsg && qMsg.imageMessage);
            
            if (!isImage) return sock.sendMessage(from, { text: `❌ Kirim foto dengan caption ${prefix}hd atau balas foto yang sudah ada dengan perintah ${prefix}hd` });
            
            await sock.sendMessage(from, { text: `⏳ *Memproses Gambar HD...*\n_Sistem sedang mengeksekusi server prioritas utama._` });
            
            try {
                const mediaMsg = msg.message?.imageMessage ? msg.message.imageMessage : qMsg.imageMessage;
                const stream = await downloadContentFromMessage(mediaMsg, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                
                let form = new FormData();
                form.append('image', buffer, { filename: 'image.jpg' });
                
                // Endpoint API Remini AI (Menggunakan Axios ES Module)
                let res = await axios.post('https://api.ryzendesu.vip/api/ai/remini', form, {
                    headers: { ...form.getHeaders() },
                    responseType: 'arraybuffer'
                });
                
                if (res.data) {
                    await sock.sendMessage(from, { image: res.data, caption: `✨ *Selesai! Resolusi gambar berhasil ditingkatkan.*` });
                } else {
                    throw new Error("Respon API Kosong");
                }
            } catch (err) {
                console.error("Error Fitur HD:", err.message);
                sock.sendMessage(from, { text: `❌ Gagal memproses gambar HD.\nSeluruh server AI sedang sibuk atau ada masalah jaringan.` });
            }
            break;
        }

        case 'play': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}play [Judul Lagu]` });
            let query = args.join(" ");
            await sock.sendMessage(from, { text: `⏳ *Mencari:* ${query}...` });

            let searchJson = await fetch(`https://api.vreden.web.id/api/ytsearch?query=${encodeURIComponent(query)}`).then(r=>r.json()).catch(()=>null);
            if (!searchJson || !searchJson.result) return sock.sendMessage(from, { text: `❌ *Lagu tidak ditemukan.*` });
            
            let videoUrl = searchJson.result[0].url;
            let title = searchJson.result[0].title;
            let thumb = searchJson.result[0].thumbnail;

            let txt = `🎵 *RYOUMADA PLAY* 🎵\n\n📌 *Judul:* ${title}\n⏳ _Mengunduh Audio..._`;
            if (thumb) await sock.sendMessage(from, { image: await fetchMediaBuffer(thumb), caption: txt });

            let audioUrl = await fetchDownloadUrl('ytmp3', videoUrl);
            if (!audioUrl) return sock.sendMessage(from, { text: `❌ *Gagal mengunduh audio.* Server sedang down.` });

            try {
                let audioBuff = await fetchMediaBuffer(audioUrl);
                await sock.sendMessage(from, { audio: audioBuff, mimetype: 'audio/mpeg', ptt: false });
            } catch(e) {
                sock.sendMessage(from, { text: `❌ *Gagal mengirim file audio ke WA.*` });
            }
            break;
        }

        case 'tiktok': case 'tt': case 'tiktokhd': case 'tiktokmp4': case 'tiktokmp3': {
            if(!args[0]) return sock.sendMessage(from, {text: `❌ Format: ${prefix}tiktok [Link TikTok]`});
            if(cmd === 'tiktok' || cmd === 'tt') {
                let txtTt = `🎵 *TIKTOK DOWNLOADER* 🎵\n\nPilih kualitas/jenis:\n1️⃣ Video HD\n2️⃣ Video Normal\n3️⃣ Audio (MP3)\n\n_Balas dengan angka_\n\n(URL_A: ${args[0]})`;
                return sock.sendMessage(from, {text: txtTt});
            }
            
            await sock.sendMessage(from, { text: "⏳ *Sedang memproses unduhan TikTok...*" });
            let json = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(args[0])}`).then(r=>r.json()).catch(()=>null);
            if (!json || !json.data) return sock.sendMessage(from, { text: `❌ *Link TikTok gagal diekstrak.*` });

            let isAudio = cmd === 'tiktokmp3';
            let resultUrl = isAudio ? json.data.music : (json.data.hdplay || json.data.play);

            try {
                let buff = await fetchMediaBuffer(resultUrl); 
                if (isAudio) await sock.sendMessage(from, { audio: buff, mimetype: 'audio/mpeg', ptt: false });
                else await sock.sendMessage(from, { video: buff, caption: "📱 *TIKTOK DOWNLOADED*", mimetype: 'video/mp4' });
            } catch(e) { sock.sendMessage(from, { text: "❌ *Gagal mengirim file TikTok.*" }); }
            break;
        }

        case 'ytmp4': case 'ytmp4_360': case 'ytmp4_720': case 'ytmp4_1080': {
            if(!args[0]) return sock.sendMessage(from, {text: `❌ Format: ${prefix}ytmp4 [Link YouTube]`});
            if (cmd === 'ytmp4') {
                return sock.sendMessage(from, {text: `🎥 *YOUTUBE MP4* 🎥\nPilih kualitas:\n1️⃣ 360p\n2️⃣ 720p\n3️⃣ 1080p\n\n_Balas dengan angka 1, 2, atau 3_\n\n(URL_A: ${args[0]})`});
            }
            await sock.sendMessage(from, { text: "⏳ *Mendownload Video YouTube...*" });
            
            let vidUrl = await fetchDownloadUrl('ytmp4', args[0]);
            if (!vidUrl) return sock.sendMessage(from, { text: `❌ *Gagal mengunduh YT MP4.* Server down.` });

            try {
                let buff = await fetchMediaBuffer(vidUrl);
                await sock.sendMessage(from, { video: buff, caption: `🎥 *YOUTUBE MP4 Selesai.*`, mimetype: 'video/mp4' });
            } catch(e) {
                sock.sendMessage(from, { text: `❌ *Gagal mengirim video YT.* Ukuran file mungkin melebihi batas 100MB WhatsApp.` });
            }
            break;
        }

        case 'ytmp3': case 'ytmp3_128': case 'ytmp3_320': {
            if(!args[0]) return sock.sendMessage(from, {text: `❌ Format: ${prefix}ytmp3 [Link YouTube]`});
            if (cmd === 'ytmp3') {
                return sock.sendMessage(from, {text: `🎧 *YOUTUBE MP3* 🎧\nPilih kualitas:\n1️⃣ 128kbps\n2️⃣ 320kbps\n\n_Balas dengan angka 1 atau 2_\n\n(URL_A: ${args[0]})`});
            }
            await sock.sendMessage(from, { text: "⏳ *Mendownload Audio YouTube...*" });
            
            let audUrl = await fetchDownloadUrl('ytmp3', args[0]);
            if (!audUrl) return sock.sendMessage(from, { text: `❌ *Link audio tidak tersedia dari server.*` });

            try {
                let buff = await fetchMediaBuffer(audUrl);
                await sock.sendMessage(from, { audio: buff, mimetype: 'audio/mpeg', ptt: false });
                await sock.sendMessage(from, { document: buff, mimetype: 'audio/mpeg', fileName: `RyouMada_Audio.mp3`, caption: `🎧 Dokumen audio.` });
            } catch(e) { sock.sendMessage(from, { text: "❌ *Gagal mengirim file audio ke WhatsApp.*" }); }
            break;
        }

        case 'fb': case 'facebook': case 'fb_sd': case 'fb_hd': {
            if(!args[0]) return sock.sendMessage(from, {text: `❌ Format: ${prefix}fb [Link FB]`});
            if (cmd === 'fb' || cmd === 'facebook') {
                return sock.sendMessage(from, {text: `🟦 *FACEBOOK DOWNLOADER* 🟦\nPilih kualitas:\n1️⃣ Normal (SD)\n2️⃣ Tinggi (HD)\n\n_Balas dengan angka 1 atau 2_\n\n(URL_A: ${args[0]})`});
            }
            await sock.sendMessage(from, { text: "⏳ *Mengambil video dari Facebook...*" });
            
            let vidUrl = await fetchDownloadUrl('fb', args[0]);
            if (!vidUrl) return sock.sendMessage(from, { text: "❌ *Link video FB tidak ditemukan di server.*" });

            try {
                let buff = await fetchMediaBuffer(vidUrl);
                await sock.sendMessage(from, { video: buff, caption: "🟦 *FACEBOOK VIDEO*", mimetype: 'video/mp4' });
            } catch(e) { sock.sendMessage(from, { text: "❌ *Gagal mengirim video FB (Ukuran melebihi batas).* " }); }
            break;
        }

        case 'ig': case 'instagram': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}${cmd} [URL Instagram]` });
            let txt = `📸 *INSTAGRAM DOWNLOADER* 📸\n\nPilih jenis unduhan:\n[ 1 ] Video / Reels\n[ 2 ] Foto / Slide\n\n_Balas pesan ini dengan angka 1 atau 2_\n\n(URL_A: ${args[0]})`;
            await sock.sendMessage(from, { text: txt });
            break;
        }

        case 'ig_video': case 'ig_slide': {
            let url = args[0];
            if (!url) return sock.sendMessage(from, { text: `❌ URL Instagram tidak ditemukan.` });
            
            await sock.sendMessage(from, { text: `⏳ *Memproses tautan Instagram...*` });
            
            try {
                // Menggunakan API Downloader IG Publik Terpercaya (Ryzendesu)
                let res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`);
                let json = await res.json();
                
                if (!json || !json.data || json.data.length === 0) {
                    return sock.sendMessage(from, { text: `❌ Media IG gagal diekstrak. Pastikan link valid dan akun tidak di-private.` });
                }

                for (let item of json.data) {
                    let mediaUrl = item.url;
                    if (!mediaUrl) continue;

                    if (cmd === 'ig_video') {
                        await sock.sendMessage(from, { video: { url: mediaUrl }, caption: `✅ *Berhasil mengunduh Video IG*` });
                    } else {
                        await sock.sendMessage(from, { image: { url: mediaUrl }, caption: `✅ *Berhasil mengunduh Slide IG*` });
                    }
                }
            } catch (err) {
                console.error("Error Fitur IG:", err.message);
                sock.sendMessage(from, { text: `❌ Media IG gagal diekstrak.\nAPI Server sedang sibuk, silakan coba beberapa saat lagi.` });
            }
            break;
        }
      }
  }
