import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, downloadContentFromMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs';
import { initDB, readDB, saveDB } from './database.js';

import { handleTicTacToe } from './cmd_tictactoe.js';
import { handleMenu } from './cmd_menu.js';
import { handleTools } from './cmd_tools.js';
import { handleAdminMain } from './cmd_admin_main.js';
import { handleAdminModeration } from './cmd_admin_moderation.js';
import { handleRPGItems } from './cmd_rpg_items.js';
import { handleRPGPinjol } from './cmd_rpg_pinjol.js';
import { handleGamesJudi } from './cmd_games_judi.js';
import { handleAdminAsmara } from './cmd_admin_asmara.js';
import { handleProfil } from './cmd_profil.js';
import { handleRPGEconomy } from './cmd_rpg_economy.js';
import { handleRPGMarket } from './cmd_rpg_market.js';
import { handleRPGMancing } from './cmd_rpg_mancing.js';
import { handleAsmara } from './cmd_asmara.js';
import { handleMedia } from './cmd_media.js';
import { handleGames } from './cmd_games.js';

initDB();
if (!global.games) global.games = {};
if (!global.spamTracker) global.spamTracker = {};
if (!global.trade_ikan) global.trade_ikan = {};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

function getAFKString(ms) {
    let y = Math.floor(ms / 31536000000); let d = Math.floor((ms % 31536000000) / 86400000);
    let h = Math.floor((ms % 86400000) / 3600000); let m = Math.floor((ms % 3600000) / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    let str = [];
    if (y > 0) str.push(`${y} Tahun`); if (d > 0) str.push(`${d} Hari`);
    if (h > 0) str.push(`${h} Jam`); if (m > 0) str.push(`${m} Menit`); if (s > 0) str.push(`${s} Detik`);
    return str.length > 0 ? str.join(', ') : "Baru saja";
}

async function startBot() {
    const isAuth = fs.existsSync('./auth_session/creds.json');
    let noWa = '';
    if (!isAuth) {
        console.log("\n=======================================");
        noWa = await question('📱 Masukkan nomor WA bot (Cth: 628...):\n> ');
        noWa = noWa.replace(/[^0-9]/g, '');
        console.log("=======================================");
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    const sock = makeWASocket({
        auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'), syncFullHistory: false
    });

    if (!isAuth && noWa) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(noWa);
                console.log(`\n🎟️ KODE PAIRING: ${code}\n`);
            } catch (err) { console.log(`❌ Gagal meminta kode.`); }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                console.log("❌ Sesi Logged Out. Hapus folder auth_session."); process.exit();
            } else { setTimeout(startBot, 5000); }
        } else if (connection === 'open') { console.log("✅ BOT RYOUMADA STABIL TERHUBUNG!"); }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]; if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid, sender = msg.key.participant || from;
        let text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";

        let db = readDB();
        if (!db.global) db.global = { antispam: false, klaim_pasangan: {}, pending_acc: {}, redeem_codes: {}, owner_utama: null, donatur: {}, acc_group: "", last_uid: 100000, whitelist_karakter: [] };
        if (!db.users[sender]) { db.global.last_uid += 1; db.users[sender] = { uid: db.global.last_uid }; }
        const u = db.users[sender];
        if (!u.uid) { db.global.last_uid += 1; u.uid = db.global.last_uid; }

        if (!u.name) u.name = msg.pushName || "Player";
        if (u.uang === undefined) u.uang = 5000;
        if (u.level === undefined) u.level = 1;
        if (u.xp === undefined) u.xp = 0;
        if (!u.role) u.role = 'player';
        if (!u.status_hubungan) u.status_hubungan = 'lajang';
        if (u.point_asmara === undefined) u.point_asmara = 0;
        if (!u.status_profil) u.status_profil = 'Saya menggunakan RyouMada';
        if (!u.location) u.location = 'Belum diatur';
        if (!u.badges) u.badges = ["👾RyouMada First Generation👾"];
        if (!u.active_badge) u.active_badge = "👾RyouMada First Generation👾";
        if (!u.cd) u.cd = { kerja: 0, interaksi: 0, setpf: 0 };
        if (!u.anak) u.anak = [];
        if (!u.invest) u.invest = {};
        if (!u.blacklist_karakter) u.blacklist_karakter = [];
        if (!u.distrik) u.distrik = 'Awal';
        if (!u.gender) u.gender = 'Belum diatur';
        if (u.exp_multiplier === undefined) u.exp_multiplier = 1;
        if (u.exp_buff_until === undefined) u.exp_buff_until = 0;
        if (u.banned_until === undefined) u.banned_until = 0;
        if (!u.joined_at) u.joined_at = Date.now();
        if (!u.kehamilan) u.kehamilan = { status: false, waktu_mulai: 0 };
        if (u.afk_time === undefined) u.afk_time = 0;
        if (u.energi === undefined) u.energi = 100;
        if (!u.inventory) u.inventory = {};
        if (u.hutang === undefined) u.hutang = 0;
        if (!u.pinjol) u.pinjol = { amount: 0, due_time: 0 };
        if (!u.fishing_gear) u.fishing_gear = { active_bait: null, bait_uses: 0, bait_max: 0, active_rod: null, rod_uses: 0, rod_max: 0 };

        let today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
        if (u.isPremium === undefined) u.isPremium = false;
        if (u.last_reset !== today) { if (!u.isPremium) u.limit = 50; u.last_reset = today; }
        if (u.isPremium) u.limit = 'UNLIMITED';

        if (u.exp_buff_until > 0 && Date.now() > u.exp_buff_until) {
            u.exp_multiplier = 1; u.exp_buff_until = 0;
            sock.sendMessage(from, { text: "⚠️ *Durasi Item Double EXP-mu telah habis!*" });
        }

        // 🔥 PERBAIKAN LOGIKA XP: XP Dibiarkan bertambah secara berkesinambungan tanpa dire-set ke 0 🔥
        u.xp += (5 * u.exp_multiplier);
        function getXpReq(lvl) { return lvl === 1 ? 100 : (lvl === 2 ? 500 : Math.pow(lvl, 2) * 125); }
        let isLvlUp = false;
        
        while (u.xp >= getXpReq(u.level)) {
            // (Logika pengurangan XP dihilangkan di sini agar bersifat kumulatif murni)
            u.level += 1;
            isLvlUp = true;
        }
        
        if (isLvlUp) {
            sock.sendMessage(from, { text: `🎉 *LEVEL UP!*\nSelamat ${u.name}, kamu berhasil naik ke *Level ${u.level}*!\n🌟 XP Kamu saat ini: ${u.xp}/${getXpReq(u.level)}` });
        }

        if (u.afk_time > 0) {
            let afkDuration = Date.now() - u.afk_time;
            sock.sendMessage(from, { text: `🔔 @${sender.split('@')[0]} telah kembali dari AFK.`, mentions: [sender] });
            u.afk_time = 0; u.afk_reason = ''; saveDB(db);
        }

        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (let jid of mentionedJid) {
            if (db.users[jid] && db.users[jid].afk_time > 0) {
                let afkDur = Date.now() - db.users[jid].afk_time;
                sock.sendMessage(from, { text: `💤 *SSSTTT!*\n@${jid.split('@')[0]} sedang AFK selama ${getAFKString(afkDur)}.\n📝 *Alasan:* ${db.users[jid].afk_reason}`, mentions: [jid] });
            }
        }

        let isGameAnswered = false;
        if (global.games[from]) {
            let game = global.games[from];
            let userAnswer = text.trim().toLowerCase();
            if (game.type === 'ryou100') {
                if (game.answers.includes(userAnswer) && !game.answered.includes(userAnswer)) {
                    game.answered.push(userAnswer);
                    if (!game.players[sender]) game.players[sender] = 0; game.players[sender] += 1;
                    let sisa = game.answers.length - game.answered.length;
                    sock.sendMessage(from, { text: `✅ *BENAR!* (@${sender.split('@')[0]})\nMenjawab: *${userAnswer.toUpperCase()}*\n_(Tersisa ${sisa})_`, mentions: [sender] });
                    isGameAnswered = true;
                    if (game.answered.length >= game.answers.length) {
                        let highestScore = 0; let winner = null;
                        for (let p in game.players) { if (game.players[p] > highestScore) { highestScore = game.players[p]; winner = p; } }
                        if (winner) {
                            if (!db.users[winner]) db.users[winner] = { uang: 5000, xp: 0 };
                            db.users[winner].uang = Number(db.users[winner].uang) + game.rewardUang; db.users[winner].xp = Number(db.users[winner].xp) + game.rewardXp; saveDB(db);
                            sock.sendMessage(from, { text: `🎊 *RYOU 100 SELESAI!*\n🏆 *Juara:* @${winner.split('@')[0]}\n🎁 *Hadiah:* Rp ${game.rewardUang.toLocaleString()} & ${game.rewardXp} XP`, mentions: [winner] });
                        }
                        delete global.games[from];
                    }
                }
            } else {
                let isCorrect = false;
                if (Array.isArray(game.answer)) { if (game.answer.some(ans => ans.toLowerCase() === userAnswer)) isCorrect = true; }
                else { if (game.answer.toLowerCase() === userAnswer) isCorrect = true; }
                if (isCorrect) {
                    u.uang = Number(u.uang) + game.rewardUang; u.xp = Number(u.xp) + game.rewardXp; saveDB(db);
                    sock.sendMessage(from, { text: `🎉 *JAWABAN BENAR!* (@${sender.split('@')[0]})\n🎁 *Hadiah:*\n💵 Rp ${game.rewardUang.toLocaleString()}\n🌟 ${game.rewardXp} XP`, mentions: [sender] });
                    delete global.games[from]; isGameAnswered = true;
                }
            }
        }

        saveDB(db);
        if (isGameAnswered) return;

        let isReplyCmd = false; let cmd = '', args = [], prefix = '.';
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || "";

        if ((quotedText.includes("Balas dengan angka") || quotedText.includes("Balas pesan ini dengan angka")) && /^[0-9]+$/.test(text.trim())) {
            const userReply = text.trim(); isReplyCmd = true;
            if (quotedText.includes("PANEL INTERAKSI")) {
                if (userReply === '1') cmd = 'beriuang'; else if (userReply === '2') cmd = 'act'; else if (userReply === '3') cmd = 'makan';
            } else if (quotedText.includes("INTERAKSI ACAK")) {
                if (u.act_session && u.act_session[userReply]) cmd = u.act_session[userReply];
                else return sock.sendMessage(from, { text: "❌ Pilihan kadaluwarsa. Ketik .act lagi." });
            } else if (quotedText.includes("TIKTOK")) {
                const urlMatch = quotedText.match(/URL_A:\s*(.*?)\)/); if (urlMatch) args[0] = urlMatch[1];
                if (userReply === '1') cmd = 'tiktokhd'; else if (userReply === '2') cmd = 'tiktokmp4'; else if (userReply === '3') cmd = 'tiktokmp3';
            } else if (quotedText.includes("YOUTUBE MP4")) {
                const urlMatch = quotedText.match(/URL_A:\s*(.*?)\)/); if (urlMatch) args[0] = urlMatch[1];
                if (userReply === '1') cmd = 'ytmp4_360'; else if (userReply === '2') cmd = 'ytmp4_720'; else if (userReply === '3') cmd = 'ytmp4_1080';
            } else if (quotedText.includes("YOUTUBE MP3")) {
                const urlMatch = quotedText.match(/URL_A:\s*(.*?)\)/); if (urlMatch) args[0] = urlMatch[1];
                if (userReply === '1') cmd = 'ytmp3_128'; else if (userReply === '2') cmd = 'ytmp3_320';
            } else if (quotedText.includes("FACEBOOK")) {
                const urlMatch = quotedText.match(/URL_A:\s*(.*?)\)/); if (urlMatch) args[0] = urlMatch[1];
                if (userReply === '1') cmd = 'fb_sd'; else if (userReply === '2') cmd = 'fb_hd';
            } else if (quotedText.includes("INSTAGRAM")) {
                const urlMatch = quotedText.match(/URL_A:\s*(.*?)\)/); if (urlMatch) args[0] = urlMatch[1];
                if (userReply === '1') cmd = 'ig_video'; else if (userReply === '2') cmd = 'ig_slide';
            } else if (quotedText.includes("RYOUMADA SHOP")) {
                if (userReply === '1') cmd = 'belixp'; else if (userReply === '2') cmd = 'belibuff'; else if (userReply === '3') cmd = 'crredeem';
            }
        }

        if (!isReplyCmd) {
            const isCmd = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.\/©^]/.test(text); if (!isCmd) return;
            prefix = text.charAt(0); args = text.slice(1).trim().split(/\s+/);
            let rawCmd = args.shift().toLowerCase();
            const aliases = { 'ps': 'pasangan', 'inv': 'investasi', 'm': 'uang', 'p': 'ping', 'k': 'kerja', 's': 'stiker', 'ikan': 'koleksi' };
            cmd = aliases[rawCmd] || rawCmd;
        }

        if (cmd === 'rvo' || cmd === 'readviewonce') {
            if (!quotedMsg) return sock.sendMessage(from, { text: `❌ Balas pesan View Once (Sekali Lihat) dengan perintah ${prefix}rvo` });
            
            let viewOnceMsg = quotedMsg.viewOnceMessageV2?.message || 
                              quotedMsg.viewOnceMessageV2Extension?.message || 
                              quotedMsg.viewOnceMessage?.message;
            
            let mediaData = null;
            let mediaType = null;

            if (viewOnceMsg) {
                mediaType = Object.keys(viewOnceMsg).find(k => k === 'imageMessage' || k === 'videoMessage' || k === 'audioMessage');
                if (mediaType) mediaData = viewOnceMsg[mediaType];
            } else {
                if (quotedMsg.imageMessage?.viewOnce) {
                    mediaType = 'imageMessage';
                    mediaData = quotedMsg.imageMessage;
                } else if (quotedMsg.videoMessage?.viewOnce) {
                    mediaType = 'videoMessage';
                    mediaData = quotedMsg.videoMessage;
                } else if (quotedMsg.audioMessage?.viewOnce) {
                    mediaType = 'audioMessage';
                    mediaData = quotedMsg.audioMessage;
                }
            }

            if (!mediaData || !mediaType) return sock.sendMessage(from, { text: `❌ Pesan yang dibalas bukan pesan View Once (Sekali Lihat) yang valid.` });
            
            await sock.sendMessage(from, { text: "⏳ *Membuka View Once...*" });
            try {
                let dlType = mediaType === 'imageMessage' ? 'image' : (mediaType === 'videoMessage' ? 'video' : 'audio');
                const stream = await downloadContentFromMessage(mediaData, dlType);
                let buffer = Buffer.from([]);
                for await(const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                
                let captionText = `🔓 *VIEW ONCE DIBUKA*\n\n📝 *Caption:* ${mediaData.caption || "Tidak ada caption"}`;
                
                if (mediaType === 'imageMessage') {
                    await sock.sendMessage(from, { image: buffer, caption: captionText });
                } else if (mediaType === 'videoMessage') {
                    await sock.sendMessage(from, { video: buffer, caption: captionText });
                } else if (mediaType === 'audioMessage') {
                    await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
                }
            } catch (e) {
                sock.sendMessage(from, { text: `❌ Gagal membuka media View Once. Pesan mungkin sudah ditarik oleh pengirim atau sudah kadaluwarsa.` });
            }
            return; 
        }

        if (db.global.antispam && cmd) {
            if (db.global.owner_utama !== sender) {
                if (!global.spamTracker[sender]) {
                    global.spamTracker[sender] = { count: 1, firstCmdTime: Date.now() };
                } else {
                    let nowTime = Date.now();
                    if (nowTime - global.spamTracker[sender].firstCmdTime <= 20000) {
                        global.spamTracker[sender].count += 1;
                        if (global.spamTracker[sender].count >= 4) {
                            u.banned_until = nowTime + 1800000; u.banned_reason = "Spam";
                            saveDB(db); delete global.spamTracker[sender];
                            return sock.sendMessage(from, { text: `🚨 *SISTEM KEAMANAN OTOMATIS* 🚨\n🔨 *AKUN DIBLOKIR SEMENTARA* selama 30 Menit.`, mentions: [sender] });
                        }
                    } else { global.spamTracker[sender] = { count: 1, firstCmdTime: nowTime }; }
                }
            }
        }

        if (u.banned_until > Date.now()) {
            return sock.sendMessage(from, { text: `🔨 *A K U N  D I B L O K I R*\nKamu tidak dapat menggunakan bot karena sedang dihukum.` });
        }

        const isOwnerUtama = (db.global.owner_utama === sender);
        const isOwner = u.role === 'owner' || u.role === 'manajer owner' || isOwnerUtama;
        const isAdmin = u.role === 'admin bot' || isOwner;

        if (from.endsWith('@g.us') && db.global.muted_groups && db.global.muted_groups[from]) {
            if (!isAdmin && !isOwner) return; 
        }

        if (cmd && !isOwner && !u.isPremium) {
            if (u.limit <= 0) return sock.sendMessage(from, { text: `❌ Limit command harian kamu sudah habis! Beli limit di .shop atau upgrade ke Premium.` });
            u.limit -= 1; saveDB(db);                                           
        }

        let hasReplied = false; 
        const sockProxy = {
            ...sock,
            sendMessage: async (jid, content, options = {}) => {
                if (!options.quoted && jid === from && !hasReplied) {
                    options.quoted = msg; hasReplied = true; 
                }
                return sock.sendMessage(jid, content, options);
            }
        };

        await handleTicTacToe(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleMenu(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleTools(sockProxy, msg, from, sender, cmd, args, prefix);
        await handleAdminMain(sockProxy, msg, from, sender, cmd, args, u, isOwner, isAdmin, isOwnerUtama, prefix);
        await handleAdminModeration(sockProxy, msg, from, sender, cmd, args, u, isOwner, isAdmin, isOwnerUtama, prefix);
        await handleRPGItems(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleRPGPinjol(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleGamesJudi(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleAdminAsmara(sockProxy, msg, from, sender, cmd, args, u, isOwner, isAdmin, prefix);
        await handleProfil(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleRPGEconomy(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleRPGMarket(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleRPGMancing(sockProxy, msg, from, sender, cmd, args, u, prefix);
        await handleAsmara(sockProxy, msg, from, sender, cmd, args, u, db, prefix);
        await handleMedia(sockProxy, msg, from, sender, cmd, args, prefix);
        await handleGames(sockProxy, msg, from, sender, cmd, args, u, prefix);
    });
}
startBot();
