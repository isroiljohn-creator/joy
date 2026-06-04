export const listings = [
  { id: 1, price: "$72 000", priceNum: 72000, type: "3 xonali kvartira", cat: "Yangi uylar",
    addr: "Chilonzor 9-kvartal", rooms: 3, baths: 1, area: 78, floor: "5/9", top: true,
    photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
    owner: "Aziz Karimov", views: 842, saves: 64, status: "active" },
  { id: 2, price: "$54 000", priceNum: 54000, type: "2 xonali kvartira", cat: "Ikkilamchi",
    addr: "Yunusobod 12-kvartal", rooms: 2, baths: 1, area: 54, floor: "3/5", top: false,
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=75",
    owner: "Dilnoza Yusupova", views: 531, saves: 38, status: "active" },
  { id: 3, price: "$88 000", priceNum: 88000, type: "4 xonali kvartira", cat: "Yangi uylar",
    addr: "Mirzo Ulug'bek tumani", rooms: 4, baths: 2, area: 102, floor: "7/9", top: true,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=75",
    owner: "Sardor Toshmatov", views: 0, saves: 0, status: "pending" },
  { id: 4, price: "$61 000", priceNum: 61000, type: "2 xonali kvartira", cat: "Ikkilamchi",
    addr: "Sergeli 6-kvartal", rooms: 2, baths: 1, area: 58, floor: "2/4", top: false,
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=75",
    owner: "Aziz Karimov", views: 412, saves: 29, status: "active" },
  { id: 5, price: "$130 000", priceNum: 130000, type: "Hovli uy, 5 xona", cat: "Ikkilamchi",
    addr: "Qibray tumani", rooms: 5, baths: 2, area: 180, floor: "2 qavat", top: false,
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75",
    owner: "Aziz Karimov", views: 298, saves: 21, status: "active" },
  { id: 6, price: "$45 000", priceNum: 45000, type: "1 xonali kvartira", cat: "Ijara",
    addr: "Olmazor tumani", rooms: 1, baths: 1, area: 38, floor: "4/9", top: false,
    photo: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=75",
    owner: "Dilnoza Yusupova", views: 0, saves: 0, status: "pending" },
];

export const categories = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper", sub: "Novostroyka, JK", bg: "var(--orange-tint)", fg: "var(--orange-dark)" },
  { key: "Ikkilamchi", icon: "ti-home", sub: "Tayyor kvartiralar", bg: "var(--blue-tint)", fg: "var(--blue)" },
  { key: "Ijara", icon: "ti-key", sub: "Kunlik va oylik", bg: "var(--amber-tint)", fg: "var(--amber)" },
  { key: "Ofis", icon: "ti-briefcase", sub: "Biznes uchun", bg: "var(--purple-tint)", fg: "var(--purple)" },
];

export const pinPos = [[58,80],[200,200],[300,150],[120,320],[360,260],[80,420]];
