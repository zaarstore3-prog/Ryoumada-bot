import { readDB, saveDB } from './database.js';

export async function handleAdminMain(sock, msg, from, sender, cmd, args, u, isOwner, isAdmin, isOwnerUtama, prefix) {
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
        case 'menuadmin': {
            if (!isAdmin) return sock.sendMessage(from, { text: "❌ Akses ditolak. Hanya untuk Staff." });
            let txt = `👑 *[ MENU ADMIN & OWNER ]* 👑\n\n`;
            
            txt += `⚙️ *SISTEM & KEAMANAN*\n`;
            txt += `├ ${prefix}antispam [on/off]\n`;
            txt += `├ ${prefix}mute / ${prefix}unmute\n`;
            txt += `│ _(Membisukan bot dari player di grup ini)_\n`;
            txt += `├ ${prefix}claimowner\n`;
            txt += `├ ${prefix}setaccgroup\n`;
            txt += `└ ${prefix}resetglobal\n\n`;
            
            txt += `👥 *MANAJEMEN PLAYER*\n`;
            txt += `├ ${prefix}addprem / ${prefix}delprem [@tag/reply]\n`;
            txt += `├ ${prefix}ban [@tag/reply] [10s/5m/1d] [Alasan]\n`;
            txt += `├ ${prefix}unban [@tag/reply]\n`;
            txt += `├ ${prefix}setdata [me/@tag] [uang/xp/limit/role/afk] [nilai]\n`;
            txt += `├ ${prefix}delrole [@tag]\n`;
            txt += `├ ${prefix}add [me/@tag] [uang/xp/pts/emas] [jml]\n`;
            txt += `├ ${prefix}delbadge [@tag/reply] [urutan angka]\n`;
            txt += `├ ${prefix}adddonate [@tag/reply] [jumlah]\n`;
            txt += `└ ${prefix}infostaff\n\n`;
            
            txt += `🎁 *REDEEM & ASMARA*\n`;
            txt += `├ ${prefix}buatredeem [uang=100|xp=50|limit=10|badge=VIP|expired=7]\n`;
            txt += `├ ${prefix}whitelistchar / ${prefix}delwhitelistchar [ID]\n`;
            txt += `├ ${prefix}cekwhitelistchar / ${prefix}cekblacklist [@tag/me]\n`;
            txt += `├ ${prefix}delblacklist [@tag/me] [ID Karakter]\n`;
            txt += `├ ${prefix}acc pf [Kode Unik]\n`;
            txt += `└ ${prefix}tolak pf [Kode Unik] [Alasan]`;
            
            await sock.sendMessage(from, { text: txt });
            break;
        }

        // 🔥 FITUR BARU: MUTE / UNMUTE 🔥
        case 'mute': {
            let isStaff = (roleSender === 'admin bot' || roleSender === 'owner' || roleSender === 'manajer owner' || isOwnerUtama);
            if (!isStaff) return sock.sendMessage(from, { text: "❌ Akses ditolak. Hanya untuk Staff (Admin/Owner)." });
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Fitur ini hanya dapat digunakan di dalam Grup." });
            
            if (!db.global.muted_groups) db.global.muted_groups = {};
            if (db.global.muted_groups[from]) return sock.sendMessage(from, { text: "⚠️ Bot sudah dalam status MUTE di grup ini." });
            
            db.global.muted_groups[from] = true; 
            saveDB(db);
            await sock.sendMessage(from, { text: "🔇 *BOT DI-MUTE* 🔇\n\nBot telah dibisukan di grup ini. Bot tidak akan merespon perintah dari Player biasa hingga di-unmute oleh Staff." });
            break;
        }

        case 'unmute': {
            let isStaff = (roleSender === 'admin bot' || roleSender === 'owner' || roleSender === 'manajer owner' || isOwnerUtama);
            if (!isStaff) return sock.sendMessage(from, { text: "❌ Akses ditolak. Hanya untuk Staff (Admin/Owner)." });
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "❌ Fitur ini hanya dapat digunakan di dalam Grup." });
            
            if (!db.global.muted_groups) db.global.muted_groups = {};
            if (!db.global.muted_groups[from]) return sock.sendMessage(from, { text: "⚠️ Bot tidak sedang dalam status MUTE di grup ini." });
            
            db.global.muted_groups[from] = false; 
            saveDB(db);
            await sock.sendMessage(from, { text: "🔊 *BOT DI-UNMUTE* 🔊\n\nBot kembali aktif dan siap merespon semua player di grup ini." });
            break;
        }

                case 'buatredeem': {
            if (!isOwner) return sock.sendMessage(from, { text: `❌ Khusus Owner!` });
            let argsString = args.join(" ");
            if (!argsString) return sock.sendMessage(from, { text: `❌ Format: ${prefix}buatredeem uang=1000|xp=500|limit=100|badge=VIP|doublexp=24|expired=7` });
            
            let rUang = 0, rXp = 0, rKuota = 1, rDoubleXp = 0, rLimitCmd = 0, rBadge = "", rExpired = 7;
            let params = argsString.split('|');
            
            for (let p of params) {
                let [key, val] = p.split('=');
                if (!key || !val) continue;
                key = key.trim().toLowerCase();
                val = val.trim();
                
                if (key === 'uang') rUang = parseInt(val) || 0;
                if (key === 'xp') rXp = parseInt(val) || 0;
                if (key === 'kuota' || key === 'limit') rKuota = parseInt(val) || 1;
                if (key === 'doublexp') rDoubleXp = parseInt(val) || 0;
                if (key === 'limitcmd') rLimitCmd = parseInt(val) || 0;
                if (key === 'badge') rBadge = val;
                if (key === 'expired') rExpired = parseInt(val) || 7;
            }

            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            let rwdObj = {};
            if (rUang > 0) rwdObj.uang = rUang;
            if (rXp > 0) rwdObj.xp = rXp;
            if (rDoubleXp > 0) rwdObj.double_xp_jam = rDoubleXp;
            if (rLimitCmd > 0) rwdObj.limit_cmd = rLimitCmd;
            if (rBadge) rwdObj.badge = rBadge;

            if (!db.global.redeem_codes) db.global.redeem_codes = {};
            db.global.redeem_codes[newCode] = { 
                reward: rwdObj, limit: rKuota, used: 0, claimed_by: [], expired: Date.now() + (86400000 * rExpired), creator: sender
            };
            saveDB(db);

            let rwdTxt = [];
            if (rUang > 0) rwdTxt.push(`UANG (${rUang})`);
            if (rXp > 0) rwdTxt.push(`XP (${rXp})`);
            if (rDoubleXp > 0) rwdTxt.push(`DOUBLE XP (${rDoubleXp} Jam)`);
            if (rLimitCmd > 0) rwdTxt.push(`LIMIT CMD (${rLimitCmd})`);
            if (rBadge) rwdTxt.push(`BADGE (${rBadge})`);

            let txtRes = `✅ *KODE REDEEM SERVER DIBUAT*\n\n` +
                         `🎫 Kode: *${newCode}*\n` +
                         `🎁 Hadiah: ${rwdTxt.join(' & ')}\n` +
                         `👥 Kuota: ${rKuota} Player\n` +
                         `⏳ Expired: ${rExpired} Hari\n\n` +
                         `_Silakan bagikan kode ini ke player._`;
            
            await sock.sendMessage(from, { text: txtRes });
            break;
        }

        case 'antispam': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            let status = args[0]?.toLowerCase();
            if (status === 'on') { db.global.antispam = true; await sock.sendMessage(from, { text: "✅ Sistem Anti-Spam DIAKTIFKAN." }); }
            else if (status === 'off') { db.global.antispam = false; await sock.sendMessage(from, { text: "✅ Sistem Anti-Spam DIMATIKAN." }); }
            else return sock.sendMessage(from, { text: `❌ Format: ${prefix}antispam [on/off]` });
            saveDB(db); break;
        }

        case 'claimowner': {
            if (db.global.owner_utama && sender !== db.global.owner_utama) {
                return sock.sendMessage(from, { text: "❌ Tahta Owner Utama sudah diklaim oleh orang lain! Sistem menolak kudeta." });
            }
            db.global.owner_utama = sender;
            u.role = 'owner'; saveDB(db);
            await sock.sendMessage(from, { text: "👑 *KLAIM BERHASIL* 👑\n\nAnda sekarang menjabat sebagai *Owner Utama*. Anda memiliki kekebalan mutlak di dalam sistem." });
            break;
        }

        case 'setaccgroup': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            db.global.acc_group = from; saveDB(db);
            await sock.sendMessage(from, { text: "✅ Grup ini telah ditetapkan sebagai pusat masuknya Request ACC Foto & Report." });
            break;
        }

        case 'resetglobal': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            for (let id in db.users) { db.users[id].uang = 5000; db.users[id].xp = 0; db.users[id].level = 1; }
            saveDB(db);
            await sock.sendMessage(from, { text: "⚠️ *WIPE OUT GLOBAL SELESAI* ⚠️\nSeluruh uang, level, dan XP player telah dikembalikan ke awal." });
            break;
        }

        case 'setdata': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Hanya Owner / Manajer Owner yang bisa menggunakan fitur ini." });
            if (!cleanArgs[0] || !target || !cleanArgs[1]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}setdata [me/@tag] [uang/xp/level/role/afk] [nilai]\nContoh: ${prefix}setdata @user role admin bot` });
            
            let tipe = cleanArgs[0].toLowerCase();
            let value = cleanArgs.slice(1).join(' '); 

            if (checkImmunity(target) && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Owner Utama kebal terhadap rekayasa data dari staff lain." });
            if (!db.users[target]) db.users[target] = {};

            if (tipe === 'role') {
                if (roleSender === 'manajer owner' && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Manajer Owner tidak memiliki hak untuk mengatur atau mengubah Role player." });
                let newRole = value.toLowerCase();
                if (!['admin bot', 'manajer owner', 'owner', 'player'].includes(newRole)) return sock.sendMessage(from, { text: "❌ Role tidak valid! Pilih: admin bot, manajer owner, owner, atau player." });
                
                db.users[target].role = newRole;
                if (!db.users[target].badges) db.users[target].badges = [];
                let badgeAdd = "";
                if (newRole === 'admin bot') badgeAdd = "⚒️ Admin Bot 🛡️";
                if (newRole === 'manajer owner') badgeAdd = "💘 Owner Assistant ❤️";
                if (newRole === 'owner') badgeAdd = "🎗️ RyouMada Own 🎗️";
                
                if (badgeAdd && !db.users[target].badges.includes(badgeAdd)) {
                    db.users[target].badges.push(badgeAdd);
                    db.users[target].active_badge = badgeAdd;
                }
                saveDB(db);
                await sock.sendMessage(from, { text: `✅ Role @${target.split('@')[0]} resmi diubah menjadi *${newRole.toUpperCase()}*`, mentions: [target] });
            } else {
                let valNum = parseInt(value);
                if (isNaN(valNum) && tipe !== 'limit' && tipe !== 'afk') return sock.sendMessage(from, { text: "❌ Value harus berupa angka." });
                if (tipe === 'afk') db.users[target].afk_time = valNum ? parseTime(value) + Date.now() : Date.now();
                else if (tipe === 'limit') db.users[target][tipe] = (value.toUpperCase() === 'UNLIMITED') ? 'UNLIMITED' : valNum;
                else db.users[target][tipe] = valNum;
                saveDB(db);
                await sock.sendMessage(from, { text: `✅ Berhasil mengatur/menimpa ${tipe.toUpperCase()} @${target.split('@')[0]} menjadi ${value}`, mentions: [target] });
            }
            break;
        }

        case 'add': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Hanya Owner / Manajer Owner." });
            if (!cleanArgs[0] || !target || !cleanArgs[1]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}add [me/@tag] [uang/xp/level/pts/inv_kode] [jml]` });
            if (checkImmunity(target) && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Tidak bisa memodifikasi data Owner Utama." });
            
            let tipe = cleanArgs[0].toLowerCase();
            let val = parseInt(cleanArgs[1]);
            if (isNaN(val)) return sock.sendMessage(from, { text: "❌ Jumlah harus angka." });
            if (!db.users[target]) db.users[target] = {};

            if (tipe === 'pts') {
                if (!db.users[target].pasangan) return sock.sendMessage(from, { text: "❌ Player tidak memiliki pasangan." });
                db.users[target].pasangan.point_asmara = (db.users[target].pasangan.point_asmara || 0) + val;
            } else if (tipe.length === 3 || tipe === 'emas' || tipe === 'crypto') {
                if (!db.users[target].invest) db.users[target].invest = {};
                db.users[target].invest[tipe.toUpperCase()] = (db.users[target].invest[tipe.toUpperCase()] || 0) + val;
            } else {
                if (!db.users[target][tipe]) db.users[target][tipe] = 0;
                db.users[target][tipe] += val;
            }
            saveDB(db);
            await sock.sendMessage(from, { text: `✅ Berhasil menambahkan ${val} ${tipe.toUpperCase()} kepada @${target.split('@')[0]}`, mentions: [target] });
            break;
        }

        case 'delrole': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak!" });
            if (roleSender === 'manajer owner' && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Manajer Owner tidak bisa menghapus role staff." });
            if (!target) return sock.sendMessage(from, { text: `❌ Format: ${prefix}delrole [@tag]` });
            if (checkImmunity(target) && !isOwnerUtama) return sock.sendMessage(from, { text: "❌ Ditolak! Owner Utama tidak bisa dihapus rolenya." });
            
            if (db.users[target]) {
                db.users[target].role = 'player'; saveDB(db);
                await sock.sendMessage(from, { text: `🗑️ Role Staff @${target.split('@')[0]} telah dicabut. Status dikembalikan menjadi Player biasa.`, mentions: [target] });
            }
            break;
        }

        case 'delbadge': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            let idx = parseInt(cleanArgs[0]) - 1;
            if (!target || isNaN(idx)) return sock.sendMessage(from, { text: `❌ Format: ${prefix}delbadge [@tag/reply] [urutan angka]` });
            
            let bdgList = db.users[target]?.badges || [];
            if (idx < 0 || idx >= bdgList.length) return sock.sendMessage(from, { text: "❌ Urutan angka badge tidak ditemukan." });
            
            let removed = bdgList.splice(idx, 1);
            db.users[target].badges = bdgList; saveDB(db);
            await sock.sendMessage(from, { text: `✅ Badge [ ${removed[0]} ] berhasil dihapus dari koleksi @${target.split('@')[0]}`, mentions: [target] });
            break;
        }

        case 'adddonate': {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Akses ditolak." });
            if (!target || !cleanArgs[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}adddonate [@tag/reply] [jumlah]` });
            let val = parseInt(cleanArgs[0]);
            if (isNaN(val)) return sock.sendMessage(from, { text: "❌ Jumlah harus angka." });
            
            if (!db.global.donatur) db.global.donatur = {};
            db.global.donatur[target] = (db.global.donatur[target] || 0) + val; saveDB(db);
            await sock.sendMessage(from, { text: `💖 Berhasil mencatat donasi sebesar Rp ${val.toLocaleString()} dari @${target.split('@')[0]}. Terima kasih!`, mentions: [target] });
            break;
        }

        case 'infostaff': {
            let txt = `👑 *DAFTAR STAFF RYOUMADA* 👑\n\n`;
            let owners = [], manajers = [], admins = [];
            
            for (let jid in db.users) {
                let r = db.users[jid].role;
                if (jid === db.global.owner_utama) owners.push(`▸ @${jid.split('@')[0]} (Owner Utama)`);
                else if (r === 'owner') owners.push(`▸ @${jid.split('@')[0]}`);
                else if (r === 'manajer owner') manajers.push(`▸ @${jid.split('@')[0]}`);
                else if (r === 'admin bot') admins.push(`▸ @${jid.split('@')[0]}`);
            }
            
            txt += `🎗️ *OWNER:*\n${owners.length > 0 ? owners.join('\n') : '-\n'}\n\n`;
            txt += `❤️ *MANAJER OWNER:*\n${manajers.length > 0 ? manajers.join('\n') : '-\n'}\n\n`;
            txt += `🛡️ *ADMIN BOT:*\n${admins.length > 0 ? admins.join('\n') : '-\n'}`;
            
            let allStaffMents = Object.keys(db.users).filter(j => db.users[j].role && db.users[j].role !== 'player' || j === db.global.owner_utama);
            await sock.sendMessage(from, { text: txt, mentions: allStaffMents });
            break;
        }
    }
}

