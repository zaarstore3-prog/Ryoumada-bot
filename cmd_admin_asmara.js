import { readDB, saveDB } from './database.js';
import fs from 'fs';
import fetch from 'node-fetch';

export async function handleAdminAsmara(sock, msg, from, sender, cmd, args, u, isOwner, isAdmin, isOwnerUtama, prefix) {
    let db = readDB();
    const getTarget = () => {
        let tagTarget = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        let replyTarget = msg.message?.extendedTextMessage?.contextInfo?.participant;
        return tagTarget || replyTarget;
    };

    switch(cmd) {
        case 'whitelistchar': {
            if (!isAdmin) return;
            let id = args[0];
            if (!id) return sock.sendMessage(from, { text: `❌ Format: ${prefix}whitelistchar [ID MAL]` });
            if (!db.global.whitelist_karakter) db.global.whitelist_karakter = [];
            if (db.global.whitelist_karakter.includes(id)) return sock.sendMessage(from, { text: "❌ Karakter ini sudah ada di Whitelist." });
            db.global.whitelist_karakter.push(id); saveDB(db);
            await sock.sendMessage(from, { text: `✅ Karakter ID ${id} berhasil ditambahkan ke Whitelist Global.` });
            break;
        }

        case 'delwhitelistchar': {
            if (!isAdmin) return;
            let id = args[0];
            if (!id) return sock.sendMessage(from, { text: `❌ Format: ${prefix}delwhitelistchar [ID MAL]` });
            if (!db.global.whitelist_karakter) db.global.whitelist_karakter = [];
            let idx = db.global.whitelist_karakter.indexOf(id);
            if (idx === -1) return sock.sendMessage(from, { text: "❌ Karakter tidak ditemukan di Whitelist." });
            db.global.whitelist_karakter.splice(idx, 1); saveDB(db);
            await sock.sendMessage(from, { text: `✅ Karakter ID ${id} berhasil dihapus dari Whitelist Global.` });
            break;
        }

        case 'cekwhitelistchar': {
            if (!isAdmin) return;
            let wList = db.global.whitelist_karakter || [];
            if (wList.length === 0) return sock.sendMessage(from, { text: "📜 Daftar Whitelist Global kosong." });

            await sock.sendMessage(from, { text: "🔍 Sedang memuat daftar karakter... (Mohon tunggu sebentar agar tidak terkena limit server)" });
            let txt = `📜 *DAFTAR WHITELIST GLOBAL*\n\n`;

            for (let id of wList) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    let res = await fetch(`https://api.jikan.moe/v4/characters/${id}`);
                    if (res.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        res = await fetch(`https://api.jikan.moe/v4/characters/${id}`);
                    }
                    let json = await res.json();
                    let name = (json && json.data && json.data.name) ? json.data.name : "Nama Tidak Diketahui";
                    txt += `▸ ID MAL: ${id} - ${name}\n`;
                } catch (e) {
                    txt += `▸ ID MAL: ${id} - Nama Tidak Diketahui\n`;
                }
            }
            await sock.sendMessage(from, { text: txt });
            break;
        }

        case 'cekblacklist': {
            if (!isAdmin) return;
            let target = getTarget() || (args[0] === 'me' ? sender : null);
            if (!target || !db.users[target]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}cekblacklist [@tag/me]` });

            let bList = db.users[target].blacklist_karakter || [];
            if (bList.length === 0) return sock.sendMessage(from, { text: `📜 @${target.split('@')[0]} tidak memiliki karakter di Blacklist.`, mentions: [target] });

            await sock.sendMessage(from, { text: "🔍 Sedang memuat daftar karakter blacklist... (Mohon tunggu sebentar)" });
            let txt = `📜 *DAFTAR BLACKLIST (@${target.split('@')[0]})*\n\n`;

            for (let id of bList) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    let res = await fetch(`https://api.jikan.moe/v4/characters/${id}`);
                    if (res.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        res = await fetch(`https://api.jikan.moe/v4/characters/${id}`);
                    }
                    let json = await res.json();
                    let name = (json && json.data && json.data.name) ? json.data.name : "Nama Tidak Diketahui";
                    txt += `▸ ID MAL: ${id} - ${name}\n`;
                } catch (e) {
                    txt += `▸ ID MAL: ${id} - Nama Tidak Diketahui\n`;
                }
            }
            await sock.sendMessage(from, { text: txt, mentions: [target] });
            break;
        }

        case 'delblacklist': {
            if (!isAdmin) return;
            let target = getTarget() || (args[0] === 'me' ? sender : null);
            let targetId = args[args.length - 1];

            if (!target || !db.users[target] || !targetId || isNaN(targetId)) return sock.sendMessage(from, { text: `❌ Format: ${prefix}delblacklist [@tag/me] [ID]` });

            let bList = db.users[target].blacklist_karakter || [];
            let idx = bList.indexOf(targetId);

            if (idx === -1) return sock.sendMessage(from, { text: "❌ ID Karakter tidak ada di blacklist player tersebut." });
            bList.splice(idx, 1); db.users[target].blacklist_karakter = bList; saveDB(db);
            await sock.sendMessage(from, { text: `✅ ID ${targetId} berhasil dihapus dari blacklist @${target.split('@')[0]}`, mentions: [target] });
            break;
        }

        case 'acc': {
            if (!isAdmin) return;
            if (args[0]?.toLowerCase() === 'pf') {
                let code = args[1]?.toUpperCase();
                if (!code) return sock.sendMessage(from, { text: `❌ Format: ${prefix}acc pf [Kode]` });
                let req = db.global.pending_acc?.[code];
                if (!req || req.type !== 'pf') return sock.sendMessage(from, { text: "❌ Kode pengajuan tidak ditemukan." });

                fs.renameSync(`./media/pending_pf_${code}.jpg`, `./media/pf_${req.uid}.jpg`);
                delete db.global.pending_acc[code]; saveDB(db);

                await sock.sendMessage(from, { text: `✅ *PENGAJUAN DITERIMA*\nFoto pasangan untuk ${req.playerName} telah di-ACC.` });
                await sock.sendMessage(req.sender, { text: `🎉 *SELAMAT!*\nPengajuan Foto Pasanganmu (Karakter: ${req.charName}) telah *DITERIMA* oleh Admin.\nCek profil pasanganmu dengan .pasangan` });
            }
            break;
        }

        case 'tolak': {
            if (!isAdmin) return;
            if (args[0]?.toLowerCase() === 'pf') {
                let code = args[1]?.toUpperCase();
                let reason = args.slice(2).join(" ") || "Tidak ada alasan spesifik.";
                if (!code) return sock.sendMessage(from, { text: `❌ Format: ${prefix}tolak pf [Kode] [Alasan]` });
                let req = db.global.pending_acc?.[code];
                if (!req || req.type !== 'pf') return sock.sendMessage(from, { text: "❌ Kode pengajuan tidak ditemukan." });

                if (fs.existsSync(`./media/pending_pf_${code}.jpg`)) fs.unlinkSync(`./media/pending_pf_${code}.jpg`);
                delete db.global.pending_acc[code]; saveDB(db);

                await sock.sendMessage(from, { text: `❌ *PENGAJUAN DITOLAK*\nFoto pasangan untuk ${req.playerName} ditolak.` });
                await sock.sendMessage(req.sender, { text: `⚠️ *MOHON MAAF*\nPengajuan Foto Pasanganmu (Karakter: ${req.charName}) *DITOLAK* oleh Admin.\n📝 *Alasan:* ${reason}` });
            }
            break;
        }
    }
}

