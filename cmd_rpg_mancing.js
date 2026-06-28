import { readDB, saveDB } from './database.js';

// 🔥 DATABASE HARGA IKAN UNTUK BURSA PASAR IKAN 🔥
const FISH_TYPES = {
    'lele': { nama: '🐟 Ikan Lele', rarity: 'Biasa', min: 10000, max: 30000, step: 2000, updateTime: 300000 },
    'nila': { nama: '🐟 Ikan Nila', rarity: 'Biasa', min: 12000, max: 32000, step: 2000, updateTime: 300000 },
    'bawal': { nama: '🐡 Ikan Bawal', rarity: 'Biasa', min: 15000, max: 35000, step: 2500, updateTime: 300000 },
    'arwana': { nama: '🐠 Arwana', rarity: 'Langka', min: 100000, max: 500000, step: 20000, updateTime: 900000 },
    'koi': { nama: '🎏 Ikan Koi', rarity: 'Langka', min: 120000, max: 550000, step: 25000, updateTime: 900000 },
    'salmon': { nama: '🍣 Salmon', rarity: 'Langka', min: 150000, max: 600000, step: 30000, updateTime: 900000 },
    'hiu': { nama: '🦈 Hiu Putih', rarity: 'Legendaris', min: 1000000, max: 5000000, step: 250000, updateTime: 3600000 },
    'orca': { nama: '🐳 Paus Orca', rarity: 'Legendaris', min: 1500000, max: 6000000, step: 300000, updateTime: 3600000 },
    'naga': { nama: '🐉 Naga Laut', rarity: 'Legendaris', min: 2000000, max: 8000000, step: 500000, updateTime: 3600000 }
};

export async function handleRPGMancing(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender]; 
    if (!u.cd) u.cd = {};

    switch(cmd) {
        case 'mancing': {
            let now = Date.now();
            if (u.cd.mancing && u.cd.mancing > now) {
                let sisaM = Math.ceil((u.cd.mancing - now) / 60000);
                return sock.sendMessage(from, { text: `⏳ Ikan sedang tidak lapar. Tunggu *${sisaM} Menit* lagi untuk memancing.` });
            }
            
            // Pengecekan limit umpan dan joran
            if (!u.fishing_gear || !u.fishing_gear.active_rod || u.fishing_gear.rod_uses <= 0) {
                return sock.sendMessage(from, { text: `❌ Kamu tidak memiliki Joran atau joranmu telah rusak!\nBeli joran baru di ${prefix}shop.` });
            }
            if (!u.fishing_gear.active_bait || u.fishing_gear.bait_uses <= 0) {
                return sock.sendMessage(from, { text: `❌ Kamu kehabisan Umpan!\nBeli umpan baru di ${prefix}shop.` });
            }

            let chance = Math.random() * 100;
            let rarity = chance < 5 ? 'Legendaris' : chance < 30 ? 'Langka' : 'Biasa'; // 5% Legendaris, 25% Langka, 70% Biasa
            
            let possibleFish = Object.keys(FISH_TYPES).filter(k => FISH_TYPES[k].rarity === rarity);
            let caught = possibleFish[Math.floor(Math.random() * possibleFish.length)];
            
            if (!u.ikan) u.ikan = {};
            u.ikan[caught] = (u.ikan[caught] || 0) + 1;
            u.cd.mancing = now + 300000; // CD 5 Menit

            // Mengurangi durabilitas setiap 1x percobaan memancing
            u.fishing_gear.rod_uses -= 1;
            u.fishing_gear.bait_uses -= 1;

            let extraMsg = `\n\n➖ Sisa Joran: ${u.fishing_gear.rod_uses}/${u.fishing_gear.rod_max || 0}\n➖ Sisa Umpan: ${u.fishing_gear.bait_uses}/${u.fishing_gear.bait_max || 0}`;

            // Penghancuran otomatis jika mencapai 0 percobaan
            if (u.fishing_gear.rod_uses <= 0) {
                extraMsg += `\n⚠️ *CRACK! ${u.fishing_gear.active_rod} milikmu Patah!*`;
                u.fishing_gear.active_rod = null;
            }
            if (u.fishing_gear.bait_uses <= 0) {
                extraMsg += `\n⚠️ *Umpanmu habis!*`;
                u.fishing_gear.active_bait = null;
            }

            saveDB(db);
            
            let rarityIcons = {'Biasa': '⚪', 'Langka': '🟡', 'Legendaris': '🔴'};
            await sock.sendMessage(from, { text: `🎣 *BERHASIL MEMANCING!* 🎣\n\nKamu melempar umpan dan mendapatkan:\n${rarityIcons[rarity]} *${FISH_TYPES[caught].nama}*\n└ Rarity: ${rarity}${extraMsg}\n\n_Cek tangkapanmu dengan ${prefix}koleksi_`});
            break;
        }

        case 'pasarikan': {
            if (!db.market_ikan) db.market_ikan = {}; 
            let txtIkan = `🐟 [ PASAR IKAN GLOBAL ] 🐟\n=========================\n\n`; 
            let now = Date.now();
            
            for (let key in FISH_TYPES) {
                let item = FISH_TYPES[key];
                if (!db.market_ikan[key]) db.market_ikan[key] = { price: item.min, next_update: now + item.updateTime, trend: '📈 Naik' }; 
                
                if (now >= db.market_ikan[key].next_update) {
                    let oldPrice = db.market_ikan[key].price; 
                    let range = Math.floor((item.max - item.min) / item.step);
                    let newPrice = item.min + (Math.floor(Math.random() * (range + 1)) * item.step);
                    db.market_ikan[key].price = newPrice; 
                    db.market_ikan[key].trend = (newPrice > oldPrice) ? '📈 Naik' : (newPrice < oldPrice) ? '📉 Turun' : '➡️ Stabil'; 
                    db.market_ikan[key].next_update = now + item.updateTime; 
                }
                let userAsset = (u.ikan && u.ikan[key]) ? u.ikan[key] : 0;
                txtIkan += `[ Kode: ${key} ] ${item.nama}\n│ Rarity: ${item.rarity}\n│ Harga: Rp ${db.market_ikan[key].price.toLocaleString()}\n│ Tren: ${db.market_ikan[key].trend}\n│ Punyamu: ${userAsset} Ekor\n╰────────────────────────\n\n`;
            }
            saveDB(db);
            txtIkan += `_Jual ke kolektor NPC: ${prefix}jualikan [kode] [jumlah/all]_\n_Jual ke player asli: ${prefix}tawarikan [@tag] [kode] [jumlah] [harga]_`;
            await sock.sendMessage(from, { text: txtIkan });
            break;
        }

        case 'koleksi': case 'ikan': {
            if (!u.ikan || Object.keys(u.ikan).length === 0) return sock.sendMessage(from, { text: "📦 Koleksi ikanmu masih kosong. Pergi .mancing dulu sana!" });
            let txtKol = `🎒 *KOLEKSI IKANMU* 🎒\n\n`;
            let totalVal = 0;
            if (!db.market_ikan) db.market_ikan = {};
            
            for (let key in u.ikan) {
                if (u.ikan[key] > 0 && FISH_TYPES[key]) {
                    let mPrice = db.market_ikan[key]?.price || FISH_TYPES[key].min;
                    txtKol += `▸ ${FISH_TYPES[key].nama}: ${u.ikan[key]} Ekor\n`;
                    totalVal += (u.ikan[key] * mPrice);
                }
            }
            txtKol += `\n💰 Estimasi Nilai Koleksi: Rp ${totalVal.toLocaleString()}\n_Gunakan ${prefix}pasarikan untuk melihat kode dan harga pasar terbaru._`;
            await sock.sendMessage(from, { text: txtKol });
            break;
        }

        case 'jualikan': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}jualikan [kode_ikan] [jumlah/all]` });
            let kodeIkan = args[0].toLowerCase();
            if (!FISH_TYPES[kodeIkan]) return sock.sendMessage(from, { text: "❌ Kode ikan tidak terdaftar di Pasar Ikan." });
            
            if (!u.ikan || !u.ikan[kodeIkan] || u.ikan[kodeIkan] <= 0) return sock.sendMessage(from, { text: "❌ Kamu tidak memiliki ikan jenis ini." });
            
            let qtyVal;
            if (args[1]?.toLowerCase() === 'all') qtyVal = u.ikan[kodeIkan];
            else qtyVal = parseInt(args[1] || 1);
            
            if (isNaN(qtyVal) || qtyVal <= 0 || qtyVal > u.ikan[kodeIkan]) return sock.sendMessage(from, { text: "❌ Jumlah ikan tidak valid atau tidak mencukupi." });
            
            if (!db.market_ikan) db.market_ikan = {};
            if (!db.market_ikan[kodeIkan]) db.market_ikan[kodeIkan] = { price: FISH_TYPES[kodeIkan].min };
            
            let totalHarga = db.market_ikan[kodeIkan].price * qtyVal;
            
            u.ikan[kodeIkan] -= qtyVal;
            u.uang = Number(u.uang) + totalHarga;
            saveDB(db);
            
            await sock.sendMessage(from, { text: `🤝 *TERJUAL KE KOLEKTOR*\n\nKamu menjual ${qtyVal}x ${FISH_TYPES[kodeIkan].nama}.\n💵 Pendapatan Bersih: Rp ${totalHarga.toLocaleString()}` });
            break;
        }

        case 'tawarikan': {
            let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
            let cleanArgs = args.filter(a => !a.startsWith('@')); 
            
            if (!target || cleanArgs.length < 3) return sock.sendMessage(from, { text: `❌ Format: ${prefix}tawarikan [@tag_pembeli] [kode_ikan] [jumlah] [harga_total]` });
            
            let kodeIkan = cleanArgs[0].toLowerCase();
            let amount = parseInt(cleanArgs[1]);
            let price = parseInt(cleanArgs[2]);
            
            if (!FISH_TYPES[kodeIkan]) return sock.sendMessage(from, { text: "❌ Kode ikan tidak valid. Cek .pasarikan" });
            if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) return sock.sendMessage(from, { text: "❌ Jumlah dan Harga harus berupa angka positif." });
            
            if (!u.ikan || (u.ikan[kodeIkan] || 0) < amount) return sock.sendMessage(from, { text: "❌ Ikan di koleksimu tidak cukup untuk ditawarkan." });
            
            if (!global.trade_ikan) global.trade_ikan = {};
            let tradeId = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            global.trade_ikan[tradeId] = { seller: sender, buyer: target, ikan: kodeIkan, jumlah: amount, harga: price, expired: Date.now() + 120000 };
            
            await sock.sendMessage(from, { text: `📢 *PENAWARAN IKAN DIBUAT*\n\nKepada: @${target.split('@')[0]}\nIkan: ${amount}x ${FISH_TYPES[kodeIkan].nama}\nHarga Borongan: Rp ${price.toLocaleString()}\n\n_Ketik ${prefix}terimaikan ${tradeId} untuk membeli._\n_Penawaran kadaluwarsa dalam 2 menit._`, mentions: [target] });
            break;
        }

        case 'terimaikan': {
            let tradeId = args[0]?.toUpperCase();
            if (!tradeId) return sock.sendMessage(from, { text: `❌ Format: ${prefix}terimaikan [ID_Transaksi]` });
            
            if (!global.trade_ikan || !global.trade_ikan[tradeId]) return sock.sendMessage(from, { text: "❌ Transaksi tidak ditemukan atau sudah kadaluwarsa." });
            let trade = global.trade_ikan[tradeId];
            
            if (Date.now() > trade.expired) { delete global.trade_ikan[tradeId]; return sock.sendMessage(from, { text: "❌ Waktu penawaran sudah habis." }); }
            if (trade.buyer !== sender) return sock.sendMessage(from, { text: "❌ Penawaran ini tidak ditujukan untukmu." });
            if (Number(u.uang) < trade.harga) return sock.sendMessage(from, { text: "❌ Uangmu tidak cukup untuk membeli tawaran ini." });
            
            let seller = db.users[trade.seller];
            if (!seller.ikan || (seller.ikan[trade.ikan] || 0) < trade.jumlah) {
                delete global.trade_ikan[tradeId]; return sock.sendMessage(from, { text: "❌ Transaksi batal karena penjual sudah tidak memiliki ikan tersebut." });
            }
            
            u.uang -= trade.harga;
            if (!u.ikan) u.ikan = {};
            u.ikan[trade.ikan] = (u.ikan[trade.ikan] || 0) + trade.jumlah;
            
            seller.uang += trade.harga;
            seller.ikan[trade.ikan] -= trade.jumlah;
            saveDB(db); delete global.trade_ikan[tradeId];
            
            await sock.sendMessage(from, { text: `🤝 *TRANSAKSI BERHASIL*\n\nKamu telah membeli ${trade.jumlah}x ${FISH_TYPES[trade.ikan].nama} seharga Rp ${trade.harga.toLocaleString()} dari @${trade.seller.split('@')[0]}.`, mentions: [trade.seller] });
            break;
        }
    }
}
