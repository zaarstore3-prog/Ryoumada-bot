import { readDB, saveDB } from './database.js';

export async function handleGamesJudi(sock, msg, from, sender, cmd, args, u, prefix) {
    if (cmd === 'judi') {
        let db = readDB();
        if (!db.users[sender]) db.users[sender] = u;
        u = db.users[sender];
        
        if (!u.cd) u.cd = {};
        let now = Date.now();
        
        // Pengecekan Anti-Spam / Cooldown 5 Menit
        if (u.cd.judi && u.cd.judi > now) {
            let sisa = Math.ceil((u.cd.judi - now) / 60000);
            return sock.sendMessage(from, { text: `⏳ *SABAR BOS!*\nKamu masih dalam masa cooldown judi. Tunggu *${sisa} Menit* lagi.` });
        }

        if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}judi [jumlah / all]\nContoh: ${prefix}judi 10000 atau ${prefix}judi all` });

        let taruhan = 0;
        
        // Mengembalikan Logika Judi ALL
        if (args[0].toLowerCase() === 'all') {
            taruhan = Number(u.uang);
            if (taruhan <= 0) return sock.sendMessage(from, { text: `❌ Uangmu Rp 0, kamu tidak bisa melakukan judi all!` });
        } else {
            taruhan = parseInt(args[0]);
            if (isNaN(taruhan) || taruhan <= 0) return sock.sendMessage(from, { text: `❌ Jumlah taruhan harus berupa angka yang valid.` });
        }

        if (Number(u.uang) < taruhan) {
            return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup untuk bertaruh sebesar itu.\n💰 Uangmu saat ini: Rp ${Number(u.uang).toLocaleString()}` });
        }

        // Terapkan Cooldown 5 Menit (300.000 ms) setelah taruhan dikunci
        u.cd.judi = now + 300000;

        // Persentase Menang 45% (Agar kasino tetap memiliki sedikit keunggulan layaknya bot RPG)
        let win = Math.random() < 0.45; 
        
        if (win) {
            u.uang = Number(u.uang) + taruhan; // Modal kembali + untung 100% dari taruhan
            saveDB(db);
            
            let txtWin = `🎰 *KASINO RYOUMADA* 🎰\n\n` +
                         `🎉 *JACKPOT! KAMU MENANG!* 🎉\n\n` +
                         `💸 *Taruhan:* Rp ${taruhan.toLocaleString()}\n` +
                         `🎁 *Keuntungan:* Rp ${taruhan.toLocaleString()}\n\n` +
                         `💰 *Total Uangmu Sekarang:* Rp ${Number(u.uang).toLocaleString()}`;
            return sock.sendMessage(from, { text: txtWin });
            
        } else {
            u.uang = Number(u.uang) - taruhan;
            saveDB(db);
            
            let txtLose = `🎰 *KASINO RYOUMADA* 🎰\n\n` +
                          `📉 *YAHH... KAMU KALAH!* 📉\n\n` +
                          `💸 *Taruhan:* Rp ${taruhan.toLocaleString()}\n` +
                          `🔥 *Uang Melayang:* Rp ${taruhan.toLocaleString()}\n\n` +
                          `💰 *Sisa Uangmu Sekarang:* Rp ${Number(u.uang).toLocaleString()}`;
            return sock.sendMessage(from, { text: txtLose });
        }
    }
}
