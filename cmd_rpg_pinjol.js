import { readDB, saveDB } from './database.js';

export async function handleRPGPinjol(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender];

    switch(cmd) {
        case 'pinjol': {
            if (!args[0] || !args[1]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}pinjol [Nominal] [Waktu (Jam)]\nContoh: ${prefix}pinjol 500000 24\n_(Maksimal peminjaman: Rp 10.000.000)_` });
            
            let amount = parseInt(args[0]);
            let hours = parseInt(args[1]);

            if (isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: "❌ Nominal peminjaman tidak valid." });
            if (isNaN(hours) || hours <= 0 || hours > 720) return sock.sendMessage(from, { text: "❌ Waktu kesepakatan tidak valid (Maksimal 720 jam / 1 bulan)." });
            if (amount > 10000000) return sock.sendMessage(from, { text: "❌ Sistem menolak! Maksimal peminjaman Pinjol adalah Rp 10.000.000" });

            if (u.pinjol && u.pinjol.amount > 0) {
                return sock.sendMessage(from, { text: `❌ Kamu masih memiliki tagihan Pinjol sebesar Rp ${u.pinjol.amount.toLocaleString()} yang belum dilunasi!` });
            }

            u.uang += amount;
            u.pinjol = {
                amount: amount,
                due_time: Date.now() + (hours * 3600000)
            };
            saveDB(db);

            let dueString = new Date(u.pinjol.due_time).toLocaleString('id-ID');
            let txt = `🏦 *PINJOL CAIR!* 🏦\n\nKamu telah meminjam uang sebesar Rp ${amount.toLocaleString()}.\n⏳ *Jatuh Tempo:* ${dueString} (${hours} Jam dari sekarang)\n\n⚠️ *PERINGATAN:* Jika tidak dibayar sebelum waktu habis, hutang akan berlipat ganda dan otomatis memotong gajimu saat kerja!`;
            await sock.sendMessage(from, { text: txt });
            break;
        }

        case 'bayarpinjol': {
            if (!u.pinjol || u.pinjol.amount <= 0) return sock.sendMessage(from, { text: "✅ Kamu tidak memiliki tagihan Pinjol saat ini." });
            
            let tagihan = u.pinjol.amount;
            if (u.uang < tagihan) {
                return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup untuk melunasi Pinjol.\n💳 Tagihan: Rp ${tagihan.toLocaleString()}\n💵 Uangmu: Rp ${u.uang.toLocaleString()}` });
            }

            u.uang -= tagihan;
            u.pinjol = { amount: 0, due_time: 0 };
            saveDB(db);

            await sock.sendMessage(from, { text: `💸 *PINJOL LUNAS!*\n\nKamu berhasil membayar tagihan Pinjol sebesar Rp ${tagihan.toLocaleString()}.\nUangmu sekarang tersisa Rp ${u.uang.toLocaleString()}.` });
            break;
        }
    }
}

