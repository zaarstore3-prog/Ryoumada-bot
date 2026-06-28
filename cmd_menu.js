import { readDB, saveDB } from './database.js';

export async function handleMenu(sock, msg, from, sender, cmd, args, u, prefix) {
    switch(cmd) {
        case 'menu': case 'help': {
            let txtMenu = `╔════════════════════════╗\n` +
                          `║   🎮 RYOUMADA MENU 🎮  ║\n` +
                          `╚════════════════════════╝\n\n` +
                          `╔ 👤 [ PROFIL & INFO ]\n` +
                          `╠ ├ ${prefix}profil ➔ Cek statistik & Energi\n` +
                          `╠ ├ ${prefix}uang ➔ Cek saldo & XP\n` +
                          `╠ ├ ${prefix}setname ➔ Ubah nama\n` +
                          `╠ ├ ${prefix}setgender ➔ Ubah gender\n` +
                          `╠ ├ ${prefix}setstatus ➔ Ubah bio\n` +
                          `╠ ├ ${prefix}setlocation ➔ Ubah lokasi\n` +
                          `╠ ├ ${prefix}listbadge ➔ Cek koleksi badge\n` +
                          `╠ ├ ${prefix}setbadge ➔ Pasang badge\n` +
                          `╠ └ ${prefix}afk ➔ Mode AFK\n` +
                          `║\n` +
                          `╠ 💞 [ ASMARA & KELUARGA ]\n` +
                          `╠ ├ ${prefix}character ➔ Cari waifu/husbu\n` +
                          `╠ ├ ${prefix}lamar ➔ Lamar karakter\n` +
                          `╠ ├ ${prefix}pasangan ➔ Status Asmara\n` +
                          `╠ ├ ${prefix}setpfpasangan ➔ Ubah foto\n` +
                          `╠ ├ ${prefix}cerai ➔ Putuskan hubungan\n` +
                          `╠ ├ ${prefix}act ➔ Panel interaksi acak\n` +
                          `╠ ├ ${prefix}beriuang ➔ Beri uang saku\n` +
                          `╠ ├ ${prefix}namaianak ➔ Namai bayi lahir\n` +
                          `╠ └ ${prefix}listanak ➔ Cek daftar anak\n` +
                          `║\n` +
                          `╠ 💼 [ EKONOMI & RPG ]\n` +
                          `╠ ├ ${prefix}shop ➔ Toko Makanan, Alat, XP\n` +
                          `╠ ├ ${prefix}beliitem ➔ Beli barang di shop\n` +
                          `╠ ├ ${prefix}inventory / ${prefix}tas ➔ Cek tas itemmu\n` +
                          `╠ ├ ${prefix}makan / ${prefix}minum ➔ Konsumsi item (Isi energi)\n` +
                          `╠ ├ ${prefix}listkerja ➔ Bursa pekerjaan\n` +
                          `╠ ├ ${prefix}kerja ➔ Mulai shift kerja\n` +
                          `╠ ├ ${prefix}investasi ➔ Bursa saham/aset\n` +
                          `╠ ├ ${prefix}beli / ${prefix}jual ➔ Trading aset\n` +
                          `╠ ├ ${prefix}pinjol ➔ Pinjam uang (Atur waktu jatuh tempo)\n` +
                          `╠ ├ ${prefix}bayarpinjol ➔ Lunasi pinjaman online\n` +
                          `╠ ├ ${prefix}distrik ➔ Info kota saat ini\n` +
                          `╠ ├ ${prefix}pindah ➔ Ganti kota\n` +
                          `╠ ├ ${prefix}tf ➔ Transfer uang\n` +
                          `╠ ├ ${prefix}tfsaham ➔ Transfer aset saham\n` +
                          `╠ ├ ${prefix}crredeem ➔ Buat kode redeem dari uangmu\n` +
                          `╠ ├ ${prefix}redeem ➔ Tukar kode voucher\n` +
                          `╠ ├ ${prefix}donasi / ${prefix}donatur ➔ Info donasi\n` +
                          `╠ ├ ${prefix}listdonatur ➔ Cek donatur\n` +
                          `╠ ├ ${prefix}lbuang ➔ Top Global Uang\n` +
                          `╠ └ ${prefix}lblevel ➔ Top Global Level\n` +
                          `║\n` +
                          `╠ 🎣 [ MANCING & PASAR IKAN ]\n` +
                          `╠ ├ ${prefix}mancing ➔ Tangkap ikan\n` +
                          `╠ ├ ${prefix}pasarikan ➔ Cek harga pasar\n` +
                          `╠ ├ ${prefix}koleksi ➔ Cek tas ikanmu\n` +
                          `╠ ├ ${prefix}jualikan ➔ Jual ke NPC\n` +
                          `╠ ├ ${prefix}tawarikan ➔ Jual ke player\n` +
                          `╠ └ ${prefix}terimaikan ➔ Beli dari player\n` +
                          `║\n` +
                          `╠ 🎮 [ MINIGAMES & JUDI ]\n` +
                          `╠ ├ ${prefix}ryou100 ➔ Game Ryou 100\n` +
                          `╠ ├ ${prefix}tabakkata ➔ Game susun kata\n` +
                          `╠ ├ ${prefix}math ➔ Game matematika\n` +
                          `╠ ├ ${prefix}tebakkimia ➔ Game tabel periodik\n` +
                          `╠ ├ ${prefix}tictactoe ➔ Game TicTacToe\n` +
                          `╠ └ ${prefix}judi ➔ Taruhan Uang 50/50\n` +
                          `║\n` +
                          `╠ 🎵 [ MEDIA & ALAT ]\n` +
                          `╠ ├ ${prefix}play ➔ Putar lagu/YouTube\n` +
                          `╠ ├ ${prefix}ytmp4 ➔ Download YouTube Video\n` +
                          `╠ ├ ${prefix}ytmp3 ➔ Download YouTube Audio\n` +
                          `╠ ├ ${prefix}tiktok ➔ Download TikTok\n` +
                          `╠ ├ ${prefix}ig / ${prefix}instagram ➔ Download IG Video/Slide\n` +
                          `╠ ├ ${prefix}fb / ${prefix}facebook ➔ Download Facebook Video\n` +
                          `╠ ├ ${prefix}sticker ➔ Buat stiker\n` +
                          `╠ ├ ${prefix}hd ➔ Perhalus gambar (Upscale)\n` +
                          `╠ └ ${prefix}rvo ➔ Buka pesan sekali lihat\n` +
                          `║\n` +
                          `╠ 📮 [ SISTEM & REPORT ]\n` +
                          `╠ ├ ${prefix}infostaff ➔ Cek Daftar Staff\n` +
                          `╠ ├ ${prefix}saran ➔ Kirim ide/saran ke Dev\n` +
                          `╠ ├ ${prefix}report ➔ Lapor bug ke Dev\n` +
                          `╚ └ ${prefix}bantuan ➔ Panduan dasar bot`;
            
            await sock.sendMessage(from, { text: txtMenu });
            break;
        }
    }
}
