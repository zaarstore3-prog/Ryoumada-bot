import { readDB, saveDB, JOBS, DISTRIK } from './database.js';

export async function handleRPGEconomy(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender]; 
    if (!u.cd) u.cd = {};

    switch(cmd) {
        case 'tf': case 'transfer': {
            let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            let cleanArgs = args.filter(a => !a.startsWith('@'));
            let amount = parseInt(cleanArgs[0]);
            
            if (!target || isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: `❌ Format: ${prefix}tf [@tag] [nominal]` });
            if (Number(u.uang) < amount) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup! Saldo: Rp ${Number(u.uang).toLocaleString()}` });
            if (target === sender) return sock.sendMessage(from, { text: "❌ Tidak bisa transfer ke diri sendiri." });
            if (!db.users[target]) return sock.sendMessage(from, { text: "❌ Player tujuan tidak terdaftar di database." });
            
            u.uang -= amount;
            db.users[target].uang = Number(db.users[target].uang || 0) + amount;
            saveDB(db);
            await sock.sendMessage(from, { text: `💸 *TRANSFER BERHASIL*\nKamu mengirim Rp ${amount.toLocaleString()} kepada @${target.split('@')[0]}`, mentions: [target] });
            break;
        }

        case 'listkerja': {
            let txtK = `╔════════════════════════╗\n║ 💼  *B U R S A  K E R J A* 💼 ║\n╚════════════════════════╝\n\n`;
            for (let k in JOBS) {
                let j = JOBS[k];
                txtK += `[ ${j.icon} ] *${j.nama}*\n`;
                txtK += `▸ Min Lvl: ${j.minLvl} | Ilegal: ${j.ilegal}\n`;
                txtK += `▸ Gaji Pokok : Rp ${j.gaji.toLocaleString()} / shift\n`;
                txtK += `▸ Code : ${k}\n\n`;
            }
            await sock.sendMessage(from, { text: txtK });
            break;
        }

        case 'kerja': case 'k': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}kerja [code pekerjaan]` });
            let jobCode = args[0].toLowerCase();
            if (!JOBS[jobCode]) return sock.sendMessage(from, { text: `❌ Pekerjaan tidak ditemukan. Cek ${prefix}listkerja` });
            
            let j = JOBS[jobCode];
            if (u.level < j.minLvl) return sock.sendMessage(from, { text: `❌ Levelmu belum cukup untuk bekerja sebagai ${j.nama} (Min Lv. ${j.minLvl})` });

            if (u.energi < 20) return sock.sendMessage(from, { text: `❌ Energi kamu terlalu rendah (${u.energi}/100).\nKamu tidak kuat untuk bekerja! Silakan *${prefix}makan* atau *${prefix}minum* terlebih dahulu.` });

            let now = Date.now();
            if (u.cd.kerja && u.cd.kerja > now) {
                let sisaM = Math.ceil((u.cd.kerja - now) / 60000);
                return sock.sendMessage(from, { text: `⏳ Kamu sedang kelelahan. Istirahatlah selama ${sisaM} Menit lagi.` });
            }

            // 🔥 CEK KETERLAMBATAN PINJOL SEBELUM KERJA 🔥
            let pinjolAlert = "";
            if (u.pinjol && u.pinjol.amount > 0 && now > u.pinjol.due_time) {
                let denda = u.pinjol.amount * 2;
                u.hutang = (u.hutang || 0) + denda;
                u.pinjol = { amount: 0, due_time: 0 };
                pinjolAlert = `\n\n🚨 *DEBT COLLECTOR DATANG!* 🚨\nKamu melewati batas waktu Pinjol! Hutang pinjolmu dilipatgandakan menjadi Rp ${denda.toLocaleString()} dan langsung ditagihkan ke Sistem Hutang Tetapmu.`;
            }

            let currentDistrik = DISTRIK[u.distrik] || DISTRIK['Awal'];
            let gajiPokok = Number(j.gaji);
            let bonusGaji = Math.floor(gajiPokok * currentDistrik.bonus);
            let totalGaji = gajiPokok + bonusGaji;
            
            let pajak = Number(currentDistrik.pajak || 0);
            let ongkos = Number(currentDistrik.transport || 0);
            let potongan = pajak + ongkos;

            if (j.ilegal && Math.random() < 0.3) {
                let dendaTertangkap = Math.floor(u.uang * 0.1); 
                u.uang -= dendaTertangkap;
                u.cd.kerja = now + 900000; saveDB(db);
                return sock.sendMessage(from, { text: `🚨 *TERTANGKAP POLISI!* Kamu digrebek saat bekerja ilegal di ${u.distrik}.\n💸 Denda dibayar: -Rp ${dendaTertangkap.toLocaleString()}` });
            }

            if (currentDistrik.resiko > 0 && Math.random() < currentDistrik.resiko) {
                let dendaRazia = Math.floor(u.uang * currentDistrik.denda);
                u.uang -= dendaRazia;
                u.cd.kerja = now + 900000; saveDB(db);
                return sock.sendMessage(from, { text: `⚠️ *TERKENA RAZIA DI ${u.distrik.toUpperCase()}!*\nKamu terjebak razia keamanan / dipalak saat sedang bekerja.\n💸 Uang disita: -Rp ${dendaRazia.toLocaleString()}` });
            }

            let gajiBersih = totalGaji - potongan;
            let potonganHutang = 0;

            // 🔥 SISTEM PEMOTONGAN HUTANG OTOMATIS 🔥
            if (u.hutang > 0 && gajiBersih > 0) {
                if (gajiBersih >= u.hutang) {
                    potonganHutang = u.hutang;
                    u.hutang = 0;
                } else {
                    potonganHutang = gajiBersih;
                    u.hutang -= gajiBersih;
                }
                gajiBersih -= potonganHutang;
            }

            u.uang += gajiBersih;
            u.energi -= 20; 
            u.cd.kerja = now + 300000; 
            saveDB(db);

            let bonusTxt = bonusGaji > 0 ? `\n📈 Bonus Distrik: +Rp ${bonusGaji.toLocaleString()}` : "";
            let hutangTxt = potonganHutang > 0 ? `\n💳 *Potongan Hutang:* -Rp ${potonganHutang.toLocaleString()}` : "";
            
            let resultTxt = `✅ Kerja ${j.nama} selesai!${pinjolAlert}${bonusTxt}\n💰 Gaji Pokok: Rp ${gajiPokok.toLocaleString()}\n🚕 Ongkos & Pajak: -Rp ${potongan.toLocaleString()}${hutangTxt}\n⚡ Energi Terkuras: -20\n💵 *Bersih Diterima:* Rp ${gajiBersih.toLocaleString()}`;
            
            await sock.sendMessage(from, { text: resultTxt });
            break;
        }

        case 'distrik': {
            let txtDist = `🏙️ *INFORMASI DISTRIK* 🏙️\n\nKamu saat ini berada di: *${u.distrik}*\n\n`;
            for (let d in DISTRIK) {
                let info = DISTRIK[d];
                txtDist += `📍 *Distrik ${d}*\n`;
                txtDist += `├ Pajak Kerja: Rp ${info.pajak.toLocaleString()}\n`;
                txtDist += `├ Ongkos Pindah: Rp ${info.ongkos_pindah.toLocaleString()}\n`;
                txtDist += `└ Info: ${info.desc}\n\n`;
            }
            txtDist += `_Cara pindah distrik, ketik: ${prefix}pindah [Nama Distrik]_`;
            await sock.sendMessage(from, { text: txtDist });
            break;
        }

        case 'pindah': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}pindah [Nama Distrik]` });
            let reqDistrik = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
            if (!DISTRIK[reqDistrik]) return sock.sendMessage(from, { text: "❌ Distrik tidak ditemukan." });
            if (u.distrik === reqDistrik) return sock.sendMessage(from, { text: `❌ Kamu sudah berada di distrik ${reqDistrik} saat ini.` });
            
            let biayaPindah = DISTRIK[reqDistrik].ongkos_pindah || 0;
            if (Number(u.uang) < biayaPindah) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup untuk ongkos pindah ke ${reqDistrik}.\nDiperlukan: Rp ${biayaPindah.toLocaleString()}` });
            
            u.uang = Number(u.uang) - biayaPindah;
            u.distrik = reqDistrik; saveDB(db);
            
            let txtBiaya = biayaPindah > 0 ? `\n🚕 Biaya Pindah: -Rp ${biayaPindah.toLocaleString()}` : "\n🚕 Biaya Pindah: Gratis";
            await sock.sendMessage(from, { text: `✅ Berhasil pindah ke distrik ${reqDistrik}.${txtBiaya}` }); 
            break;
        }
    }
}

