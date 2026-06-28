import { readDB, saveDB } from './database.js';

export async function handleAdminModeration(sock, msg, from, sender, cmd, args, u, isOwner, isAdmin, isOwnerUtama, prefix) {
    let db = readDB();
    
    let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
    let cleanArgs = args.filter(a => !a.startsWith('@'));
    if (args[0]?.toLowerCase() === 'me' || cleanArgs[0]?.toLowerCase() === 'me') {
        target = sender;
        cleanArgs = cleanArgs.filter(a => a.toLowerCase() !== 'me');
    }

    let roleSender = u.role || 'player';

    const checkImmunity = (targetJid) => {
        if (targetJid === db.global.owner_utama) return true;
        return false;
    };

    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        const regex = /^(\d+)([smhdy])$/i;
        const match = timeStr.match(regex);
        if (!match) return null;
        const val = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, y: 31536000000 };
        return val * multipliers[unit];
    };

    switch(cmd) {
        case 'addprem': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            if (roleSender === 'manajer owner' && checkImmunity(target) && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Manajer tidak bisa memodifikasi Owner Utama." });
            if (!target) return sock.sendMessage(from, { text: `❌ Format: ${prefix}addprem [@tag/reply]` });
            
            if (!db.users[target]) db.users[target] = {};
            db.users[target].isPremium = true;
            db.users[target].limit = 'UNLIMITED';
            
            if (!db.users[target].badges) db.users[target].badges = [];
            if (!db.users[target].badges.includes("💎 Premium User🎗️")) {
                db.users[target].badges.push("💎 Premium User🎗️");
                db.users[target].active_badge = "💎 Premium User🎗️";
            }
            saveDB(db);
            await sock.sendMessage(from, { text: `🌟 @${target.split('@')[0]} sekarang adalah Player Premium!\n🎁 Badge [ 💎 Premium User🎗️ ] ditambahkan otomatis.`, mentions: [target] });
            break;
        }

        case 'delprem': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            if (roleSender === 'manajer owner' && checkImmunity(target) && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Manajer tidak bisa memodifikasi Owner Utama." });
            if (!target) return sock.sendMessage(from, { text: `❌ Format: ${prefix}delprem [@tag/reply]` });
            
            if (db.users[target]) {
                db.users[target].isPremium = false;
                db.users[target].limit = 50;
                let badgeIdx = db.users[target].badges?.indexOf("💎 Premium User🎗️");
                if (badgeIdx > -1) db.users[target].badges.splice(badgeIdx, 1);
                saveDB(db);
                await sock.sendMessage(from, { text: `❌ Status Premium @${target.split('@')[0]} telah dicabut.`, mentions: [target] });
            }
            break;
        }

        case 'ban': case 'banned': {
            if (!isAdmin) return sock.sendMessage(from, { text: "❌ Akses ditolak. Hanya untuk Staff." });
            if (!target) return sock.sendMessage(from, { text: `❌ Format: ${prefix}ban [@tag/reply] [waktu:10s/5m/1d] [alasan]` });
            if (checkImmunity(target)) return sock.sendMessage(from, { text: "❌ Ditolak! Owner Utama kebal dari Banned." });
            
            let targetRole = db.users[target]?.role || 'player';
            if ((targetRole === 'owner' || targetRole === 'manajer owner') && !isOwnerUtama) {
                return sock.sendMessage(from, { text: "❌ Ditolak! Anda tidak memiliki wewenang mem-banned atasan/rekan Anda." });
            }

            let timeStr = cleanArgs[0];
            let banTimeMs = parseTime(timeStr);
            let reason = "";

            if (banTimeMs) {
                reason = cleanArgs.slice(1).join(" ") || "Melanggar aturan yang ditetapkan.";
            } else {
                banTimeMs = parseTime("1y"); // Default 1 Tahun jika tidak diketik
                reason = cleanArgs.join(" ") || "Melanggar aturan yang ditetapkan.";
            }

            if (!db.users[target]) db.users[target] = {};
            db.users[target].banned_until = Date.now() + banTimeMs; 
            db.users[target].banned_reason = reason;
            saveDB(db);
            await sock.sendMessage(from, { text: `🔨 @${target.split('@')[0]} telah di-BANNED.\n⏳ Durasi: ${timeStr || '1y'}\n📝 Alasan: ${reason}`, mentions: [target] });
            break;
        }

        case 'unban': {
            if (!isAdmin) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            if (!target) return sock.sendMessage(from, { text: `❌ Format: ${prefix}unban [@tag/reply]` });
            
            if (!db.users[target]) db.users[target] = {};
            db.users[target].banned_until = 0;
            db.users[target].banned_reason = "";
            saveDB(db);
            await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} telah di-UNBAN dan dapat bermain kembali.`, mentions: [target] });
            break;
        }
        
        // Fitur duplikat asmara telah dibersihkan dari file ini.
    }
}

