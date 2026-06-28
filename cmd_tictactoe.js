import { readDB, saveDB } from './database.js';

export async function handleTicTacToe(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender]; 

    if (!global.tictactoe) global.tictactoe = {};

    switch(cmd) {
        case 'tictactoe': case 'ttt': case 'ttc': {
            let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            let arg1 = args[0]?.toLowerCase();

            // PANDUAN
            if (!arg1 && !target) {
                let helpTxt = `🎮 *PANDUAN TICTACTOE* 🎮\n\n` +
                              `1. ${prefix}ttt [@tag] ➔ Menantang player lain\n` +
                              `2. ${prefix}ttt terima ➔ Menerima tantangan\n` +
                              `3. ${prefix}ttt tolak ➔ Menolak tantangan\n` +
                              `4. ${prefix}ttt [1-9] ➔ Mengisi kotak saat giliranmu\n` +
                              `5. ${prefix}ttt nyerah ➔ Menyerah dari permainan`;
                return sock.sendMessage(from, { text: helpTxt });
            }

            // NYERAH / KELUAR
            if (arg1 === 'keluar' || arg1 === 'nyerah') {
                if (!global.tictactoe[from]) return sock.sendMessage(from, { text: "❌ Tidak ada sesi TicTacToe di grup ini." });
                let game = global.tictactoe[from];
                if (game.p1 !== sender && game.p2 !== sender) return sock.sendMessage(from, { text: "❌ Kamu tidak sedang bermain!" });
                delete global.tictactoe[from];
                return sock.sendMessage(from, { text: `🏳️ @${sender.split('@')[0]} menyerah. Permainan dibatalkan.`, mentions: [sender] });
            }

            // MENERIMA TANTANGAN
            if (arg1 === 'terima') {
                if (!global.tictactoe[from] || global.tictactoe[from].state !== 'WAITING') return sock.sendMessage(from, { text: "❌ Tidak ada tantangan yang tertunda." });
                if (global.tictactoe[from].p2 !== sender) return sock.sendMessage(from, { text: "❌ Tantangan ini bukan untukmu." });
                
                global.tictactoe[from].state = 'PLAYING';
                let game = global.tictactoe[from];
                let boardStr = `🎮 *TIC-TAC-TOE* 🎮\n\nPermainan dimulai!\n❌: @${game.p1.split('@')[0]}\n⭕: @${game.p2.split('@')[0]}\n\n` +
                               `1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣\n\nGiliran: @${game.p1.split('@')[0]} (X)\n_Ketik ${prefix}ttt [1-9] untuk mengisi kotak._`;
                return sock.sendMessage(from, { text: boardStr, mentions: [game.p1, game.p2] });
            }

            // MENOLAK TANTANGAN
            if (arg1 === 'tolak') {
                if (!global.tictactoe[from] || global.tictactoe[from].state !== 'WAITING') return sock.sendMessage(from, { text: "❌ Tidak ada tantangan yang tertunda." });
                if (global.tictactoe[from].p2 !== sender) return sock.sendMessage(from, { text: "❌ Tantangan ini bukan untukmu." });
                delete global.tictactoe[from];
                return sock.sendMessage(from, { text: `❌ @${sender.split('@')[0]} menolak tantangan TicTacToe.`, mentions: [sender] });
            }

            // MENGISI KOTAK (1-9)
            if (arg1 && ['1','2','3','4','5','6','7','8','9'].includes(arg1)) {
                if (!global.tictactoe[from]) return sock.sendMessage(from, { text: "❌ Tidak ada permainan aktif." });
                let game = global.tictactoe[from];
                if (game.state !== 'PLAYING') return sock.sendMessage(from, { text: "❌ Permainan belum dimulai. Ketik ttt terima dlu!" });
                
                let turnP = game.turn === 'X' ? game.p1 : game.p2;
                if (sender !== turnP) return sock.sendMessage(from, { text: "❌ Sabar, ini bukan giliranmu!" });

                let move = parseInt(arg1) - 1;
                if (game.board[move] === 'X' || game.board[move] === 'O') return sock.sendMessage(from, { text: "❌ Kotak tersebut sudah terisi!" });

                game.board[move] = game.turn; // Isi papan

                // Cek Kemenangan
                let winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
                let isWin = winPatterns.some(p => game.board[p[0]] === game.turn && game.board[p[1]] === game.turn && game.board[p[2]] === game.turn);
                let isDraw = game.board.every(b => b === 'X' || b === 'O');

                let boardStr = `🎮 *TIC-TAC-TOE* 🎮\n\n`;
                const em = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
                for (let i = 0; i < 9; i++) {
                    boardStr += game.board[i] === 'X' ? '❌' : (game.board[i] === 'O' ? '⭕' : em[i]);
                    if ((i + 1) % 3 === 0) boardStr += '\n';
                }

                if (isWin) {
                    let rewardUang = 70000;
                    let rewardXp = 200;
                    u.uang = (u.uang || 0) + rewardUang;
                    u.xp = (u.xp || 0) + rewardXp;
                    saveDB(db);
                    boardStr += `\n🎉 @${sender.split('@')[0]} MENANG!\n🎁 Mendapatkan Rp ${rewardUang.toLocaleString()} & ${rewardXp} XP`;
                    delete global.tictactoe[from];
                    return sock.sendMessage(from, { text: boardStr, mentions: [game.p1, game.p2] });
                } else if (isDraw) {
                    boardStr += `\n🤝 PERMAINAN SERI! Tidak ada yang menang.`;
                    delete global.tictactoe[from];
                    return sock.sendMessage(from, { text: boardStr, mentions: [game.p1, game.p2] });
                } else {
                    game.turn = game.turn === 'X' ? 'O' : 'X'; // Pindah giliran
                    let nextTurn = game.turn === 'X' ? game.p1 : game.p2;
                    boardStr += `\nGiliran: @${nextTurn.split('@')[0]} (${game.turn})\n_Ketik ${prefix}ttt [angka]_`;
                    return sock.sendMessage(from, { text: boardStr, mentions: [game.p1, game.p2] });
                }
            }

            // MEMBUAT TANTANGAN BARU
            if (target) {
                if (global.tictactoe[from]) return sock.sendMessage(from, { text: "❌ Masih ada sesi permainan di grup ini." });
                if (target === sender) return sock.sendMessage(from, { text: "❌ Tidak bisa bermain dengan diri sendiri." });
                
                global.tictactoe[from] = { p1: sender, p2: target, state: 'WAITING', board: [1,2,3,4,5,6,7,8,9], turn: 'X' };
                return sock.sendMessage(from, { text: `🎮 *TIC-TAC-TOE* 🎮\n\n@${sender.split('@')[0]} menantang @${target.split('@')[0]} untuk bermain TicTacToe!\n\nTarget silakan ketik *${prefix}ttt terima* untuk memulai atau *${prefix}ttt tolak* untuk membatalkan.`, mentions: [sender, target] });
            }
            break;
        }
    }
}

