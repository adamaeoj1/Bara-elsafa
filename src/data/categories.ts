import { Category, PlayerColor, CustomCategory } from '../types/game';

export const PLAYER_COLORS: { hex: PlayerColor; labelAr: string; labelEn: string; name: string }[] = [
  { hex: '#B388FF', labelAr: 'بنفسجي', labelEn: 'Purple', name: 'purple' },
  { hex: '#6FD8F2', labelAr: 'سماوي', labelEn: 'Cyan', name: 'cyan' },
  { hex: '#FAD85D', labelAr: 'أصفر', labelEn: 'Yellow', name: 'yellow' },
  { hex: '#7CE38B', labelAr: 'أخضر', labelEn: 'Green', name: 'green' },
  { hex: '#FF80AB', labelAr: 'وردي', labelEn: 'Pink', name: 'pink' },
  { hex: '#FFAB73', labelAr: 'برتقالي', labelEn: 'Orange', name: 'orange' },
  { hex: '#D7B38C', labelAr: 'بني', labelEn: 'Brown', name: 'brown' },
];

export const CATEGORIES: Category[] = [
  // 1. Authentic Moroccan Food (Free) - 100% Culturally Pure
  {
    id: 'moroccan_food',
    nameAr: 'الأكل المغربي الأصيل',
    nameEn: 'Authentic Moroccan Food',
    name: 'الأكل المغربي الأصيل',
    isLocked: false,
    icon: '🥘',
    wordsAr: [
      'كسكس', 'طاجين', 'حريرة', 'بسطيلة', 'مسمن', 'بغرير', 'طنجية مراكشية', 'رفيسة',
      'شباكية', 'بريوات', 'زعلوك', 'سفنج', 'حرشة', 'سفة مدفونة', 'بيصارة', 'تقليّة',
      'كرعين', 'خبيزة (بقولة)', 'حوت مقلي', 'مشوي', 'كعب غزال', 'فقاص'
    ],
    wordsEn: [
      'Couscous', 'Tagine', 'Harira', 'Pastilla', 'Msemen', 'Baghrir', 'Tangia', 'Rfissa',
      'Chebakia', 'Briouat', 'Zaalouk', 'Sfenj', 'Harcha', 'Seffa Medfouna', 'Bissara', 'Tqalia',
      'Kouraine', 'Khobiza', 'Fried Sardines', 'Mechoui', 'Kaab Ghzal', 'Fekkas'
    ],
    words: [
      'كسكس', 'طاجين', 'حريرة', 'بسطيلة', 'مسمن', 'بغرير', 'طنجية مراكشية', 'رفيسة',
      'شباكية', 'بريوات', 'زعلوك', 'سفنج', 'حرشة', 'سفة مدفونة', 'بيصارة', 'تقليّة',
      'كرعين', 'خبيزة (بقولة)', 'حوت مقلي', 'مشوي', 'كعب غزال', 'فقاص'
    ],
  },

  // 2. Global & Fast Food (Free) - Pure International & Fast Food
  {
    id: 'global_fast_food',
    nameAr: 'مطاعم وأكلات عالمية',
    nameEn: 'Global & Fast Food',
    name: 'مطاعم وأكلات عالمية',
    isLocked: false,
    icon: '🍔',
    wordsAr: [
      'شاورما', 'بيتزا', 'برغر', 'سوشي', 'تاكو', 'باستا', 'لازانيا', 'ستيك',
      'شاورما عربي', 'فلافل', 'كبسة', 'مندي', 'ناتشوز', 'بطاطس مقلية', 'هوت دوغ', 'دونات',
      'وافل', 'كريب', 'بان كيك', 'آيس كريم', 'دجاج مقلي'
    ],
    wordsEn: [
      'Shawarma', 'Pizza', 'Burger', 'Sushi', 'Tacos', 'Pasta', 'Lasagna', 'Steak',
      'Arabic Shawarma', 'Falafel', 'Kabsa', 'Mandi', 'Nachos', 'French Fries', 'Hot Dog', 'Donuts',
      'Waffles', 'Crepe', 'Pancakes', 'Ice Cream', 'Fried Chicken'
    ],
    words: [
      'شاورما', 'بيتزا', 'برغر', 'سوشي', 'تاكو', 'باستا', 'لازانيا', 'ستيك',
      'شاورما عربي', 'فلافل', 'كبسة', 'مندي', 'ناتشوز', 'بطاطس مقلية', 'هوت دوغ', 'دونات',
      'وافل', 'كريب', 'بان كيك', 'آيس كريم', 'دجاج مقلي'
    ],
  },

  // 3. Moroccan Hangout & Vibes (Free)
  {
    id: 'moroccan_vibes',
    nameAr: 'الجلسة والدارجة المغربية',
    nameEn: 'Moroccan Hangout & Vibes',
    name: 'الجلسة والدارجة المغربية',
    isLocked: false,
    icon: '🫖',
    wordsAr: [
      'أتاي بالنعناع', 'البراد', 'صينية', 'كعب غزال', 'الفقاص', 'جلابة', 'طربوش', 'بلغة',
      'القفطان', 'الدربوكة', 'كناوة', 'الحمام المغربي', 'الصابون البلدي', 'السداري', 'الصالون المغربي', 'المجامر',
      'العود', 'الكارطة (رامي)', 'بارتشي', 'الباسبور', 'الحناء', 'زيت أركان'
    ],
    wordsEn: [
      'Moroccan Mint Tea', 'Teapot (Berrad)', 'Kaab Ghzal', 'Fekkas', 'Djellaba', 'Fez Hat (Tarbouch)', 'Babouche Shoes', 'Kaftan',
      'Darbuka Drum', 'Gnawa Music', 'Traditional Hammam', 'Beldi Soap', 'Moroccan Salon', 'Incense Burner', 'Playing Cards (Rami)', 'Parcheesi (Ludo)',
      'Henna', 'Argan Oil', 'Couscous Steamer', 'Carpet', 'Cushion', 'Handmade Tajine'
    ],
    words: [
      'أتاي بالنعناع', 'البراد', 'صينية', 'كعب غزال', 'الفقاص', 'جلابة', 'طربوش', 'بلغة',
      'القفطان', 'الدربوكة', 'كناوة', 'الحمام المغربي', 'الصابون البلدي', 'السداري', 'الصالون المغربي', 'المجامر',
      'العود', 'الكارطة (رامي)', 'بارتشي', 'الباسبور', 'الحناء', 'زيت أركان'
    ],
  },

  // 4. Morocco Cities & Spots (Free)
  {
    id: 'morocco_places',
    nameAr: 'مدن ومعالم المغرب',
    nameEn: 'Morocco Cities & Spots',
    name: 'مدن ومعالم المغرب',
    isLocked: false,
    icon: '📍',
    wordsAr: [
      'إفران', 'مراكش', 'كازابلانكا (الدار البيضاء)', 'الرباط', 'طنجة', 'فاس', 'شفشاون', 'أكادير',
      'الصويرة', 'جامع الفنا', 'مسجد الحسن الثاني', 'شلالات أوزود', 'مرزوكة', 'وليلي', 'عين فيتال', 'صخرة الأسد',
      'البراق (TGV)', 'قصبة الأوداية', 'باب بوجلود', 'مضايق تودغى', 'مغارة هرقل', 'جبل توبقال'
    ],
    wordsEn: [
      'Ifrane', 'Marrakech', 'Casablanca', 'Rabat', 'Tangier', 'Fes', 'Chefchaouen', 'Agadir',
      'Essaouira', 'Jemaa el-Fnaa', 'Hassan II Mosque', 'Ouzoud Falls', 'Merzouga Desert', 'Volubilis', 'Ain Vittel', 'Ifrane Lion Stone',
      'Al Boraq Bullet Train', 'Kasbah of the Udayas', 'Bab Boujloud', 'Todgha Gorges', 'Hercules Caves', 'Mount Toubkal'
    ],
    words: [
      'إفران', 'مراكش', 'كازابلانكا (الدار البيضاء)', 'الرباط', 'طنجة', 'فاس', 'شفشاون', 'أكادير',
      'الصويرة', 'جامع الفنا', 'مسجد الحسن الثاني', 'شلالات أوزود', 'مرزوكة', 'وليلي', 'عين فيتال', 'صخرة الأسد',
      'البراق (TGV)', 'قصبة الأوداية', 'باب بوجلود', 'مضايق تودغى', 'مغارة هرقل', 'جبل توبقال'
    ],
  },

  // 5. Uni Life & Tech (Free)
  {
    id: 'uni_tech',
    nameAr: 'حياة الجامعة والتقنية',
    nameEn: 'Uni Life & Tech',
    name: 'حياة الجامعة والتقنية',
    isLocked: false,
    icon: '💻',
    wordsAr: [
      'محاضرة', 'امتحان نهائي', 'السكن الجامعي (الحي)', 'كافيتريا', 'مشروع تخرج', 'غياب', 'منحة', 'لابتوب',
      'آيفون', 'شات جي بي تي', 'واي فاي', 'شاحن', 'سماعات', 'بايثون', 'ديسكورد', 'إنستغرام',
      'تيك توك', 'نتفلكس', 'نومه في الكلاس', 'قهوة الصباح', 'طابعة', 'كود برمجي'
    ],
    wordsEn: [
      'Morning Lecture', 'Final Exam', 'Dorm Room', 'Campus Cafeteria', 'Group Project', 'Attendance Sheet', 'Scholarship', 'Laptop',
      'iPhone', 'ChatGPT', 'Campus Wi-Fi', 'Charger', 'AirPods', 'Python Code', 'Discord', 'Instagram',
      'TikTok', 'Netflix', 'Sleeping in Class', 'Iced Coffee', 'Laser Printer', 'Bug Debugging'
    ],
    words: [
      'محاضرة', 'امتحان نهائي', 'السكن الجامعي (الحي)', 'كافيتريا', 'مشروع تخرج', 'غياب', 'منحة', 'لابتوب',
      'آيفون', 'شات جي بي تي', 'واي فاي', 'شاحن', 'سماعات', 'بايثون', 'ديسكورد', 'إنستغرام',
      'تيك توك', 'نتفلكس', 'نومه في الكلاس', 'قهوة الصباح', 'طابعة', 'كود برمجي'
    ],
  },

  // 6. Everyday Objects (Free)
  {
    id: 'daily_objects',
    nameAr: 'أشياء حولنا والبيت',
    nameEn: 'Everyday Objects',
    name: 'أشياء حولنا والبيت',
    isLocked: false,
    icon: '🏠',
    wordsAr: [
      'خلاط', 'مقلاة', 'ثلاجة', 'ميكروويف', 'غسالة', 'مكنسة', 'تلفزيون', 'ريموت',
      'مفتاح', 'نظارة', 'ساعة يد', 'عطر', 'مشط', 'مراية', 'وسادة', 'بطانية',
      'شمسية', 'حقيبة ظهر', 'محفظة', 'قلاية هوائية', 'مكواة', 'مصباح'
    ],
    wordsEn: [
      'Blender', 'Frying Pan', 'Refrigerator', 'Microwave', 'Washing Machine', 'Vacuum Cleaner', 'Television', 'Remote Control',
      'House Keys', 'Sunglasses', 'Wristwatch', 'Perfume', 'Hairbrush', 'Mirror', 'Pillow', 'Blanket',
      'Umbrella', 'Backpack', 'Wallet', 'Air Fryer', 'Steam Iron', 'Desk Lamp'
    ],
    words: [
      'خلاط', 'مقلاة', 'ثلاجة', 'ميكروويف', 'غسالة', 'مكنسة', 'تلفزيون', 'ريموت',
      'مفتاح', 'نظارة', 'ساعة يد', 'عطر', 'مشط', 'مراية', 'وسادة', 'بطانية',
      'شمسية', 'حقيبة ظهر', 'محفظة', 'قلاية هوائية', 'مكواة', 'مصباح'
    ],
  },

  // 7. Football & World Cup (VIP)
  {
    id: 'football',
    nameAr: 'كورة والمنتخب',
    nameEn: 'Football & World Cup',
    name: 'كورة والمنتخب',
    isLocked: true,
    icon: '⚽',
    wordsAr: [
      'المنتخب المغربي (أسود الأطلس)', 'أشرف حكيمي', 'ياسين بونو', 'إبراهيم دياز', 'حكيم زياش', 'وليد الركراكي', 'ريال مدريد', 'برشلونة',
      'دوري الأبطال', 'رونالدو', 'ميسي', 'مبابي', 'هالاند', 'فينيسيوس', 'كلاسيكو', 'ركلة جزاء',
      'تسلل', 'تقنية الفار', 'الكرة الذهبية', 'كأس العالم', 'الوداد البيضاوي', 'الرجاء البيضاوي'
    ],
    wordsEn: [
      'Atlas Lions (Morocco NT)', 'Achraf Hakimi', 'Yassine Bounou', 'Brahim Diaz', 'Hakim Ziyech', 'Walid Regragui', 'Real Madrid', 'FC Barcelona',
      'Champions League', 'Cristiano Ronaldo', 'Lionel Messi', 'Kylian Mbappé', 'Erling Haaland', 'Vinicius Jr', 'El Clasico', 'Penalty Kick',
      'Offside', 'VAR Referee', 'Ballon d\'Or', 'World Cup', 'Wydad AC', 'Raja CA'
    ],
    words: [
      'المنتخب المغربي (أسود الأطلس)', 'أشرف حكيمي', 'ياسين بونو', 'إبراهيم دياز', 'حكيم زياش', 'وليد الركراكي', 'ريال مدريد', 'برشلونة',
      'دوري الأبطال', 'رونالدو', 'ميسي', 'مبابي', 'هالاند', 'فينيسيوس', 'كلاسيكو', 'ركلة جزاء',
      'تسلل', 'تقنية الفار', 'الكرة الذهبية', 'كأس العالم', 'الوداد البيضاوي', 'الرجاء البيضاوي'
    ],
  },

  // 8. Video Games (VIP)
  {
    id: 'gaming',
    nameAr: 'ألعاب فيديو',
    nameEn: 'Video Games',
    name: 'ألعاب فيديو',
    isLocked: true,
    icon: '🎮',
    wordsAr: [
      'فيفا (FC)', 'قراند (GTA)', 'ماينكرافت', 'روبلوكس', 'فورتنايت', 'فالورانت', 'كول أوف ديوتي', 'ليغ أوف ليجيندز',
      'ذا لاست أوف أس', 'ريد ديد', 'ببجي', 'ماريو كارت', 'كراش', 'زيلدا', 'إلدن رينغ', 'سوني بلايستيشن',
      'ستيم', 'ديسكورد', 'تيتريس', 'أمونق أس', 'نينتندو سويتش', 'إكس بوكس'
    ],
    wordsEn: [
      'EA FC (FIFA)', 'GTA V', 'Minecraft', 'Roblox', 'Fortnite', 'Valorant', 'Call of Duty', 'League of Legends',
      'The Last of Us', 'Red Dead Redemption', 'PUBG', 'Mario Kart', 'Crash Bandicoot', 'Zelda', 'Elden Ring', 'PlayStation 5',
      'Steam', 'Discord', 'Tetris', 'Among Us', 'Nintendo Switch', 'Xbox Series X'
    ],
    words: [
      'فيفا (FC)', 'قراند (GTA)', 'ماينكرافت', 'روبلوكس', 'فورتنايت', 'فالورانت', 'كول أوف ديوتي', 'ليغ أوف ليجيندز',
      'ذا لاست أوف أس', 'ريد ديد', 'ببجي', 'ماريو كارت', 'كراش', 'زيلدا', 'إلدن رينغ', 'سوني بلايستيشن',
      'ستيم', 'ديسكورد', 'تيتريس', 'أمونق أس', 'نينتندو سويتش', 'إكس بوكس'
    ],
  },

  // 9. Anime & Manga (VIP)
  {
    id: 'anime',
    nameAr: 'أنمي ومانجا',
    nameEn: 'Anime & Manga',
    name: 'أنمي ومانجا',
    isLocked: true,
    icon: '⚔️',
    wordsAr: [
      'ون بيس', 'ناروتو', 'هجوم العمالقة', 'قاتل الشياطين', 'دراغون بول', 'لوفي', 'زورو', 'غوكو',
      'كونان', 'جوجوتسو كايسن', 'ديث نوت', 'إيتاتشي', 'فيري تيل', 'بليتش', 'كينغدوم', 'سوكونا',
      'ليفاي', 'سولو ليفلينغ', 'سبيستون', 'هايكيو', 'هنتر إكس هنتر', 'طوكيو غول'
    ],
    wordsEn: [
      'One Piece', 'Naruto', 'Attack on Titan', 'Demon Slayer', 'Dragon Ball', 'Luffy', 'Zoro', 'Goku',
      'Detective Conan', 'Jujutsu Kaisen', 'Death Note', 'Itachi', 'Fairy Tail', 'Bleach', 'Kingdom', 'Sukuna',
      'Levi Ackerman', 'Solo Leveling', 'Spacetoon', 'Haikyuu', 'Hunter x Hunter', 'Tokyo Ghoul'
    ],
    words: [
      'ون بيس', 'ناروتو', 'هجوم العمالقة', 'قاتل الشياطين', 'دراغون بول', 'لوفي', 'زورو', 'غوكو',
      'كونان', 'جوجوتسو كايسن', 'ديث نوت', 'إيتاتشي', 'فيري تيل', 'بليتش', 'كينغدوم', 'سوكونا',
      'ليفاي', 'سولو ليفلينغ', 'سبيستون', 'هايكيو', 'هنتر إكس هنتر', 'طوكيو غول'
    ],
  },

  // 10. Movies & Cinema (VIP)
  {
    id: 'movies',
    nameAr: 'مسلسلات وأفلام',
    nameEn: 'Movies & Cinema',
    name: 'مسلسلات وأفلام',
    isLocked: true,
    icon: '🍿',
    wordsAr: [
      'بريكنق باد', 'صراع العروش', 'بيكي بلايندرز', 'هاري بوتر', 'سبايدرمان', 'باتمان', 'الجوكر', 'سيد الخواتم',
      'إنترستيلار', 'إنسبشن', 'تايتانيك', 'لا كاسا دي بابيل', 'فريندز', 'سترينجر ثينقز', 'مستر بين', 'سكواد جيم',
      'أوسكار', 'مارفل', 'هوليوود', 'نتفلكس', 'أوبنهايمر', 'جلاديتور'
    ],
    wordsEn: [
      'Breaking Bad', 'Game of Thrones', 'Peaky Blinders', 'Harry Potter', 'Spider-Man', 'Batman', 'The Joker', 'Lord of the Rings',
      'Interstellar', 'Inception', 'Titanic', 'Money Heist', 'Friends', 'Stranger Things', 'Mr. Bean', 'Squid Game',
      'Oscars', 'Marvel Studios', 'Hollywood', 'Netflix', 'Oppenheimer', 'Gladiator'
    ],
    words: [
      'بريكنق باد', 'صراع العروش', 'بيكي بلايندرز', 'هاري بوتر', 'سبايدرمان', 'باتمان', 'الجوكر', 'سيد الخواتم',
      'إنترستيلار', 'إنسبشن', 'تايتانيك', 'لا كاسا دي بابيل', 'فريندز', 'سترينجر ثينقز', 'مستر بين', 'سكواد جيم',
      'أوسكار', 'مارفل', 'هوليوود', 'نتفلكس', 'أوبنهايمر', 'جلاديتور'
    ],
  },

  // 11. Travel & World (VIP)
  {
    id: 'travel',
    nameAr: 'دول وسياحة',
    nameEn: 'Travel & World',
    name: 'دول وسياحة',
    isLocked: true,
    icon: '✈️',
    wordsAr: [
      'اليابان', 'فرنسا', 'إسبانيا', 'تركيا', 'إيطاليا', 'السعودية', 'الإمارات', 'إنجلترا',
      'أمريكا', 'مصر', 'سويسرا', 'تايلاند', 'المالديف', 'باريس', 'لندن', 'طوكيو',
      'إسطنبول', 'دبي', 'نيويورك', 'روما', 'برشلونة', 'أمستردام'
    ],
    wordsEn: [
      'Japan', 'France', 'Spain', 'Turkey', 'Italy', 'Saudi Arabia', 'UAE', 'England',
      'USA', 'Egypt', 'Switzerland', 'Thailand', 'Maldives', 'Paris', 'London', 'Tokyo',
      'Istanbul', 'Dubai', 'New York', 'Rome', 'Barcelona', 'Amsterdam'
    ],
    words: [
      'اليابان', 'فرنسا', 'إسبانيا', 'تركيا', 'إيطاليا', 'السعودية', 'الإمارات', 'إنجلترا',
      'أمريكا', 'مصر', 'سويسرا', 'تايلاند', 'المالديف', 'باريس', 'لندن', 'طوكيو',
      'إسطنبول', 'دبي', 'نيويورك', 'روما', 'برشلونة', 'أمستردام'
    ],
  },

  // 12. Cars & Supercars (VIP)
  {
    id: 'cars',
    nameAr: 'سيارات وسرعة',
    nameEn: 'Cars & Supercars',
    name: 'سيارات وسرعة',
    isLocked: true,
    icon: '🏎️',
    wordsAr: [
      'مرسيدس', 'بي إم دبليو', 'بورش', 'فيراري', 'لامبورغيني', 'لاندكروزر', 'رنج روفر', 'نيسان باترول',
      'أودي', 'تويوتا', 'تسلا', 'ماكلارين', 'موستانج', 'رولز رويس', 'بوقاتي', 'بيك أب (ديباناج)',
      'كاميرا ساهر', 'رادار', 'رالي داكار', 'تفحيط', 'فورد رابتر', 'جيب رانجلر'
    ],
    wordsEn: [
      'Mercedes-Benz', 'BMW', 'Porsche', 'Ferrari', 'Lamborghini', 'Land Cruiser', 'Range Rover', 'Nissan Patrol',
      'Audi', 'Toyota', 'Tesla', 'McLaren', 'Mustang', 'Rolls-Royce', 'Bugatti', 'Tow Truck',
      'Speed Camera', 'Radar Detector', 'Dakar Rally', 'Drifting', 'Ford Raptor', 'Jeep Wrangler'
    ],
    words: [
      'مرسيدس', 'بي إم دبليو', 'بورش', 'فيراري', 'لامبورغيني', 'لاندكروزر', 'رنج روفر', 'نيسان باترول',
      'أودي', 'تويوتا', 'تسلا', 'ماكلارين', 'موستانج', 'رولز رويس', 'بوقاتي', 'بيك أب (ديباناج)',
      'كاميرا ساهر', 'رادار', 'رالي داكار', 'تفحيط', 'فورد رابتر', 'جيب رانجلر'
    ],
  },

  // 13. Custom Topic (VIP)
  {
    id: 'custom',
    nameAr: 'فئة مخصصة',
    nameEn: 'Custom Topic',
    name: 'فئة مخصصة',
    isLocked: true,
    icon: '✍️',
    wordsAr: [
      'كلمة 1', 'كلمة 2', 'كلمة 3', 'كلمة 4', 'كلمة 5', 'كلمة 6', 'كلمة 7', 'كلمة 8'
    ],
    wordsEn: [
      'Word 1', 'Word 2', 'Word 3', 'Word 4', 'Word 5', 'Word 6', 'Word 7', 'Word 8'
    ],
    words: [
      'كلمة 1', 'كلمة 2', 'كلمة 3', 'كلمة 4', 'كلمة 5', 'كلمة 6', 'كلمة 7', 'كلمة 8'
    ],
  },
];

export const DEFAULT_CATEGORY_ID = 'moroccan_food';

export function getCategoriesWithLockStatus(
  isPremiumRoom: boolean,
  customCategory?: CustomCategory,
  lang: 'ar' | 'en' = 'ar'
): Category[] {
  return CATEGORIES.map((cat) => {
    const isCustom = cat.id === 'custom';
    const unlocked = isPremiumRoom ? false : cat.isLocked;

    let localizedName = lang === 'en' ? cat.nameEn : cat.nameAr;
    let localizedWords = lang === 'en' ? [...cat.wordsEn] : [...cat.wordsAr];

    if (isCustom && customCategory && (customCategory.name || customCategory.title)) {
      const customTitle = customCategory.name || customCategory.title || (lang === 'en' ? 'Custom Topic' : 'فئة مخصصة');
      localizedName = customTitle;
      if (customCategory.words && customCategory.words.length >= 8) {
        localizedWords = customCategory.words;
      }
    }

    return {
      ...cat,
      isLocked: unlocked,
      name: localizedName,
      words: localizedWords,
    };
  });
}
