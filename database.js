import fs from 'fs';

export const initDB = () => {
    if (!fs.existsSync('./database.json')) fs.writeFileSync('./database.json', JSON.stringify({ users: {}, market: {}, global: { antispam: false, klaim_pasangan: {}, pending_acc: {}, redeem_codes: {}, owner_utama: null, donatur: {}, acc_group: "", last_uid: 100000, whitelist_karakter: [] } }));
    if (!fs.existsSync('./media')) fs.mkdirSync('./media');
};
export const readDB = () => JSON.parse(fs.readFileSync('./database.json'));
export const saveDB = (data) => fs.writeFileSync('./database.json', JSON.stringify(data, null, 2));

export const INVESTMENTS = {
    'BTC': { nama: 'Bitcoin (BTC)', icon: '🪙', min: 550000000, max: 2000000000, step: 1000000, updateTime: 3600000 },
    'ETH': { nama: 'Ethereum (ETH)', icon: '💎', min: 40000000, max: 50000000, step: 1000000, updateTime: 1800000 },
    'SOL': { nama: 'Solana (SOL)', icon: '🚀', min: 20000000, max: 50000000, step: 1000000, updateTime: 900000 },
    'GLD': { nama: 'Emas Antam (GLD)', icon: '🥇', min: 1000000, max: 20000000, step: 100000, updateTime: 300000 },
    'WEEB': { nama: 'Saham Anime (WEEB)', icon: '🌸', min: 10000, max: 900000, step: 1000, updateTime: 60000 }
};

export const DISTRIK = {
    'Awal': { pajak: 1000, transport: 500, bonus: 0, resiko: 0, denda: 0, ongkos_pindah: 0, desc: 'Aman dan damai. Bebas risiko razia.' },
    'Shibuya': { pajak: 3000, transport: 2000, bonus: 0.20, resiko: 0.10, denda: 0.05, ongkos_pindah: 25000, desc: 'Gaji +20%. Risiko razia 10%.' },
    'Akihabara': { pajak: 5000, transport: 3000, bonus: 0.40, resiko: 0.20, denda: 0.10, ongkos_pindah: 75000, desc: 'Gaji +40%. Risiko denda 20%.' },
    'Ginza': { pajak: 10000, transport: 5000, bonus: 0.60, resiko: 0.30, denda: 0.15, ongkos_pindah: 200000, desc: 'Gaji +60%. Risiko Yakuza 30%.' }
};

export const JOBS = {
    'pembersih': { nama: 'Pembersih', gaji: 5000, minLvl: 1, ilegal: false, icon: '🧹' },
    'ojek': { nama: 'Ojek', gaji: 15000, minLvl: 3, ilegal: false, icon: '🛵' },
    'sales': { nama: 'Sales', gaji: 30000, minLvl: 10, ilegal: false, icon: '👔' },
    'atmin': { nama: 'Atmin Judi', gaji: 500000, minLvl: 20, ilegal: true, icon: '💻' },
    'teller': { nama: 'Teller Bank', gaji: 2000000, minLvl: 45, ilegal: false, icon: '🏦' },
    'rampok': { nama: 'Rampok Bank', gaji: 10000000, minLvl: 60, ilegal: true, icon: '🦹' },
    'hacker': { nama: 'Hacker', gaji: 5000000, minLvl: 70, ilegal: true, icon: '🕵️' },
    'cyber': { nama: 'Cyber Security', gaji: 10000000, minLvl: 110, ilegal: false, icon: '🛡️' }
};

export const menuUtama = (u, prefix) => {
    return `╔════════════════════════╗\n║ ✨ RYOUMADA MENU ✨ ║\n╚════════════════════════╝\n\n` +
           `👤 *[ PROFIL & INFO ]*\n├ ${prefix}profil [@tag/reply], ${prefix}uang\n├ ${prefix}setname, ${prefix}setgender\n├ ${prefix}setstatus, ${prefix}setlocation\n└ ${prefix}listbadge, ${prefix}setbadge, ${prefix}afk\n\n` +
           `💼 *[ RPG & EKONOMI ]*\n├ ${prefix}kerja [Code], ${prefix}listkerja\n├ ${prefix}investasi, ${prefix}beli, ${prefix}jual\n├ ${prefix}shop, ${prefix}redeem, ${prefix}donasi\n├ ${prefix}donatur, ${prefix}listdonatur\n└ ${prefix}distrik, ${prefix}lbuang, ${prefix}lblevel\n\n` +
           `🎮 *[ MINIGAMES ]*\n└ ${prefix}tebakkata, ${prefix}ryou100, ${prefix}math, ${prefix}tebakkimia\n\n` +
           `💞 *[ ASMARA ]*\n├ ${prefix}character [ID/Nama], ${prefix}lamar [ID/Nama]\n├ ${prefix}pasangan, ${prefix}setpfpasangan, ${prefix}cerai\n└ ${prefix}namaianak, ${prefix}listanak\n\n` +
           `🎥 *[ MEDIA ]*\n├ ${prefix}play [Judul/Link YT]\n└ ${prefix}rvo (reply), ${prefix}tiktok, ${prefix}sticker\n\n` +
           `🛠️ *[ BANTUAN ]*\n└ ${prefix}report [Pesan], ${prefix}saran [Saran]\n\n` +
           `_Ketik ${prefix}menuadmin untuk fitur Owner_`;
};

export const menuAdmin = (prefix) => {
    return `👑 *[ MENU ADMIN & OWNER ]* 👑\n\n` +
           `⚙️ *SISTEM & KEAMANAN*\n` +
           `├ ${prefix}antispam [on/off]\n` +
           `│ _(Mengunci bot otomatis jika ada yang spam)_\n` +
           `├ ${prefix}claimowner\n` +
           `│ _(Klaim kekuasaan mutlak Owner Utama)_\n` +
           `├ ${prefix}setaccgroup\n` +
           `│ _(Tetapkan grup ini sbg pusat ACC foto/report)_\n` +
           `└ ${prefix}resetglobal\n` +
           `  _(Wipe out seluruh uang, level & exp player)_\n\n` +
           `👥 *MANAJEMEN PLAYER*\n` +
           `├ ${prefix}addprem / ${prefix}delprem [@tag/reply]\n` +
           `│ _(Berikan limit Unlimited/VIP ke player)_\n` +
           `├ ${prefix}ban [@tag/reply] [10s/5m/2h/1d/1y] [Alasan]\n` +
           `│ _(Blokir player dg format waktu: s/m/h/d/y)_\n` +
           `├ ${prefix}unban [@tag/reply]\n` +
           `│ _(Membuka blokir larangan bermain)_\n` +
           `├ ${prefix}setdata [me/@tag] [uang/xp/level/role/afk] [nilai]\n` +
           `│ _(Menimpa data mutlak. Cth afk: 99y, role: owner)_\n` +
           `├ ${prefix}add [me/@tag] [uang/xp/level/pts/inv_kode] [jml]\n` +
           `│ _(Menambahkan data. Cth inv_kode: btc 10)_\n` +
           `├ ${prefix}delbadge [@tag/reply] [urutan angka]\n` +
           `└ ${prefix}adddonate [@tag/reply] [jumlah]\n\n` +
           `🎁 *REDEEM & ASMARA*\n` +
           `├ ${prefix}buatredeem [uang=100|xp=50|limit=10]\n` +
           `├ ${prefix}whitelistchar / ${prefix}delwhitelistchar [ID]\n` +
           `├ ${prefix}cekwhitelistchar / ${prefix}cekblacklist [@tag/me]\n` +
           `├ ${prefix}delblacklist [@tag/me] [ID Karakter]\n` +
           `├ ${prefix}acc pf [Kode Unik]\n` +
           `└ ${prefix}tolak pf [Kode Unik] [Alasan]`;
};

