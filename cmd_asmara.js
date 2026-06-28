import { readDB, saveDB } from './database.js';
import fetch from 'node-fetch';
import fs from 'fs';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

// Parameter '_db' diabaikan karena bot kini selalu mengambil DB terbaru (Mencegah Overwrite Data Energi)
export async function handleAsmara(sock, msg, from, sender, cmd, args, u, _db, prefix) {
    let db = readDB(); 
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender]; 
    if (!u.cd) u.cd = {};

    const fetchCharData = async (query) => {
        try {
            let url = /^\d+$/.test(query) ? `https://api.jikan.moe/v4/characters/${query}` : `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`;
            let res = await fetch(url);
            if (res.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                res = await fetch(url);
            }
            let json = await res.json();
            if (/^\d+$/.test(query)) return json.data || null;
            return (json.data && json.data.length > 0) ? json.data[0] : null;
        } catch (e) { return null; }
    };

    const checkCD = (cooldownLimit) => {
        let now = Date.now();
        if (u.cd.interaksi && u.cd.interaksi > now) {
            let sisa = Math.ceil((u.cd.interaksi - now) / 60000);
            sock.sendMessage(from, { text: `⏳ Pasanganmu sedang butuh waktu. Tunggu *${sisa} Menit* lagi untuk berinteraksi.` });
            return false;
        }
        u.cd.interaksi = now + cooldownLimit;
        return true;
    };

    switch(cmd) {
        case 'character': {
            let query = args.join(" ");
            if (!query) return sock.sendMessage(from, { text: `❌ Format: ${prefix}character [ID atau Nama Karakter]` });
            
            await sock.sendMessage(from, { text: "🔍 Sedang mencari data karakter..." });
            let charData = await fetchCharData(query);
            if (!charData) return sock.sendMessage(from, { text: "❌ Karakter tidak ditemukan di database." });
            
            let charInfo = `👤 *INFO KARAKTER*\n\n📛 Nama: ${charData.name}\n🆔 ID MAL: ${charData.mal_id}\n\n_Gunakan ${prefix}lamar ${charData.mal_id} untuk melamar._`;
            if (charData.images?.jpg?.image_url) await sock.sendMessage(from, { image: { url: charData.images.jpg.image_url }, caption: charInfo });
            else await sock.sendMessage(from, { text: charInfo });
            break;
        }

        case 'lamar': {
            let query = args.join(" ");
            if (!query) return sock.sendMessage(from, { text: `❌ Format: ${prefix}lamar [ID atau Nama Karakter]` });
            if (u.status_hubungan !== 'lajang') return sock.sendMessage(from, { text: "❌ Kamu sudah memiliki pasangan! Ceraikan dulu jika ingin menikah lagi." });
            
            let charData = await fetchCharData(query);
            if (!charData) return sock.sendMessage(from, { text: "❌ Karakter tidak ditemukan." });

            let bList = u.blacklist_karakter || [];
            if (bList.includes(charData.mal_id.toString())) return sock.sendMessage(from, { text: `❌ Karakter ini sudah kamu blacklist karena perceraian masa lalumu! Move on!` });

            // FIX WHITELIST: Langsung tolak jika ada di dalam daftar!
            let wList = db.global.whitelist_karakter || [];
            let isWhitelisted = wList.includes(charData.mal_id.toString()) || wList.some(name => name.toLowerCase() === charData.name.toLowerCase());

            if (isWhitelisted) {
                return sock.sendMessage(from, { text: `❌ *LAMARAN DITOLAK MUTLAK!*\nKarakter "${charData.name}" berada di dalam *Daftar Whitelist (Perlindungan Khusus Sistem)* dan tidak dapat dilamar oleh siapapun.` });
            }

            for (let userId in db.users) {
                if (db.users[userId].pasangan && db.users[userId].pasangan.id === charData.mal_id) {
                    return sock.sendMessage(from, { text: `❌ Karakter ini sudah dinikahi oleh @${userId.split('@')[0]}!`, mentions: [userId] });
                }
            }

            u.status_hubungan = 'pacaran'; 
            u.pasangan = { id: charData.mal_id, nama: charData.name, point_asmara: 0, uang: 0, kehamilan: false, waktu_mulai: 0 };
            saveDB(db);
            
            let txtLamar = `💞 *BERHASIL LAMAR!* 💞\nSelamat! Kamu resmi berpacaran dengan *${charData.name}*!`;
            if (charData.images?.jpg?.image_url) await sock.sendMessage(from, { image: { url: charData.images.jpg.image_url }, caption: txtLamar });
            else await sock.sendMessage(from, { text: txtLamar });
            break;
        }

        case 'pasangan': case 'ps': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Kamu masih lajang." });
            let anakCount = u.anak ? u.anak.length : 0;
            let pointAsmara = u.pasangan.point_asmara || 0;
            let uangPasangan = u.pasangan.uang || 0;
            let statusHamil = "Tidak";

            if (u.pasangan.kehamilan) {
                let months = Math.floor((Date.now() - u.pasangan.waktu_mulai) / 3600000); 
                if (months >= 9) { 
                    if (!u.pasangan.gender_anak) {
                        u.pasangan.gender_anak = Math.random() < 0.5 ? 'Laki-Laki' : 'Perempuan';
                        saveDB(db);
                    }
                    statusHamil = `Siap Melahirkan (${u.pasangan.gender_anak})`; 
                } else { 
                    statusHamil = `Ya (${months} Bulan)`; 
                }
            }

            let txtPasangan = `╔════════════════════════╗\n` +
                              `║ 💞 S T A T U S  A S M A R A 💞 ║\n` +
                              `╚════════════════════════╝\n\n` +
                              `╔\n` +
                              `│ 👤 User     : ${u.name}\n` +
                              `│ 💍 Pasangan : ${u.pasangan.nama}\n` +
                              `│ 💌 Status   : ${u.status_hubungan.toUpperCase()}\n` +
                              `│ 💖 Point    : ${pointAsmara} Pts\n` +
                              `│ 💰 Uang     : Rp ${uangPasangan.toLocaleString()}\n` +
                              `│ 👶 Anak     : ${anakCount} Orang\n` +
                              `│ 🤰 Hamil    : ${statusHamil}\n` +
                              `╚════════════════════════╝`;

            let txtPanel = `🎮 *PANEL INTERAKSI* 🎮\n\nPilih interaksi cepat dengan pasanganmu:\n\n` +
                           `[ 1 ] 💸 Beri Uang\n` +
                           `[ 2 ] 🎭 Action\n` +
                           `[ 3 ] 🍽️ Beri Makan\n\n_Balas pesan ini dengan angka_`;

            let pfPath = `./media/pf_${u.uid}.jpg`;
            if (fs.existsSync(pfPath)) {
                await sock.sendMessage(from, { image: fs.readFileSync(pfPath), caption: txtPasangan });
            } else {
                let charData = u.pasangan.id ? await fetchCharData(u.pasangan.id.toString()) : null;
                if (charData && charData.images?.jpg?.image_url) {
                    await sock.sendMessage(from, { image: { url: charData.images.jpg.image_url }, caption: txtPasangan });
                } else {
                    await sock.sendMessage(from, { text: txtPasangan });
                }
            }
            
            await sock.sendMessage(from, { text: txtPanel });
            break;
        }

        case 'act': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Punya pasangan aja belum!" });
            
            let allActs = ['jalan', 'suapi', 'cium', 'segss', 'buatanak'];
            let shuffled = allActs.sort(() => 0.5 - Math.random());
            let picked = shuffled.slice(0, 3);
            
            const actLabels = { 
                'jalan': '🚶‍♂️ Jalan Bersama', 
                'suapi': '🍽️ Beri Makan', 
                'cium': '💋 Cium', 
                'segss': '💦 Hubungan Intim', 
                'buatanak': '👶 Buat Anak' 
            };

            u.act_session = { '1': picked[0], '2': picked[1], '3': picked[2] };
            saveDB(db);

            let txtAct = `🎭 *INTERAKSI ACAK* 🎭\n\nSilakan pilih aktivitas di bawah ini untuk dilakukan bersama *${u.pasangan.nama}*:\n\n` +
                         `[ 1 ] ${actLabels[picked[0]]}\n` +
                         `[ 2 ] ${actLabels[picked[1]]}\n` +
                         `[ 3 ] ${actLabels[picked[2]]}\n\n` +
                         `_Balas pesan ini dengan angka_`;

            await sock.sendMessage(from, { text: txtAct });
            break;
        }

        case 'beriuang': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Kamu masih lajang." });
            if (!args[0]) return sock.sendMessage(from, { text: `💸 *BERI UANG PASANGAN*\n\nSilakan gunakan perintah:\n*${prefix}beriuang [nominal]*\n\nContoh: ${prefix}beriuang 50000` });
            
            let nominal = parseInt(args[0]);
            if (isNaN(nominal) || nominal <= 0) return sock.sendMessage(from, { text: "❌ Jumlah uang harus berupa angka positif!" });
            if (Number(u.uang) < nominal) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup. Uangmu saat ini: Rp ${Number(u.uang).toLocaleString()}` });

            u.uang -= nominal;
            if (!u.pasangan.uang) u.pasangan.uang = 0;
            u.pasangan.uang += nominal;
            saveDB(db);
            await sock.sendMessage(from, { text: `✅ *BERHASIL*\nKamu memberikan uang saku sebesar Rp ${nominal.toLocaleString()} kepada ${u.pasangan.nama}.` });
            break;
        }

        case 'jalan': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Punya pasangan aja belum!" });
            if (!checkCD(300000)) return;
            if (!u.pasangan.point_asmara) u.pasangan.point_asmara = 0; u.pasangan.point_asmara += 10; saveDB(db);
            let dialog = `💞 Kamu menggenggam tangan ${u.pasangan.nama} dan mengajaknya jalan-jalan.\n\n*${u.pasangan.nama}:* _"Wah, udaranya segar sekali! Terima kasih sudah meluangkan waktu bersamaku hari ini, sayang..."_\n\n💖 Poin Asmara: +10 Pts`;
            await sock.sendMessage(from, { text: dialog }); break;
        }

        case 'suapi': case 'makan': {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || "";
            
            // Cegah tumpang tindih perintah. Jika ini cmd '.makan', abaikan KECUALI berasal dari balasan Tombol Panel (.ps)
            if (cmd === 'makan' && !quotedText.includes("PANEL INTERAKSI")) return;

            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Punya pasangan aja belum!" });
            if (!checkCD(300000)) return;
            if (!u.pasangan.point_asmara) u.pasangan.point_asmara = 0; 
            u.pasangan.point_asmara += 20; 
            saveDB(db);
            let dialog = `🍽️ Kamu menyuapkan makanan favorit ke mulut ${u.pasangan.nama}.\n\n*${u.pasangan.nama}:* _"Nyam nyam... Enaaak! Masakan seenak apapun rasanya jauh lebih nikmat kalau disuapi olehmu hihi..."_\n\n💖 Poin Asmara: +20 Pts`;
            await sock.sendMessage(from, { text: dialog }); break;
        }

        case 'cium': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Punya pasangan aja belum!" });
            if ((u.pasangan.point_asmara || 0) < 30) return sock.sendMessage(from, { text: "❌ Poin asmaramu belum cukup! Kumpulkan minimal 30 Pts untuk bisa mencium pasangan." });
            if (!checkCD(300000)) return;
            u.pasangan.point_asmara += 30; saveDB(db);
            let dialog = `💋 Kamu menatap mata ${u.pasangan.nama} dalam-dalam, lalu mencium bibirnya dengan lembut.\n\n*${u.pasangan.nama}:* _"Mmmh... Ciumanmu manis sekali... Aku sangat mencintaimu..."_ (Wajahnya memerah)\n\n💖 Poin Asmara: +30 Pts`;
            await sock.sendMessage(from, { text: dialog }); break;
        }

        case 'nikah': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Punya pasangan aja belum!" });
            if (u.status_hubungan === 'menikah') return sock.sendMessage(from, { text: "❌ Kamu sudah menikah!" });
            if ((u.pasangan.point_asmara || 0) < 100) return sock.sendMessage(from, { text: "❌ Poin asmaramu belum cukup! Kumpulkan minimal 100 Pts." });
            
            u.status_hubungan = 'menikah'; saveDB(db);
            let dialog = `💍 *SAH!* Kamu meletakkan cincin di jari manis ${u.pasangan.nama}.\n\n*${u.pasangan.nama}:* _"A-aku resmi menjadi milikmu sekarang? Aku berjanji akan menjadi pendamping terbaik untukmu seumur hidup!"_\n\nSelamat menempuh hidup baru!`;
            await sock.sendMessage(from, { text: dialog });
            break;
        }

        case 'segss': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Cari pasangan dulu!" });
            if (u.status_hubungan !== 'menikah') return sock.sendMessage(from, { text: "❌ Haram! Harus nikah dulu!" });
            if ((u.pasangan.point_asmara || 0) < 50) return sock.sendMessage(from, { text: "❌ Poin asmaramu belum cukup! Kumpulkan minimal 50 Pts untuk melakukan hubungan intim." });
            if (!checkCD(1800000)) return; 
            
            u.pasangan.point_asmara += 50; saveDB(db);
            let dialog = `💦 Di bawah redup lampu kamar, kamu memeluk hangat tubuh ${u.pasangan.nama} dan melakukan hubungan intim.\n\n*${u.pasangan.nama}:* _"Ahh... Sayang, pelan-pelan... ahh... ini terasa luar biasa... Aku milikmu seutuhnya..."_\n\n💖 Poin Asmara: +50 Pts`;
            await sock.sendMessage(from, { text: dialog }); break;
        }

        case 'buatanak': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Cari pasangan dulu!" });
            if (u.status_hubungan !== 'menikah') return sock.sendMessage(from, { text: "❌ Haram! Harus nikah dulu!" });
            if (u.pasangan.kehamilan) return sock.sendMessage(from, { text: "❌ Pasanganmu sedang hamil!" });
            if (!checkCD(3600000)) return;
            
            u.pasangan.kehamilan = true;
            u.pasangan.waktu_mulai = Date.now(); saveDB(db);
            let dialog = `👶 Setelah malam yang panjang, beberapa waktu berlalu dan hasil tes menunjukkan garis dua.\n\n*${u.pasangan.nama}:* _"Sayang... A-aku hamil! Ya ampun, kita akan menjadi orang tua! Aku sangat bahagia!"_ (Menangis terharu)\n\n_Kandungan akan bertambah 1 Bulan setiap 1 Jam. Gunakan .namaianak setelah 9 Bulan._`;
            await sock.sendMessage(from, { text: dialog }); break;
        }

        case 'namaianak': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Cari pasangan dulu!" });
            if (!u.pasangan.kehamilan) return sock.sendMessage(from, { text: "❌ Pasanganmu tidak sedang hamil!" });
            
            let months = Math.floor((Date.now() - u.pasangan.waktu_mulai) / 3600000);
            if (months < 9) return sock.sendMessage(from, { text: `❌ Usia kandungan baru ${months} Bulan. Belum saatnya melahirkan!` });
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}namaianak [nama anak]` });
            
            if (!u.anak) u.anak = [];
            let namaAnak = args.join(" ");
            let genderAnak = u.pasangan.gender_anak || (Math.random() < 0.5 ? 'Laki-Laki' : 'Perempuan');
            
            u.anak.push({ nama: namaAnak, gender: genderAnak });
            
            u.pasangan.kehamilan = false; 
            u.pasangan.waktu_mulai = 0; 
            delete u.pasangan.gender_anak;
            saveDB(db);
            
            await sock.sendMessage(from, { text: `🎉 *KELAHIRAN* 🎉\nSelamat! ${u.pasangan.nama} telah melahirkan bayi ${genderAnak} dengan sehat.\nAnakmu diberi nama: *${namaAnak}*` });
            break;
        }

        case 'listanak': {
            if (!u.anak || u.anak.length === 0) return sock.sendMessage(from, { text: "❌ Kamu belum memiliki anak." });
            let txtAnak = `👶 *DAFTAR ANAKMU*\n\n` + u.anak.map((a, i) => {
                if (typeof a === 'string') return `*${i+1}.* ${a} ⚥ (Tidak Diketahui)`; 
                return `*${i+1}.* ${a.nama} ⚥ ${a.gender}`;
            }).join('\n');
            await sock.sendMessage(from, { text: txtAnak });
            break;
        }

        case 'cerai': case 'putus': {
            if (u.status_hubungan === 'lajang' || !u.pasangan) return sock.sendMessage(from, { text: "❌ Kamu masih lajang." });
            
            let namaMantan = u.pasangan.nama;
            let idMantan = u.pasangan.id;

            if (!u.blacklist_karakter) u.blacklist_karakter = [];
            if (idMantan && !u.blacklist_karakter.includes(idMantan.toString())) {
                u.blacklist_karakter.push(idMantan.toString());
            }

            u.status_hubungan = 'lajang'; 
            delete u.pasangan; 
            delete u.anak; 

            let pfPath = `./media/pf_${u.uid}.jpg`;
            if (fs.existsSync(pfPath)) {
                try { fs.unlinkSync(pfPath); } catch (e) {}
            }

            saveDB(db);
            await sock.sendMessage(from, { text: `💔 *HUBUNGAN BERAKHIR*\nKamu telah resmi berpisah dengan *${namaMantan}*.\n\n🚫 Karakter ini telah dimasukkan ke daftar Blacklist-mu.\n🔄 Data keluarga dan foto pasangan telah di-reset.` });
            break;
        }

        case 'setpfpasangan': {
            if (u.status_hubungan === 'lajang') return sock.sendMessage(from, { text: "❌ Kamu masih lajang." });
            let qMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!qMsg || !qMsg.imageMessage) return sock.sendMessage(from, { text: "❌ Reply foto yang ingin diajukan sebagai profil pasangan!" });
            
            try {
                const genCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                
                const stream = await downloadContentFromMessage(qMsg.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                
                fs.writeFileSync(`./media/pending_pf_${genCode}.jpg`, buffer);
                if (!db.global.pending_acc) db.global.pending_acc = {};
                
                let charIdDisplay = u.pasangan.id || "Tidak Diketahui";
                let linkDisplay = u.pasangan.id ? `https://myanimelist.net/character/${u.pasangan.id}` : "Data URL Tidak Tersedia";

                db.global.pending_acc[genCode] = { 
                    type: 'pf', 
                    sender: sender, 
                    uid: u.uid,
                    playerName: u.name,
                    charName: u.pasangan.nama,
                    charId: charIdDisplay
                };
                saveDB(db);
                
                await sock.sendMessage(from, { text: `✅ *PENGAJUAN TERKIRIM*\n\nAjuan Foto Pasanganmu sedang ditinjau oleh Admin.\n🎟️ *Kode Pengajuan:* ${genCode}\n\n_Bot akan mengirim pesan pribadi (PM) kepadamu jika ajuan ini Diterima atau Ditolak._` });

                let targetAdminGroup = db.global.acc_group || db.global.owner_utama;

                if (targetAdminGroup) {
                    let reqMessage = `🔔 *PENGAJUAN FOTO PASANGAN* 🔔\n\n` +
                                     `👤 *Pemohon:* ${u.name}\n` +
                                     `📛 *Karakter:* ${u.pasangan.nama}\n` +
                                     `🆔 *ID MAL:* ${charIdDisplay}\n` +
                                     `🔗 *Link MAL:* ${linkDisplay}\n\n` +
                                     `🎟️ *Kode Pengajuan:* ${genCode}\n\n` +
                                     `*INSTRUKSI ADMIN/OWNER:*\n` +
                                     `✅ *Terima:* ${prefix}acc pf ${genCode}\n` +
                                     `❌ *Tolak:* ${prefix}tolak pf ${genCode} [Alasan]`;

                    await sock.sendMessage(targetAdminGroup, { image: buffer, caption: reqMessage });
                }

            } catch (err) {
                await sock.sendMessage(from, { text: "❌ Gagal memproses gambar. Pastikan kamu me-reply gambar yang valid." });
            }
            break;
        }
    }
}