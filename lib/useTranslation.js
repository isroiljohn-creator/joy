import { useState, useEffect } from "react";

const translations = {
  uz: {
    // Nav & General
    "home": "Bosh sahifa",
    "listings": "E'lonlar",
    "saved": "Saqlanganlar",
    "messages": "Xabarlar",
    "profile": "Profil",
    "login": "Kirish",
    "logout": "Chiqish",
    "add_listing": "E'lon qo'shish",
    "search_placeholder": "Hudud, tuman yoki manzil bo'yicha qidiring...",
    "admin_panel": "Admin Panel",
    // Settings Tab
    "settings": "Sozlamalar",
    "edit_profile": "Sozlamalarni tahrirlash",
    "change_password": "Parolni o'zgartirish",
    "user_name": "Foydalanuvchi ismi",
    "phone_number": "Telefon raqami",
    "save": "Saqlash",
    "saving": "Saqlanmoqda...",
    "success_save": "Sozlamalar muvaffaqiyatli saqlandi! Sahifa yangilanmoqda...",
    "old_password": "Eski parol",
    "new_password": "Yangi parol",
    "confirm_password": "Parolni tasdiqlash",
    "password_placeholder": "Kamida 6 ta belgi",
    "confirm_password_placeholder": "Yangi parolni qayta kiriting",
    "success_pw": "Parol muvaffaqiyatli o'zgartirildi!",
    "logout_confirm": "Tizimdan chiqishni xohlaysizmi?",
    // Language & Theme Settings
    "language": "Loyiha tili",
    "theme": "Mavzu (Tungi/Kunduzgi)",
    "select_lang": "Tilni tanlang",
    "light_mode": "Kunduzgi",
    "dark_mode": "Tungi",
    // Homepage
    "hero_title": "Joyingizni Joydan toping",
    "hero_subtitle": "Uy sotib oling, ijaraga oling yoki ofis tanlang — xaritada qidiring, ko'ring va bog'laning",
    "buy": "Sotib olish",
    "rent": "Ijara",
    "office": "Ofis",
    "novostroyka": "Novostroyka",
    "why_joy": "Nega aynan Joy?",
    "why_subtitle": "Uy izlash hech qachon bunchalik oson bo'lmagan",
    // Features block on homepage
    "feat_map_title": "Xaritada qidiruv",
    "feat_map_desc": "Uylarni xaritada ko'ring — metro, maktab va infratuzilmaga yaqinligini bir qarashda biling.",
    "feat_trust_title": "Ishonchli e'lonlar",
    "feat_trust_desc": "Har bir e'lon va egasi tasdiqlanadi. Soxta e'lonlarsiz, faqat haqiqiy takliflar.",
    "feat_contact_title": "To'g'ridan-to'g'ri aloqa",
    "feat_contact_desc": "Vositachisiz, to'g'ridan-to'g'ri sotuvchi yoki ijaraga beruvchi bilan bog'laning.",
    // CTA block
    "cta_title": "Uyingizni soting yoki ijaraga bering",
    "cta_subtitle": "Bepul e'lon joylang — minglab xaridorlar sizni topadi",
    // Listing details
    "description": "Tavsif",
    "features": "Xususiyatlar",
    "mortgage": "Ipoteka",
    "mortgage_calc": "Ipoteka hisobi",
    "mortgage_none": "Bu uyga ipoteka mavjud emas",
    "no_mortgage": "Mavjud emas",
    "down_payment": "Boshlang'ich to'lov",
    "term": "Muddat",
    "rate": "Foiz stavkasi",
    "years": "yil",
    "avg_market": "Bozor narxiga nisbatan",
    "owner": "Egasi",
    "listings_count": "ta e'lon",
    "view_on_map": "Xaritada ko'rish",
    "similar_listings": "O'xshash e'lonlar",
    "premium_btn": "Premium sotib olish",
    // Mobile Nav & tabs
    "favorites": "Saqlangan",
    "chat": "Suhbat",
    "add": "Qo'shish",
    "map_nav": "Xarita",
    // Profile extra
    "member_since": "yildan beri",
    "user_rating": "Foydalanuvchi reytingi",
    "listings_my": "Mening e'lonlarim",
    "inbox_msg": "Kelgan xabarlar"
  },
  ru: {
    // Nav & General
    "home": "Главная",
    "listings": "Объявления",
    "saved": "Избранное",
    "messages": "Сообщения",
    "profile": "Профиль",
    "login": "Войти",
    "logout": "Выйти",
    "add_listing": "Подать объявление",
    "search_placeholder": "Ищите по региону, району или адресу...",
    "admin_panel": "Админ Панель",
    // Settings Tab
    "settings": "Настройки",
    "edit_profile": "Редактировать профиль",
    "change_password": "Сменить пароль",
    "user_name": "Имя пользователя",
    "phone_number": "Номер телефона",
    "save": "Сохранить",
    "saving": "Сохраняется...",
    "success_save": "Настройки успешно сохранены! Страница перезагружается...",
    "old_password": "Старый пароль",
    "new_password": "Новый пароль",
    "confirm_password": "Подтвердите пароль",
    "password_placeholder": "Минимум 6 символов",
    "confirm_password_placeholder": "Введите новый пароль еще раз",
    "success_pw": "Пароль успешно изменен!",
    "logout_confirm": "Вы действительно хотите выйти?",
    // Language & Theme Settings
    "language": "Язык проекта",
    "theme": "Тема (Дневная/Ночная)",
    "select_lang": "Выберите язык",
    "light_mode": "Светлая",
    "dark_mode": "Темная",
    // Homepage
    "hero_title": "Найдите своё место на Joy",
    "hero_subtitle": "Покупайте, арендуйте недвижимость или выбирайте офис — ищите на карте, просматривайте и связывайтесь",
    "buy": "Купить",
    "rent": "Аренда",
    "office": "Офис",
    "novostroyka": "Новостройка",
    "why_joy": "Почему именно Joy?",
    "why_subtitle": "Поиск жилья еще никогда не был таким простым",
    // Features block on homepage
    "feat_map_title": "Поиск на карте",
    "feat_map_desc": "Смотрите дома на карте — узнайте о близости к метро, школам и инфраструктуре с первого взгляда.",
    "feat_trust_title": "Надежные объявления",
    "feat_trust_desc": "Каждое объявление и владелец проверяются. Без фейков, только реальные предложения.",
    "feat_contact_title": "Прямая связь",
    "feat_contact_desc": "Связывайтесь напрямую с продавцом или арендодателем без посредников.",
    // CTA block
    "cta_title": "Продайте или сдайте свое жилье",
    "cta_subtitle": "Подайте объявление бесплатно — тысячи покупателей найдут вас",
    // Listing details
    "description": "Описание",
    "features": "Удобства",
    "mortgage": "Ипотека",
    "mortgage_calc": "Расчет ипотеки",
    "mortgage_none": "Ипотека для этого жилья недоступна",
    "no_mortgage": "Недоступно",
    "down_payment": "Первоначальный взнос",
    "term": "Срок",
    "rate": "Процентная ставка",
    "years": "лет",
    "avg_market": "Сравнение с рыночной ценой",
    "owner": "Владелец",
    "listings_count": "объявлений",
    "view_on_map": "Посмотреть на карте",
    "similar_listings": "Похожие объявления",
    "premium_btn": "Купить Premium",
    // Mobile Nav & tabs
    "favorites": "Избранное",
    "chat": "Чат",
    "add": "Добавить",
    "map_nav": "Карта",
    // Profile extra
    "member_since": "года на сайте",
    "user_rating": "Рейтинг пользователя",
    "listings_my": "Мои объявления",
    "inbox_msg": "Полученные сообщения"
  },
  en: {
    // Nav & General
    "home": "Home",
    "listings": "Listings",
    "saved": "Saved",
    "messages": "Messages",
    "profile": "Profile",
    "login": "Login",
    "logout": "Logout",
    "add_listing": "Add Listing",
    "search_placeholder": "Search by region, district or address...",
    "admin_panel": "Admin Panel",
    // Settings Tab
    "settings": "Settings",
    "edit_profile": "Edit Profile",
    "change_password": "Change Password",
    "user_name": "Username",
    "phone_number": "Phone Number",
    "save": "Save",
    "saving": "Saving...",
    "success_save": "Settings successfully saved! Reloading...",
    "old_password": "Old Password",
    "new_password": "New Password",
    "confirm_password": "Confirm Password",
    "password_placeholder": "At least 6 characters",
    "confirm_password_placeholder": "Re-enter new password",
    "success_pw": "Password successfully changed!",
    "logout_confirm": "Are you sure you want to logout?",
    // Language & Theme Settings
    "language": "App Language",
    "theme": "Theme (Dark/Light)",
    "select_lang": "Select language",
    "light_mode": "Light",
    "dark_mode": "Dark",
    // Homepage
    "hero_title": "Find your place on Joy",
    "hero_subtitle": "Buy, rent homes or select offices — search on map, view and connect",
    "buy": "Buy",
    "rent": "Rent",
    "office": "Office",
    "novostroyka": "New Building",
    "why_joy": "Why Joy?",
    "why_subtitle": "Searching for a home has never been this easy",
    // Features block on homepage
    "feat_map_title": "Search on Map",
    "feat_map_desc": "View homes on the map — know the proximity to subway, school, and infrastructure at a glance.",
    "feat_trust_title": "Trusted Listings",
    "feat_trust_desc": "Each listing and owner is verified. No fake ads, only real offers.",
    "feat_contact_title": "Direct Contact",
    "feat_contact_desc": "Connect directly with the seller or landlord without middlemen.",
    // CTA block
    "cta_title": "Sell or Rent Your Home",
    "cta_subtitle": "Post a free ad — thousands of buyers will find you",
    // Listing details
    "description": "Description",
    "features": "Features",
    "mortgage": "Mortgage",
    "mortgage_calc": "Mortgage Calculator",
    "mortgage_none": "Mortgage is not available for this property",
    "no_mortgage": "Not Available",
    "down_payment": "Down Payment",
    "term": "Term",
    "rate": "Interest Rate",
    "years": "years",
    "avg_market": "Compared to Market Price",
    "owner": "Owner",
    "listings_count": "listings",
    "view_on_map": "View on Map",
    "similar_listings": "Similar Listings",
    "premium_btn": "Buy Premium",
    // Mobile Nav & tabs
    "favorites": "Saved",
    "chat": "Chat",
    "add": "Add",
    "map_nav": "Map",
    // Profile extra
    "member_since": "member since",
    "user_rating": "User rating",
    "listings_my": "My listings",
    "inbox_msg": "Received messages"
  }
};

let currentLang = "uz";
const listeners = new Set();

if (typeof window !== "undefined") {
  currentLang = localStorage.getItem("joy-lang") || "uz";
}

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (lang !== currentLang) {
    currentLang = lang;
    if (typeof window !== "undefined") {
      localStorage.setItem("joy-lang", lang);
    }
    listeners.forEach((l) => l(lang));
    // Dispatch custom event for vanilla JS or components outside React tree
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("joy-lang-change", { detail: lang }));
    }
  }
}

export function useTranslation() {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    const handleLangChange = (newLang) => {
      setLangState(newLang);
    };
    listeners.add(handleLangChange);
    
    // Support language change via custom event as well
    const handleEvent = (e) => {
      setLangState(e.detail);
    };
    window.addEventListener("joy-lang-change", handleEvent);

    return () => {
      listeners.delete(handleLangChange);
      window.removeEventListener("joy-lang-change", handleEvent);
    };
  }, []);

  const t = (key) => {
    return translations[lang]?.[key] || translations["uz"]?.[key] || key;
  };

  return { t, lang, setLanguage };
}
