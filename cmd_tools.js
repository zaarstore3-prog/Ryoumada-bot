import fetch from 'node-fetch';
import yts from 'yt-search';
import fs from 'fs';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export async function handleTools(sock, msg, from, sender, cmd, args, prefix) {
    switch(cmd) {
        // [FITUR PLAY - BYPASS CLOUDFLARE & MULTI-API PREMIUM]
        case 'play': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}play [judul lagu/penyanyi]` });
            await sock.sendMessage(from, { text: "🔍 *Mencari lagu di YouTube...*\n_Sistem sedang mengeksekusi server prioritas utama._" });
            
            try {
                let search = await yts(args.join(" "));
                if (!search || !search.videos || search.videos.length === 0) {
                    return sock.sendMessage(from, { text: "❌ Lagu tidak ditemukan." });
                }
                
                let video = search.videos[0];
                
                let infoText = `🎵 *RYOUMADA PLAY* 🎵\n\n` +
                               `📌 *Judul:* ${video.title}\n` +
                               `⏱️ *Durasi:* ${video.timestamp}\n` +
                               `👁️ *Views:* ${video.views}\n` +
                               `🔗 *Link:* ${video.url}\n\n` +
                               `_⏳ Sedang mengunduh Audio & Dokumen. Mohon jangan spam command..._`;
                
                await sock.sendMessage(from, { image: { url: video.thumbnail }, caption: infoText });
                
                let apis = [
                    `https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(video.url)}`,
                    `https://widipe.com/download/ytdl?url=${encodeURIComponent(video.url)}`,
                    `https://itzpire.com/download/youtube?url=${encodeURIComponent(video.url)}`,
                    `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(video.url)}`
                ];

                let audioBuffer = null;
                
                // Header penyamaran agar tidak ditolak oleh Cloudflare/Server API
                const headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                };

                for (let api of apis) {
                    try {
                        let res = await fetch(api, { headers });
                        let json = await res.json();
                        
                        let tempUrl = json?.data?.download || json?.data?.dl || json?.data?.url || json?.url || json?.result?.download?.url || json?.result?.url || json?.result;
                        
                        if (typeof tempUrl === 'string' && tempUrl.startsWith('http')) {
                            let fetchAudio = await fetch(tempUrl, { headers });
                            if (fetchAudio.ok) {
                                // Cegah download file HTML jika API error secara diam-diam
                                let cType = fetchAudio.headers.get('content-type');
                                if (cType && cType.includes('text/html')) continue; 

                                if (typeof fetchAudio.buffer === 'function') {
                                    audioBuffer = await fetchAudio.buffer();
                                } else {
                                    audioBuffer = Buffer.from(await fetchAudio.arrayBuffer());
                                }
                                break; 
                            }
                        }
                    } catch (e) { continue; }
                }

                // Fallback pamungkas menggunakan Cobalt API jika semua API WA Bot mati
                if (!audioBuffer) {
                    try {
                        let directRes = await fetch(`https://api.cobalt.tools/api/json`, {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                            },
                            body: JSON.stringify({ url: video.url, aFormat: "mp3", isAudioOnly: true })
                        });
                        let directJson = await directRes.json();
                        if (directJson?.url) {
                            let fA = await fetch(directJson.url, { headers });
                            if (typeof fA.buffer === 'function') {
                                audioBuffer = await fA.buffer();
                            } else {
                                audioBuffer = Buffer.from(await fA.arrayBuffer());
                            }
                        }
                    } catch (e) {}
                }

                if (!audioBuffer) throw new Error("Semua server API YouTube sedang down massal dari pusat.");

                let tempAudio = `./media/play_${sender.split('@')[0]}_${Date.now()}.mp3`;
                fs.writeFileSync(tempAudio, audioBuffer);

                await sock.sendMessage(from, { audio: { url: tempAudio }, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
                await sock.sendMessage(from, { document: { url: tempAudio }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3`, caption: `📄 File Dokumen: ${video.title}\n\n_Powered by RyouMada_` }, { quoted: msg });
                
                if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);

            } catch (err) {
                await sock.sendMessage(from, { text: `❌ *Gagal memutar lagu.*\nSistem API sedang maintenance massal atau jaringan sibuk. Silakan coba lagi nanti.\n\n_Log: ${err.message}_` });
            }
            break;
        }

        // [FITUR HD - BYPASS CLOUDFLARE & FILTER ERROR]
        case 'hd': case 'remini': {
            let qMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let imgMsg = qMsg?.imageMessage || msg.message?.imageMessage;
            
            if (!imgMsg) return sock.sendMessage(from, { text: `❌ Silakan reply foto atau kirim foto dengan caption *${prefix}hd*` });
            
            await sock.sendMessage(from, { text: "⏳ *Memproses Gambar HD...*\n_Sistem sedang mengeksekusi server prioritas utama._" });
            
            try {
                const stream = await downloadContentFromMessage(imgMsg, 'image');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                
                const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
                let imgUrl = null;

                // Uploader 1: Catbox
                try {
                    const bodyCatbox = Buffer.concat([
                        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`),
                        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
                        buffer,
                        Buffer.from(`\r\n--${boundary}--\r\n`)
                    ]);
                    
                    let uploadRes = await fetch('https://catbox.moe/user/api.php', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': `multipart/form-data; boundary=${boundary}`,
                            'User-Agent': 'Mozilla/5.0'
                        },
                        body: bodyCatbox
                    });
                    imgUrl = await uploadRes.text();
                    if (!imgUrl.startsWith("http")) throw new Error();
                } catch (e) {
                    // Uploader 2: Pomf
                    const bodyPomf = Buffer.concat([
                        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
                        buffer,
                        Buffer.from(`\r\n--${boundary}--\r\n`)
                    ]);
                    let uploadRes2 = await fetch('https://pomf.lain.la/upload.php', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': `multipart/form-data; boundary=${boundary}`,
                            'User-Agent': 'Mozilla/5.0'
                        },
                        body: bodyPomf
                    });
                    let json2 = await uploadRes2.json();
                    imgUrl = json2.files[0].url;
                }

                if (!imgUrl || !imgUrl.startsWith("http")) throw new Error("Gagal mengupload gambar ke Cloud. Jaringan sibuk.");
                
                let hdApis = [
                    `https://api.agatz.xyz/api/remini?url=${encodeURIComponent(imgUrl)}`,
                    `https://widipe.com/remini?url=${encodeURIComponent(imgUrl)}`,
                    `https://itzpire.com/tools/remini?url=${encodeURIComponent(imgUrl)}`,
                    `https://api.siputzx.my.id/api/tools/remini?url=${encodeURIComponent(imgUrl)}`
                ];

                let hdBuffer = null;
                const headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                };

                for (let api of hdApis) {
                    try {
                        let hdRes = await fetch(api, { headers });
                        
                        if (hdRes.ok) {
                            // Cek jika API malah mengembalikan Halaman Web Cloudflare
                            let cType = hdRes.headers.get('content-type');
                            if (cType && cType.includes('text/html')) continue; 

                            if (typeof hdRes.buffer === 'function') {
                                hdBuffer = await hdRes.buffer();
                            } else {
                                hdBuffer = Buffer.from(await hdRes.arrayBuffer());
                            }
                            break; 
                        } else {
                            // Antisipasi jika API merespon dalam bentuk JSON Link
                            let json = await hdRes.json();
                            let tempUrl = json?.data?.url || json?.url || json?.result;
                            if (typeof tempUrl === 'string' && tempUrl.startsWith('http')) {
                                let fImg = await fetch(tempUrl, { headers });
                                if (fImg.ok) {
                                    if (typeof fImg.buffer === 'function') {
                                        hdBuffer = await fImg.buffer();
                                    } else {
                                        hdBuffer = Buffer.from(await fImg.arrayBuffer());
                                    }
                                    break;
                                }
                            }
                        }
                    } catch (e) { continue; }
                }

                if (!hdBuffer) throw new Error("Semua server AI HD sedang antrian penuh.");
                
                let tempHd = `./media/hd_${sender.split('@')[0]}_${Date.now()}.jpg`;
                fs.writeFileSync(tempHd, hdBuffer);

                await sock.sendMessage(from, { image: { url: tempHd }, caption: "✨ *GAMBAR BERHASIL DI-HD-KAN* ✨\n_Kualitas resolusi dan kehalusan gambar telah ditingkatkan._" }, { quoted: msg });
                
                if (fs.existsSync(tempHd)) fs.unlinkSync(tempHd);
                
            } catch (err) {
                await sock.sendMessage(from, { text: `❌ *Gagal memproses gambar.*\nAPI Server sedang sibuk atau ada masalah jaringan.\n\n_Log Error: ${err.message}_` });
            }
            break;
        }
    }
}

