import { readDB, saveDB, INVESTMENTS } from './database.js';

export async function handleRPGMarket(sock, msg, from, sender, cmd, args, u, prefix) {
    let db = readDB();
    if (!db.users[sender]) db.users[sender] = u;
    u = db.users[sender]; 
    if (!u.cd) u.cd = {};

    switch(cmd) {
        case 'tfsaham': case 'giveitem': {
            let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            let cleanArgs = args.filter(a => !a.startsWith('@'));
            let kodeSaham = cleanArgs[0]?.toUpperCase();
            let amount = parseInt(cleanArgs[1]);
            
            if (!target || !kodeSaham || isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: `❌ Format: ${prefix}tfsaham [@tag] [kode_saham] [jumlah]` });
            if (!INVESTMENTS[kodeSaham]) return sock.sendMessage(from, { text: `❌ Kode saham tidak valid! Gunakan kode seperti BTC, ETH, dsb.` });
            if (!u.invest || (u.invest[kodeSaham] || 0) < amount) return sock.sendMessage(from, { text: `❌ Aset ${INVESTMENTS[kodeSaham].nama} milikmu tidak cukup!` });
            if (target === sender) return sock.sendMessage(from, { text: "❌ Tidak bisa transfer ke diri sendiri." });
            if (!db.users[target]) return sock.sendMessage(from, { text: "❌ Player tujuan tidak terdaftar di database." });
            
            u.invest[kodeSaham] -= amount;
            if (!db.users[target].invest) db.users[target].invest = {};
            db.users[target].invest[kodeSaham] = (db.users[target].invest[kodeSaham] || 0) + amount;
            saveDB(db);
            
            await sock.sendMessage(from, { text: `📈 *TRANSFER SAHAM BERHASIL*\nKamu memberikan ${amount} Unit ${INVESTMENTS[kodeSaham].nama} kepada @${target.split('@')[0]}`, mentions: [target] });
            break;
        }

        case 'investasi': case 'inv': {
            if (args[0] === 'reset' && db.global.owner_utama === sender) { db.market = {}; saveDB(db); return sock.sendMessage(from, { text: "✅ Bursa Efek direset!" }); }
            if (!db.market) db.market = {}; 
            let invT = `📊 [ BURSA EFEK NEXUS ] 📊\n=========================\n\n`; 
            let now = Date.now();
            let sortedInvestKeys = Object.keys(INVESTMENTS).sort((a, b) => INVESTMENTS[a].min - INVESTMENTS[b].min);
            
            sortedInvestKeys.forEach((key, index) => {
                let item = INVESTMENTS[key];
                if (!db.market[key]) db.market[key] = { price: item.min, next_update: now + item.updateTime, trend: '📈 Naik' }; 
                if (now >= db.market[key].next_update) {
                    let oldPrice = db.market[key].price; 
                    let range = Math.floor((item.max - item.min) / item.step);
                    let newPrice = item.min + (Math.floor(Math.random() * (range + 1)) * item.step);
                    db.market[key].price = newPrice; 
                    db.market[key].trend = (newPrice > oldPrice) ? '📈 Naik' : (newPrice < oldPrice) ? '📉 Turun' : '➡️ Stabil'; 
                    db.market[key].next_update = now + item.updateTime; 
                }
                let userAsset = u.invest[key] || 0;
                invT += `[ ${index + 1} ] ${item.icon} *${item.nama}*\n│ Harga: Rp ${db.market[key].price.toLocaleString()}\n│ Tren: ${db.market[key].trend}\n│ Asetmu: ${userAsset} Unit\n╰────────────────────────\n\n`;
            });
            saveDB(db); 
            invT += `Gunakan ${prefix}beli [angka_urutan] [jumlah/all] atau ${prefix}jual [angka_urutan] [jumlah/all]\nContoh: ${prefix}beli 5 all`;
            await sock.sendMessage(from, { text: invT }); 
            break;
        }

        case 'beli': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}beli [angka_urutan]` });
            let sortedInvestKeys = Object.keys(INVESTMENTS).sort((a, b) => INVESTMENTS[a].min - INVESTMENTS[b].min);
            let idxB = parseInt(args[0]) - 1; 
            let itemB = sortedInvestKeys[idxB]; 
            if (!itemB || !INVESTMENTS[itemB]) return sock.sendMessage(from, { text: "❌ Kode urutan investasi tidak valid. Gunakan angka 1-5." });
            
            if (!db.market) db.market = {}; 
            if (!db.market[itemB]) db.market[itemB] = { price: INVESTMENTS[itemB].min, next_update: Date.now() + INVESTMENTS[itemB].updateTime, trend: '📈 Naik' };
            
            let currentPriceB = db.market[itemB].price; 
            let qtyB_val;

            if (args[1]?.toLowerCase() === 'all') {
                qtyB_val = Math.floor(Number(u.uang) / currentPriceB);
                if (qtyB_val <= 0) return sock.sendMessage(from, { text: "❌ Uangmu tidak cukup untuk membeli 1 unit pun aset ini." });
            } else {
                qtyB_val = parseInt(args[1] || 1);
            }
            
            let priceB = currentPriceB * qtyB_val;
            if (Number(u.uang) < priceB) return sock.sendMessage(from, { text: `❌ Uang tidak cukup. Butuh Rp ${priceB.toLocaleString()}` });
            
            u.uang = Number(u.uang) - priceB; 
            if (!u.invest) u.invest = {};
            u.invest[itemB] = (u.invest[itemB] || 0) + qtyB_val; 
            saveDB(db);
            return sock.sendMessage(from, { text: `✅ Berhasil membeli ${qtyB_val} Unit ${INVESTMENTS[itemB].nama} seharga Rp ${priceB.toLocaleString()}` });
        }

        case 'jual': {
            if (!args[0]) return sock.sendMessage(from, { text: `❌ Format: ${prefix}jual [angka_urutan] [jumlah/all]` });
            let sortedInvestKeys = Object.keys(INVESTMENTS).sort((a, b) => INVESTMENTS[a].min - INVESTMENTS[b].min);
            let idxJ = parseInt(args[0]) - 1; 
            let itemJ = sortedInvestKeys[idxJ]; 
            
            if (!itemJ || !INVESTMENTS[itemJ]) return sock.sendMessage(from, { text: "❌ Kode urutan investasi tidak valid. Gunakan angka 1-5." });
            if (!u.invest) u.invest = {};

            let qtyJ_val;
            if (args[1]?.toLowerCase() === 'all') {
                qtyJ_val = u.invest[itemJ] || 0;
                if (qtyJ_val <= 0) return sock.sendMessage(from, { text: "❌ Kamu tidak memiliki aset ini untuk dijual." });
            } else {
                qtyJ_val = parseInt(args[1] || 1);
            }

            if ((u.invest[itemJ] || 0) < qtyJ_val) return sock.sendMessage(from, { text: "❌ Asetmu tidak cukup untuk dijual!" });
            
            if (!db.market) db.market = {}; 
            if (!db.market[itemJ]) db.market[itemJ] = { price: INVESTMENTS[itemJ].min, next_update: Date.now() + INVESTMENTS[itemJ].updateTime, trend: '📈 Naik' };
            
            let priceJ = db.market[itemJ].price * qtyJ_val;
            u.uang = Number(u.uang) + priceJ; 
            u.invest[itemJ] -= qtyJ_val; 
            saveDB(db);
            await sock.sendMessage(from, { text: `📉 *PENJUALAN SAHAM*\nBerhasil menjual ${qtyJ_val} Unit ${INVESTMENTS[itemJ].nama}.\n💵 Pendapatan: Rp ${priceJ.toLocaleString()}` }); 
            break;
        }

        case 'saran': case 'report': {
            let textReq = args.join(" ");
            if (!textReq) return sock.sendMessage(from, { text: `❌ Format: ${prefix}${cmd} [pesan yang ingin disampaikan]` });
            
            let reportId = Math.random().toString(36).substring(2, 8).toUpperCase();
            if (!db.global.reports) db.global.reports = {};
            db.global.reports[reportId] = sender; saveDB(db);

            let targetAdminGroup = db.global.acc_group || db.global.owner_utama;
            if (targetAdminGroup) {
                let msgAdmin = `📢 *TICKET ${cmd.toUpperCase()} BARU* 📢\n\n👤 *Pengirim:* ${u.name}\n📱 *Nomor:* @${sender.split('@')[0]}\n🎟️ *ID Tiket:* ${reportId}\n\n📝 *Pesan:*\n${textReq}\n\n_Balas dengan: ${prefix}balas ${reportId} [pesan]_`;
                await sock.sendMessage(targetAdminGroup, { text: msgAdmin, mentions: [sender] });
            }
            await sock.sendMessage(from, { text: `✅ *${cmd.toUpperCase()} TERKIRIM*\nTerima kasih! Pesanmu telah dikirim ke Admin.\n🎟️ *ID Tiket:* ${reportId}\n\n_Admin akan segera merespons dan membalas pesanmu nanti._` });
            break;
        }
    }
}

