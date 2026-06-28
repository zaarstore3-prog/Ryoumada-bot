import { readDB, saveDB } from './database.js';

const SHOP = {
    makanan: {
        'mierendang': { nama: "Mie Goreng Rendang", harga: 15000, energi: 20 },
        'spaghetti': { nama: "Spaghetti Bolognese Pedas", harga: 25000, energi: 40 },
        'sosis': { nama: "Sosis Smoked Bratwurst", harga: 45000, energi: 75 }
    },
    minuman: {
        'americano': { nama: "Kopi Instant Americano", harga: 12000, energi: 15 },
        'madulemon': { nama: "Minuman Karbonasi Madu Lemon", harga: 20000, energi: 35 }
    },
    buff: {
        'buff1': { nama: "Double XP (1 Jam)", harga: 50000, durasi: 3600000 },
        'buff6': { nama: "Double XP (6 Jam)", harga: 250000, durasi: 21600000 },
        'buff12': { nama: "Double XP (12 Jam)", harga: 450000, durasi: 43200000 },
        'buff24': { nama: "Double XP (24 Jam)", harga: 800000, durasi: 86400000 }
    },
    umpan: {
        'bait1': { nama: "Cacing Emas", harga: 500000, max_use: 3, desc: "Peluang ikan langka sedikit naik" },
        'bait2': { nama: "Udang Kristal", harga: 2000000, max_use: 3, desc: "Peluang besar mendapat ikan Epic" },
        'bait3': { nama: "Serpihan Bintang", harga: 5000000, max_use: 3, desc: "Sangat jitu untuk ikan Legendaris" }
    },
    pancingan: {
        'rod1': { nama: "Joran Kayu Jati", harga: 1000000, max_use: 10, desc: "Kuat, ikan jarang lepas (Standar)" },
        'rod2': { nama: "Joran Karbon Fiber", harga: 3000000, max_use: 10, desc: "Sangat fleksibel, lebih mudah ditarik" },
        'rod3': { nama: "Joran Poseidon", harga: 10000000, max_use: 10, desc: "Hampir pasti dapat ikan besar / Legendaris" }
    }
};

export async function handleRPGItems(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender];
    
    if (!u.fishing_gear) u.fishing_gear = { active_bait: null, bait_uses: 0, bait_max: 0, active_rod: null, rod_uses: 0, rod_max: 0 };

    switch(cmd) {
        case 'shop': {
            let txt = `🏪 *ANGKRINGAN SUSU DI NGEMILK* 🏪\n\n`;
            
            txt += `🍔 *MAKANAN (Pemulih Energi)*\n`;
            for (let k in SHOP.makanan) {
                txt += `▸ *${k}* - ${SHOP.makanan[k].nama}\n  Rp ${SHOP.makanan[k].harga.toLocaleString()} | ⚡ +${SHOP.makanan[k].energi}\n`;
            }

            txt += `\n🍹 *MINUMAN (Pemulih Energi)*\n`;
            for (let k in SHOP.minuman) {
                txt += `▸ *${k}* - ${SHOP.minuman[k].nama}\n  Rp ${SHOP.minuman[k].harga.toLocaleString()} | ⚡ +${SHOP.minuman[k].energi}\n`;
            }

            txt += `\n🎣 *UMPAN MANCING*\n`;
            for (let k in SHOP.umpan) {
                txt += `▸ *${k}* - ${SHOP.umpan[k].nama} (${SHOP.umpan[k].max_use}x Pakai)\n  Rp ${SHOP.umpan[k].harga.toLocaleString()} | _${SHOP.umpan[k].desc}_\n`;
            }

            txt += `\n🎣 *JORAN MANCING*\n`;
            for (let k in SHOP.pancingan) {
                txt += `▸ *${k}* - ${SHOP.pancingan[k].nama} (${SHOP.pancingan[k].max_use}x Pakai)\n  Rp ${SHOP.pancingan[k].harga.toLocaleString()} | _${SHOP.pancingan[k].desc}_\n`;
            }

            txt += `\n🌟 *PENGALAMAN (XP)*\n`;
            txt += `▸ *xp* - Beli XP sesukamu! (Rp 150/XP)\n  _(Contoh: ${prefix}beliitem xp 500 atau ${prefix}beliitem xp all)_\n`;

            txt += `\n🔥 *BUFF DOUBLE XP*\n`;
            for (let k in SHOP.buff) {
                txt += `▸ *${k}* - ${SHOP.buff[k].nama}\n  Rp ${SHOP.buff[k].harga.toLocaleString()}\n`;
            }

            txt += `\n🛒 *Cara Beli:* ${prefix}beliitem [kode] [jumlah]\n_(Catatan: Umpan & Joran langsung terpasang saat dibeli)_`;
            await sock.sendMessage(from, { text: txt });
            break;
        }

        case 'beliitem': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}beliitem [kode_barang] [jumlah/all]` });
            let itemCode = args[0].toLowerCase();
            let amountRaw = args[1] ? args[1].toLowerCase() : '1';
            
            if (SHOP.umpan[itemCode]) {
                let gear = SHOP.umpan[itemCode];
                if (u.uang < gear.harga) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup! Butuh Rp ${gear.harga.toLocaleString()}` });
                u.uang -= gear.harga;
                u.fishing_gear.active_bait = gear.nama;
                u.fishing_gear.bait_uses = gear.max_use;
                u.fishing_gear.bait_max = gear.max_use; 
                saveDB(db);
                return sock.sendMessage(from, { text: `✅ Berhasil membeli dan memasang *${gear.nama}*!\nKini kamu memiliki ${gear.max_use}/${gear.max_use} kesempatan lemparan.` });
            }

            if (SHOP.pancingan[itemCode]) {
                let gear = SHOP.pancingan[itemCode];
                if (u.uang < gear.harga) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup! Butuh Rp ${gear.harga.toLocaleString()}` });
                u.uang -= gear.harga;
                u.fishing_gear.active_rod = gear.nama;
                u.fishing_gear.rod_uses = gear.max_use;
                u.fishing_gear.rod_max = gear.max_use; 
                saveDB(db);
                return sock.sendMessage(from, { text: `✅ Berhasil membeli dan memasang *${gear.nama}*!\nJoran siap digunakan untuk ${gear.max_use}/${gear.max_use} tarikan tangkapan.` });
            }

            if (itemCode === 'xp') {
                let xpPrice = 150;
                let amount = 0;
                if (amountRaw === 'all') {
                    amount = Math.floor(u.uang / xpPrice);
                    if (amount <= 0) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup untuk memborong XP.` });
                } else {
                    amount = parseInt(amountRaw);
                    if (isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: `❌ Jumlah XP tidak valid.` });
                }
                
                let totalCost = amount * xpPrice;
                if (u.uang < totalCost) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup! Butuh Rp ${totalCost.toLocaleString()}` });
                
                u.uang -= totalCost;
                u.xp += amount;
                
                let xpReq = u.level === 1 ? 100 : (u.level === 2 ? 500 : Math.pow(u.level, 2) * 125);
                let isLvlUp = false;
                while (u.xp >= xpReq) {
                    u.level += 1;
                    isLvlUp = true;
                    xpReq = u.level === 1 ? 100 : (u.level === 2 ? 500 : Math.pow(u.level, 2) * 125);
                }

                saveDB(db);
                let textBeli = `✅ *PEMBELIAN XP BERHASIL*\nKamu memborong ${amount.toLocaleString()} XP seharga Rp ${totalCost.toLocaleString()}.`;
                if (isLvlUp) textBeli += `\n\n🎉 *BAM! LEVEL UP!*\nKamu melesat ke *Level ${u.level}* (Sisa XP: ${u.xp}/${xpReq})`;
                
                return sock.sendMessage(from, { text: textBeli });
            }

            if (SHOP.buff[itemCode]) {
                let buff = SHOP.buff[itemCode];
                let amount = parseInt(amountRaw);
                if (isNaN(amount) || amount <= 0) amount = 1;
                if (amount > 1) return sock.sendMessage(from, { text: `❌ Buff hanya bisa dibeli 1 per 1 agar efeknya maksimal.` });
                
                if (u.uang < buff.harga) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup! Butuh Rp ${buff.harga.toLocaleString()}` });
                
                u.uang -= buff.harga;
                let now = Date.now();
                u.exp_buff_until = (u.exp_buff_until > now ? u.exp_buff_until : now) + buff.durasi;
                u.exp_multiplier = 2;
                saveDB(db);
                return sock.sendMessage(from, { text: `✅ *BUFF DIAKTIFKAN*\nKamu berhasil membeli ${buff.nama}. Kumpulkan XP sebanyak-banyaknya!` });
            }

            let itemData = SHOP.makanan[itemCode] || SHOP.minuman[itemCode];
            if (!itemData) return sock.sendMessage(from, { text: `❌ Barang tidak ditemukan di toko.` });

            let amount = parseInt(amountRaw);
            if (isNaN(amount) || amount <= 0) amount = 1;

            let totalCost = itemData.harga * amount;
            if (u.uang < totalCost) return sock.sendMessage(from, { text: `❌ Uangmu tidak cukup! Butuh Rp ${totalCost.toLocaleString()}` });

            u.uang -= totalCost;
            if (!u.inventory[itemCode]) u.inventory[itemCode] = 0;
            u.inventory[itemCode] += amount;
            saveDB(db);
            return sock.sendMessage(from, { text: `🛒 *BERHASIL DIBELI*\nKamu membeli ${amount}x ${itemData.nama} seharga Rp ${totalCost.toLocaleString()}.\n_Barang telah disimpan, ketik ${prefix}inventory untuk mengecek tasmu._` });
        }

        case 'inventory': case 'tas': {
            let txt = `🎒 *INVENTORY PLAYER* 🎒\n\n`;
            let hasItem = false;
            
            txt += `🍔 *Makanan & Minuman:*\n`;
            for (let k in u.inventory) {
                if (u.inventory[k] > 0) {
                    hasItem = true;
                    let detail = SHOP.makanan[k] || SHOP.minuman[k];
                    if (detail) {
                        txt += `▸ ${detail.nama} (x${u.inventory[k]})\n  _Gunakan: ${prefix}${SHOP.makanan[k] ? 'makan' : 'minum'} ${k}_\n`;
                    }
                }
            }
            if (!hasItem) txt += `_(Tas kamu masih kosong)_\n`;

            txt += `\n🎣 *Peralatan Mancing Aktif:*\n`;
            txt += `▸ Umpan: ${u.fishing_gear.active_bait || 'Kosong'} (${u.fishing_gear.bait_uses}/${u.fishing_gear.bait_max || 0})\n`;
            txt += `▸ Joran: ${u.fishing_gear.active_rod || 'Kosong'} (${u.fishing_gear.rod_uses}/${u.fishing_gear.rod_max || 0})\n`;

            txt += `\n⚡ *Energi Saat Ini:* ${u.energi}/100`;
            await sock.sendMessage(from, { text: txt });
            break;
        }

        case 'makan': case 'minum': {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || "";
            
            if (cmd === 'makan' && quotedText.includes("PANEL INTERAKSI")) return;

            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}${cmd} [kode_barang]` });
            let itemCode = args[0].toLowerCase();
            
            let itemData = SHOP.makanan[itemCode] || SHOP.minuman[itemCode];
            if (!itemData) return sock.sendMessage(from, { text: `❌ Barang tidak bisa dikonsumsi.` });

            if (!u.inventory[itemCode] || u.inventory[itemCode] <= 0) return sock.sendMessage(from, { text: `❌ Kamu tidak memiliki ${itemData.nama} di dalam inventory.` });
            if (u.energi >= 100) return sock.sendMessage(from, { text: `⚠️ Energi kamu sudah penuh maksimal (100/100)! Jangan makan berlebihan.` });

            u.inventory[itemCode] -= 1;
            u.energi += itemData.energi;
            if (u.energi > 100) u.energi = 100;

            saveDB(db);
            let emoji = SHOP.makanan[itemCode] ? '🍽️' : '🥤';
            let action = SHOP.makanan[itemCode] ? 'memakan' : 'meminum';
            return sock.sendMessage(from, { text: `${emoji} Kamu ${action} ${itemData.nama}.\n⚡ Energi memulih +${itemData.energi} (Total: ${u.energi}/100)` });
        }

        case 'crredeem': {
            let argsString = args.join(" ").toLowerCase();
            if (!argsString) return sock.sendMessage(from, { text: `❌ Format: ${prefix}crredeem uang=10000 xp=500 limitcmd=5 doublexp=1 kuota=5\n\n_(Lihat harga satuan item di .shop)_` });

            let rUang = 0, rXp = 0, rKuota = 1, rDoubleXp = 0, rLimitCmd = 0;
            let params = argsString.split(' ');
            
            for (let p of params) {
                if (p.startsWith('uang=')) rUang = parseInt(p.split('=')[1]) || 0;
                if (p.startsWith('xp=')) rXp = parseInt(p.split('=')[1]) || 0;
                if (p.startsWith('kuota=')) rKuota = parseInt(p.split('=')[1]) || 1;
                if (p.startsWith('doublexp=')) rDoubleXp = parseInt(p.split('=')[1]) || 0;
                if (p.startsWith('limitcmd=')) rLimitCmd = parseInt(p.split('=')[1]) || 0;
            }

            if (rUang <= 0 && rXp <= 0 && rDoubleXp <= 0 && rLimitCmd <= 0) return sock.sendMessage(from, { text: "❌ Tentukan minimal 1 jenis hadiah yang valid untuk vouchermu!" });
            if (rKuota <= 0) return sock.sendMessage(from, { text: "❌ Kuota pengguna minimal 1." });

            let costUang = rUang; 
            let costXpToUang = rXp * 150; 
            let costDoubleXp = rDoubleXp * 50000; 
            let costLimitCmd = rLimitCmd * 5000;

            let totalSatuan = costUang + costXpToUang + costDoubleXp + costLimitCmd;
            let totalCost = totalSatuan * rKuota;

            if (u.uang < totalCost) return sock.sendMessage(from, { text: `❌ Saldo kamu tidak cukup membuat voucher ini!\n💳 Total Tagihan: Rp ${totalCost.toLocaleString()}` });

            u.uang -= totalCost;

            const newCode = 'VCH-' + Math.random().toString(36).substring(2, 7).toUpperCase();
            let rwdObj = {};
            if (rUang > 0) rwdObj.uang = rUang;
            if (rXp > 0) rwdObj.xp = rXp;
            if (rDoubleXp > 0) rwdObj.double_xp_jam = rDoubleXp;
            if (rLimitCmd > 0) rwdObj.limit_cmd = rLimitCmd;

            if (!db.global.redeem_codes) db.global.redeem_codes = {};
            db.global.redeem_codes[newCode] = { 
                reward: rwdObj, limit: rKuota, used: 0, claimed_by: [], expired: Date.now() + (86400000 * 7), creator: sender
            };
            saveDB(db);

            let rwdTxt = [];
            if (rUang > 0) rwdTxt.push(`💵 Uang (Rp ${rUang.toLocaleString()})`);
            if (rXp > 0) rwdTxt.push(`🌟 XP (${rXp})`);
            if (rDoubleXp > 0) rwdTxt.push(`🔥 Double XP (${rDoubleXp} Jam)`);
            if (rLimitCmd > 0) rwdTxt.push(`⚡ Limit Command (${rLimitCmd})`);

            await sock.sendMessage(from, { text: `🎟️ *REDEEM CODE DIBUAT* 🎟️\n\nTagihan Rp ${totalCost.toLocaleString()} telah dipotong.\n\nKode: *${newCode}*\nHadiah: ${rwdTxt.join(' & ')}\nKuota: ${rKuota} Pengguna\n\n_Segera bagikan kode ini ke player lain!_` });
            break;
        }

        case 'redeem': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}redeem [kode]` });
            let code = args[0].toUpperCase();
            if (!db.global.redeem_codes || !db.global.redeem_codes[code]) return sock.sendMessage(from, { text: `❌ Kode redeem tidak valid / tidak ditemukan.` });
            
            let voucher = db.global.redeem_codes[code];
            if (voucher.expired < Date.now()) return sock.sendMessage(from, { text: `❌ Kode redeem sudah kadaluwarsa.` });
            if (voucher.used >= voucher.limit) return sock.sendMessage(from, { text: `❌ Kuota kode redeem ini sudah habis digunakan.` });
            if (voucher.claimed_by.includes(sender)) return sock.sendMessage(from, { text: `❌ Kamu sudah pernah menukarkan kode ini sebelumnya.` });

            voucher.used += 1;
            voucher.claimed_by.push(sender);

            let rwd = voucher.reward;
            let txt = `✅ *KLAIM REDEEM BERHASIL*\n\nKamu mendapatkan:\n`;
            
            // Eksekusi Hadiah Uang
            if (rwd.uang) { 
                u.uang += rwd.uang; 
                txt += `💵 Rp ${rwd.uang.toLocaleString()}\n`; 
            }
            // Eksekusi Hadiah Limit
            if (rwd.limit_cmd) {
                if (u.limit !== 'UNLIMITED') u.limit = (u.limit || 0) + rwd.limit_cmd;
                txt += `⚡ ${rwd.limit_cmd} Limit Command\n`;
            }
            // Eksekusi Hadiah Double XP
            if (rwd.double_xp_jam) { 
                let now = Date.now();
                u.exp_buff_until = (u.exp_buff_until > now ? u.exp_buff_until : now) + (rwd.double_xp_jam * 3600000);
                u.exp_multiplier = 2;
                txt += `🔥 Double XP (${rwd.double_xp_jam} Jam)\n`; 
            }
            // Eksekusi Hadiah Badge (Masuk otomatis ke array badges player)
            if (rwd.badge) {
                if (!u.badges) u.badges = [];
                if (!u.badges.includes(rwd.badge)) {
                    u.badges.push(rwd.badge);
                    txt += `🏅 Badge Spesial: ${rwd.badge}\n`;
                } else {
                    txt += `🏅 Badge Spesial: ${rwd.badge} (Sudah Dimiliki)\n`;
                }
            }
            // Eksekusi Hadiah XP Kumulatif & Level Up
            if (rwd.xp) { 
                u.xp += rwd.xp; 
                txt += `🌟 ${rwd.xp} XP\n`; 
                
                let xpReq = u.level === 1 ? 100 : (u.level === 2 ? 500 : Math.pow(u.level, 2) * 125);
                let isLvlUp = false;
                
                while (u.xp >= xpReq) {
                    u.level += 1;
                    isLvlUp = true;
                    xpReq = u.level === 1 ? 100 : (u.level === 2 ? 500 : Math.pow(u.level, 2) * 125);
                }
                if (isLvlUp) txt += `\n🎉 *LEVEL UP ke Lv.${u.level}* (Sisa XP: ${u.xp}/${xpReq})\n`;
            }
            
            saveDB(db);
            return sock.sendMessage(from, { text: txt });
        }
    }
}
