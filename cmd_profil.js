import { readDB, saveDB } from './database.js';
import fs from 'fs';

export async function handleProfil(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender];

    switch(cmd) {
        case 'profil':
            let tProfil = sender;
            const ctxP = msg.message?.extendedTextMessage?.contextInfo;
            if (ctxP?.participant) { tProfil = ctxP.participant; }
            else if (ctxP?.mentionedJid?.length > 0) { tProfil = ctxP.mentionedJid[0]; }

            if (!db.users[tProfil]) return sock.sendMessage(from, { text: "❌ Player tersebut belum terdaftar di database RyouMada." });
            let pU = db.users[tProfil];

            let now = new Date();
            let joinD = new Date(pU.joined_at || Date.now());
            let todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let joinMidnight = new Date(joinD.getFullYear(), joinD.getMonth(), joinD.getDate());
            let daysPassed = Math.floor((todayMidnight - joinMidnight) / 86400000);
            if (daysPassed < 0) daysPassed = 0;

            let pName = (pU.pasangan && pU.pasangan.nama) ? pU.pasangan.nama : "Belum Punya";
            let energiVal = pU.energi !== undefined ? pU.energi : 100;

            let txtProfil = `╔════════════════════════╗\n` +
                            `║ 📋 *P R O F I L  P L A Y E R* ║\n` +
                            `╚════════════════════════╝\n\n` +
                            `👤 *Nama:* ${pU.name}\n` +
                            `⚧️ *Gender:* ${pU.gender || "Belum diatur"}\n` +
                            `🌍 *Lokasi:* ${pU.location || "Belum diatur"}\n` +
                            `⚡ *Energi:* ${energiVal}/100\n` +
                            `🔰 *Badge:* [ ${pU.active_badge || "Belum Ada"} ]\n` +
                            `💍 *Pasangan:* ${pName}\n` +
                            `📅 *Bergabung:* ${joinD.toLocaleDateString('id-ID')} (${daysPassed} Hari yang lalu)\n` +
                            `💬 *Status:* "${pU.status_profil || "Saya menggunakan RyouMada"}"\n\n` +
                            `🆔 *UID:* ${pU.uid}`;
            await sock.sendMessage(from, { text: txtProfil });
            break;

        case 'uang': case 'm':
            let buffTxtU = u.exp_multiplier > 1 ? `\n🔥 *Buff Aktif:* ${u.exp_multiplier}x EXP` : "";
            let donaturDataU = db.global.donatur && db.global.donatur[sender] ? db.global.donatur[sender].total : 0;
            let donaturTxtU = donaturDataU > 0 ? `\n🎀 *Total Donasi:* Rp ${donaturDataU.toLocaleString()}` : "";
            let limitTxtU = u.isPremium ? "UNLIMITED ♾️" : `${u.limit} / 50`;

            // 🔥 TAMPILAN HUTANG DAN PINJOL 🔥
            let hutangTxt = u.hutang > 0 ? `\n💳 *Hutang Minus:* Rp ${Number(u.hutang).toLocaleString()} (Potong Gaji)` : "";
            let pinjolTxt = (u.pinjol && u.pinjol.amount > 0) ? `\n🏦 *Pinjol Aktif:* Rp ${Number(u.pinjol.amount).toLocaleString()}\n⏳ *Jatuh Tempo:* ${new Date(u.pinjol.due_time).toLocaleString('id-ID')}` : "";

            let txtUang = `╔════════════════════════╗\n` +
                          `║ 💰 *I N F O  K E U A N G A N* ║\n` +
                          `╚════════════════════════╝\n\n` +
                          `👤 *Player:* ${u.name}\n` +
                          `🌟 *Level:* ${u.level} (${u.xp}/${u.level===1?100:(u.level===2?500:Math.pow(u.level,2)*125)} XP)\n` +
                          `💵 *Uang:* Rp ${Number(u.uang).toLocaleString()}${buffTxtU}${donaturTxtU}\n` +
                          `⚡ *Limit:* ${limitTxtU}\n` +
                          `🏙️ *Distrik:* ${u.distrik}${hutangTxt}${pinjolTxt}`;
            await sock.sendMessage(from, { text: txtUang });
            break;

        case 'setname':
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}setname [Nama Baru]` });
            let newName = args.join(" ");
            if (newName.length > 25) return sock.sendMessage(from, { text: `❌ Nama terlalu panjang! Maksimal 25 karakter.` });
            u.name = newName; saveDB(db);
            await sock.sendMessage(from, { text: `✅ Berhasil! Nama profilmu telah diubah menjadi: *${newName}*` });
            break;

        case 'setgender':
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}setgender [Pria/Wanita/Rahasia]` });
            u.gender = args.join(" "); saveDB(db);
            await sock.sendMessage(from, { text: `✅ Gender berhasil diatur menjadi: ${u.gender}` }); break;

        case 'setstatus':
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}setstatus [Kata-kata statusmu]` });
            u.status_profil = args.join(" "); saveDB(db);
            await sock.sendMessage(from, { text: `✅ Status profil berhasil diubah:\n"${u.status_profil}"` }); break;

        case 'setlocation':
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}setlocation [Nama Kota/Negara]` });
            u.location = args.join(" "); saveDB(db);
            await sock.sendMessage(from, { text: `✅ Lokasi berhasil diatur menjadi: ${u.location}` }); break;

        case 'afk':
            let reason = args.length > 0 ? args.join(" ") : "Tanpa alasan";
            u.afk_time = Date.now(); u.afk_reason = reason; saveDB(db);
            await sock.sendMessage(from, { text: `💤 *MODE AFK AKTIF*\n\n👤 Player: @${sender.split('@')[0]}\n📝 Alasan: ${reason}\n\n_Bot akan memberi tahu siapapun yang men-tag kamu._`, mentions: [sender] });
            break;

        case 'listbadge':
            let badgeList = u.badges.map((b, i) => `[ ${i + 1} ] ${b}`).join('\n');
            await sock.sendMessage(from, { text: `🎖️ *BADGE MILIKMU:*\n${badgeList}\n\n*Badge Aktif:* ${u.active_badge}\n_Gunakan ${prefix}setbadge [angka] untuk memakai_` }); break;

        case 'setbadge':
            let idxBadge = parseInt(args[0]) - 1;
            if (isNaN(idxBadge) || !u.badges[idxBadge]) return sock.sendMessage(from, { text: `❌ Angka tidak valid!` });
            u.active_badge = u.badges[idxBadge]; saveDB(db);
            await sock.sendMessage(from, { text: `✅ Badge aktif berhasil diubah ke: [ ${u.active_badge} ]` }); break;

        case 'donatur':
            let donaturList = Object.entries(db.global.donatur || {}).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
            let totalSemua = Object.values(db.global.donatur || {}).reduce((acc, curr) => acc + curr.total, 0);
            if (donaturList.length === 0) return sock.sendMessage(from, { text: "❌ Belum ada data donatur di server ini." });
            let lbDonatur = `╔════════════════════════╗\n║ 🏆 *LEADERBOARD DONATUR* 🏆 ║\n╚════════════════════════╝\n\n`;
            donaturList.forEach((d, i) => { lbDonatur += `*${i + 1}.* ${d[1].name}\n 💎 Rp ${d[1].total.toLocaleString()}\n`; });
            lbDonatur += `\n🌟 *Total Keseluruhan Donasi:* Rp ${totalSemua.toLocaleString()}\n_Terima kasih kepada para Sahabat RyouMada!_`;
            await sock.sendMessage(from, { text: lbDonatur }); break;

        case 'listdonatur':
            let allDonatur = Object.values(db.global.donatur || {});
            let totalSemuaList = allDonatur.reduce((acc, curr) => acc + curr.total, 0);
            if (allDonatur.length === 0) return sock.sendMessage(from, { text: "❌ Belum ada data donatur." });
            let listTxt = `📜 *DAFTAR LENGKAP DONATUR*\n\n`;
            allDonatur.forEach((d, i) => { listTxt += `• ${d.name}: Rp ${d.total.toLocaleString()}\n`; });
            listTxt += `\n🌟 *Total Keseluruhan Donasi:* Rp ${totalSemuaList.toLocaleString()}`;
            await sock.sendMessage(from, { text: listTxt }); break;

        case 'lbuang':
            let sortedUang = Object.values(db.users).sort((a, b) => Number(b.uang) - Number(a.uang)).slice(0, 10);
            let lbTxt = `🏆 *TOP 10 SULTAN NEXUS* 🏆\n\n`;
            sortedUang.forEach((usr, i) => { lbTxt += `*${i + 1}.* ${usr.name}\n 💵 Rp ${Number(usr.uang).toLocaleString()}\n`; });
            await sock.sendMessage(from, { text: lbTxt }); break;

        case 'lblevel':
            let sortedLvl = Object.values(db.users).sort((a, b) => Number(b.level) - Number(a.level)).slice(0, 10);
            let lbLvlTxt = `🏆 *TOP 10 LEVEL TERTINGGI* 🏆\n\n`;
            sortedLvl.forEach((usr, i) => { lbLvlTxt += `*${i + 1}.* ${usr.name}\n 🌟 Level ${usr.level} (${usr.xp} XP)\n`; });
            await sock.sendMessage(from, { text: lbLvlTxt }); break;

        case 'ping':
            let uptime = process.uptime(); let d = Math.floor(uptime / (3600 * 24)); let h = Math.floor(uptime % (3600 * 24) / 3600); let m = Math.floor(uptime % 3600 / 60); let s = Math.floor(uptime % 60);
            let upStr = `${d} Hari, ${h} Jam, ${m} Menit, ${s} Detik`;
            let start = Date.now();
            await sock.sendMessage(from, { text: "Menghitung ping..." }).then(async (msgPing) => {
                let end = Date.now();
                await sock.sendMessage(from, { text: `🏓 *PONG!*\n⏱️ Speed: ${end - start} ms\n⏳ Uptime: ${upStr}\n📊 RAM: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\n🚀 Engine: RyouMada V.2.1`, edit: msgPing.key });
            }); break;

        case 'donasi':
            let donasiTxt = `🎀 S U P P O R T  R Y O U M A D A 🎀\n\nHai, Sahabat RyouMada! 👋\nTerima kasih sudah meramaikan dunia virtual ini. Biaya server dan kopi admin butuh dukungan dari kalian agar bot ini aktif 24/7 tanpa henti!\n`;
            if (fs.existsSync('./qris.jpg')) await sock.sendMessage(from, { image: fs.readFileSync('./qris.jpg'), caption: donasiTxt });
            else await sock.sendMessage(from, { text: donasiTxt }); break;

        case 'report':
        case 'saran': {
            let textMsg = args.join(" ");
            if (!textMsg) return sock.sendMessage(from, { text: `❌ Format: ${prefix}${cmd} [Isi pesan yang ingin disampaikan]` });

            let targetGroup = db.global.acc_group;
            if (!targetGroup) targetGroup = db.global.owner_utama;

            if (!targetGroup) return sock.sendMessage(from, { text: "❌ Saat ini sistem belum memiliki grup penerima (Owner Utama belum diklaim/diatur). Harap hubungi Owner secara langsung." });

            let msgType = cmd === 'report' ? '🚨 LAPORAN PLAYER 🚨' : '💡 SARAN PLAYER 💡';
            let surat = `╔════════════════════════╗\n` +
                        `║ ${msgType} ║\n` +
                        `╚════════════════════════╝\n\n` +
                        `👤 *Pengirim:* ${u.name}\n` +
                        `🆔 *UID:* ${u.uid}\n` +
                        `📱 *Kontak:* wa.me/${sender.split('@')[0]}\n\n` +
                        `📝 *Pesan:*\n"${textMsg}"`;

            await sock.sendMessage(targetGroup, { text: surat });
            await sock.sendMessage(from, { text: `✅ *TERKIRIM!*\n${cmd === 'report' ? 'Laporan' : 'Saran'} milikmu telah berhasil dikirimkan ke meja Admin. Terima kasih atas partisipasinya!` });
            break;
        }
    }
}

