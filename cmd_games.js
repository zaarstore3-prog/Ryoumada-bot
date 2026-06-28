import { readDB, saveDB } from './database.js';

export async function handleGames(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();

    switch(cmd) {
        case 'tebakkata': {
            if (global.games[from]) return sock.sendMessage(from, { text: "❌ Masih ada sesi permainan yang belum diselesaikan di grup ini!" });
            const listKata = [
                { s: 'R_O_M_D_', a: 'ryoumada' },
                { s: 'A_N_M_', a: 'anime' },
                { s: 'P_S_N_A_N', a: 'pasangan' },
                { s: 'D_N_T_R', a: 'donatur' },
                { s: 'B_D_E', a: 'badge' }
            ];
            let pick = listKata[Math.floor(Math.random() * listKata.length)];
            let sessionId = Date.now();
            global.games[from] = { id: sessionId, type: 'tebak', answer: pick.a, rewardUang: 50000, rewardXp: 100 };
            await sock.sendMessage(from, { text: `🎮 *TEBAK KATA* 🎮\n\nLengkapi kata berikut:\n*${pick.s}*\n\n💰 Hadiah: Rp 50.000 & 100 XP` });
            
            // 🔥 TIMEOUT DIJAMIN HANYA MENGHAPUS SESI YANG INI SAJA 🔥
            setTimeout(async () => {
                if (global.games[from] && global.games[from].id === sessionId) {
                    await sock.sendMessage(from, { text: `⏳ *WAKTU HABIS!*\nJawaban yang benar adalah: *${pick.a.toUpperCase()}*` });
                    delete global.games[from];
                }
            }, 60000);
            break;
        }

        case 'math': {
            if (global.games[from]) return sock.sendMessage(from, { text: "❌ Masih ada sesi permainan yang belum diselesaikan di grup ini!" });
            
            let types = ['fungsi', 'turunan', 'aljabar'];
            let type = types[Math.floor(Math.random() * types.length)];
            let soal = "";
            let jawaban = "";

            if (type === 'fungsi') {
                let a = Math.floor(Math.random() * 10) + 1;
                let b = Math.floor(Math.random() * 20) + 1;
                let c = Math.floor(Math.random() * 5) + 1;
                soal = `Diketahui Fungsi Linear f(x) = ${a}x + ${b}.\nBerapakah nilai dari f(${c})?`;
                jawaban = (a * c + b).toString();
            } else if (type === 'turunan') {
                let a = Math.floor(Math.random() * 5) + 2;
                let b = Math.floor(Math.random() * 10) + 1;
                let c = Math.floor(Math.random() * 3) + 1;
                soal = `Diketahui Persamaan f(x) = ${a}x² + ${b}x.\nBerapakah nilai turunan pertama f'(x) saat x = ${c}?`;
                jawaban = ((2 * a * c) + b).toString();
            } else if (type === 'aljabar') {
                let a = Math.floor(Math.random() * 10) + 2;
                let b = Math.floor(Math.random() * 10) + 2;
                soal = `Jika diketahui x = ${a} dan y = ${b}, maka berapakah hasil akhir dari:\n(x + y)² - 2xy ?`;
                jawaban = (Math.pow(a + b, 2) - (2 * a * b)).toString();
            }

            let sessionId = Date.now();
            global.games[from] = {
                id: sessionId,
                type: 'math',
                answer: jawaban,
                rewardUang: 50000,
                rewardXp: 1000
            };

            await sock.sendMessage(from, { text: `📐 *UJIAN MATEMATIKA SMA* 📐\n\n${soal}\n\n💰 *Hadiah:* Rp 50.000 & 1.000 XP\n_Ketik angka jawaban akhirnya saja._` });
            
            setTimeout(async () => {
                if (global.games[from] && global.games[from].id === sessionId) {
                    await sock.sendMessage(from, { text: `⏳ *WAKTU HABIS!*\nJawaban yang benar adalah: *${jawaban}*` });
                    delete global.games[from];
                }
            }, 60000);
            break;
        }

        case 'tebakkimia': {
            if (global.games[from]) return sock.sendMessage(from, { text: "❌ Selesaikan dulu game yang sedang berjalan." });
            const elements = [
                { s: 'H', a: 'hidrogen' }, { s: 'O', a: 'oksigen' }, { s: 'Fe', a: 'besi' },
                { s: 'Au', a: 'emas' }, { s: 'Ag', a: 'perak' }, { s: 'Na', a: 'natrium' }
            ];
            let pick = elements[Math.floor(Math.random() * elements.length)];
            let sessionId = Date.now();
            global.games[from] = { id: sessionId, type: 'kimia', answer: pick.a, rewardUang: 150000, rewardXp: 300 };
            
            await sock.sendMessage(from, { text: `🧪 *TEBAK UNSUR KIMIA* 🧪\n\nApakah nama unsur dari simbol kimia *${pick.s}*?\n\n💰 Hadiah: Rp 150.000 & 300 XP` });
            
            setTimeout(async () => {
                if (global.games[from] && global.games[from].id === sessionId) {
                    await sock.sendMessage(from, { text: `⏳ *WAKTU HABIS!*\nJawaban yang benar adalah: *${pick.a.toUpperCase()}*` });
                    delete global.games[from];
                }
            }, 60000);
            break;
        }

        case 'ryou100': {
            if (global.games[from]) return sock.sendMessage(from, { text: "❌ Selesaikan dulu game yang ada." });
            const dbRyou = [
                { q: "Sebutkan genre Anime yang paling populer", a: ['shounen', 'isekai', 'romance', 'slice of life', 'mecha'] },
                { q: "Hal yang sering dilakukan otaku di kamar", a: ['nonton', 'main game', 'tidur', 'baca manga', 'koleksi figure'] },
                { q: "Item yang sering dibeli di RyouMada", a: ['badge', 'potion', 'saham', 'cincin', 'rumah'] }
            ];
            let pick = dbRyou[Math.floor(Math.random() * dbRyou.length)];
            let sessionId = Date.now();
            global.games[from] = { id: sessionId, type: 'ryou100', answers: pick.a, answered: [], players: {}, rewardUang: 100000, rewardXp: 500 };
            
            await sock.sendMessage(from, { text: `🎙️ *FAMILY RYOU 100* 🎙️\n\nPertanyaan: *${pick.q}?*\n\nTerdapat *${pick.a.length}* Jawaban Tersembunyi!\nKetik jawabanmu langsung. Yang menjawab paling banyak di akhir akan menang.\n\n💰 Hadiah Akhir: Rp 100.000 & 500 XP` });
            
            setTimeout(async () => {
                if (global.games[from] && global.games[from].id === sessionId) {
                    let game = global.games[from];
                    let highestScore = 0; let winner = null;
                    for (let p in game.players) { if (game.players[p] > highestScore) { highestScore = game.players[p]; winner = p; } }
                    
                    if (winner) {
                        let db = readDB();
                        if (!db.users[winner]) db.users[winner] = { uang: 5000, xp: 0 };
                        db.users[winner].uang = Number(db.users[winner].uang) + game.rewardUang; db.users[winner].xp = Number(db.users[winner].xp) + game.rewardXp; saveDB(db);
                        await sock.sendMessage(from, { text: `⏳ *WAKTU HABIS!* (RYOU 100)\n\n🏆 *Pemenang:* @${winner.split('@')[0]} (${highestScore} Jawaban)\n🎁 *Hadiah:* Rp ${game.rewardUang.toLocaleString()} & ${game.rewardXp} XP\n\n📜 *Daftar Seluruh Jawaban:*\n- ${game.answers.join('\n- ')}`, mentions: [winner] });
                    } else {
                        await sock.sendMessage(from, { text: `⏳ *WAKTU HABIS!* (RYOU 100)\n\nSangat disayangkan, tidak ada satupun yang berhasil menebak dengan benar.\n\n📜 *Daftar Jawaban Seharusnya:*\n- ${game.answers.join('\n- ')}` });
                    }
                    delete global.games[from];
                }
            }, 60000);
            break;
        }
    }
}

