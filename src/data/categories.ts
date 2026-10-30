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
  // 1. Food & Dishes (Free)
  {
    id: 'food',
    nameAr: 'أكلات',
    nameEn: 'Food & Dishes',
    name: 'أكلات',
    isLocked: false,
    icon: '🍔',
    wordsAr: [
      'كبسة', 'شاورما', 'برغر', 'بيتزا', 'باستا', 'مشاوي', 'تميس', 'ناتشوز',
      'مندي', 'فلافل', 'سوشي', 'باشميل', 'كشري', 'مسخن', 'مقلوبة', 'سمبوسة',
      'كنافة', 'لقيمات', 'برياني', 'تاكو', 'ورق عنب', 'حمص', 'شيش طاووق'
    ],
    wordsEn: [
      'Burger', 'Pizza', 'Shawarma', 'Pasta', 'Sushi', 'Tacos', 'Nachos', 'Steak',
      'Biryani', 'Falafel', 'Fried Chicken', 'Lasagna', 'Pancake', 'Waffles', 'Donut',
      'Ice Cream', 'Salad', 'Barbecue', 'Cheesecake', 'Noodles', 'Sandwich', 'Crepe'
    ],
    words: [
      'كبسة', 'شاورما', 'برغر', 'بيتزا', 'باستا', 'مشاوي', 'تميس', 'ناتشوز',
      'مندي', 'فلافل', 'سوشي', 'باشميل', 'كشري', 'مسخن', 'مقلوبة', 'سمبوسة',
      'كنافة', 'لقيمات', 'برياني', 'تاكو', 'ورق عنب', 'حمص', 'شيش طاووق'
    ],
  },

  // 2. Majlis & Hangout (Free)
  {
    id: 'majlis',
    nameAr: 'المجلس والحياة اليومية',
    nameEn: 'Home & Hangout',
    name: 'المجلس والحياة اليومية',
    isLocked: false,
    icon: '☕',
    wordsAr: [
      'دلة', 'فنجال', 'تمر', 'بلوت', 'مبخرة', 'مسند', 'زولية', 'عود',
      'سبحة', 'بشت', 'شبة نار', 'صينية', 'ترامس', 'كيرم', 'ضيافة', 'قهوة عربية',
      'شاهي نعناع', 'مكسرات', 'تكيئة', 'ريموت', 'شاحن', 'سماعات'
    ],
    wordsEn: [
      'Coffee Table', 'Sofa', 'Cards Game', 'Incense', 'Carpet', 'Cushion', 'Fireplace',
      'Teapot', 'Board Game', 'Hospitality', 'Green Tea', 'Snacks', 'TV Remote', 'Headphones',
      'Slippers', 'Blanket', 'Pillow', 'Doorbell', 'Keyring', 'Flashlight', 'Candle'
    ],
    words: [
      'دلة', 'فنجال', 'تمر', 'بلوت', 'مبخرة', 'مسند', 'زولية', 'عود',
      'سبحة', 'بشت', 'شبة نار', 'صينية', 'ترامس', 'كيرم', 'ضيافة', 'قهوة عربية',
      'شاهي نعناع', 'مكسرات', 'تكيئة', 'ريموت', 'شاحن', 'سماعات'
    ],
  },

  // 3. Kitchen Tools (Free)
  {
    id: 'kitchen',
    nameAr: 'أدوات المطبخ',
    nameEn: 'Kitchen Tools',
    name: 'أدوات المطبخ',
    isLocked: false,
    icon: '🍳',
    wordsAr: [
      'خلاط', 'مقلاة', 'قدر', 'شوكة', 'مبشرة', 'ثلاجة', 'فرن', 'غلاية',
      'ميكروويف', 'ملعقة', 'سكين', 'صفاية', 'صحن', 'قطاعة', 'قلاية هوائية', 'محمصة',
      'صينية فرن', 'مغرفة', 'طحانة قهوة', 'فتاحة علب', 'مريلة'
    ],
    wordsEn: [
      'Blender', 'Frying Pan', 'Cooking Pot', 'Fork', 'Grater', 'Refrigerator', 'Oven',
      'Kettle', 'Microwave', 'Spoon', 'Knife', 'Strainer', 'Plate', 'Air Fryer', 'Toaster',
      'Cutting Board', 'Baking Tray', 'Coffee Grinder', 'Can Opener', 'Apron', 'Whisk'
    ],
    words: [
      'خلاط', 'مقلاة', 'قدر', 'شوكة', 'مبشرة', 'ثلاجة', 'فرن', 'غلاية',
      'ميكروويف', 'ملعقة', 'سكين', 'صفاية', 'صحن', 'قطاعة', 'قلاية هوائية', 'محمصة',
      'صينية فرن', 'مغرفة', 'طحانة قهوة', 'فتاحة علب', 'مريلة'
    ],
  },

  // 4. Supermarket & Grocery (Free)
  {
    id: 'grocery',
    nameAr: 'البقالة والسوق',
    nameEn: 'Supermarket',
    name: 'البقالة والسوق',
    isLocked: false,
    icon: '🛒',
    wordsAr: [
      'حليب', 'خبز', 'شيبس', 'عصير', 'كاشير', 'عربة', 'شوكولاتة', 'زبادي',
      'جبن', 'بيض', 'معلبات', 'فاتورة', 'كيس', 'آيسكريم', 'بسكويت', 'مخلل',
      'تفاح', 'صابون', 'مناديل', 'مياه معدنية', 'تونة', 'معجون أسنان'
    ],
    wordsEn: [
      'Milk', 'Bread', 'Potato Chips', 'Juice', 'Cashier', 'Shopping Cart', 'Chocolate',
      'Yogurt', 'Cheese', 'Eggs', 'Canned Food', 'Receipt', 'Plastic Bag', 'Ice Cream',
      'Biscuits', 'Pickles', 'Apples', 'Soap', 'Tissues', 'Bottled Water', 'Toothpaste'
    ],
    words: [
      'حليب', 'خبز', 'شيبس', 'عصير', 'كاشير', 'عربة', 'شوكولاتة', 'زبادي',
      'جبن', 'بيض', 'معلبات', 'فاتورة', 'كيس', 'آيسكريم', 'بسكويت', 'مخلل',
      'تفاح', 'صابون', 'مناديل', 'مياه معدنية', 'تونة', 'معجون أسنان'
    ],
  },

  // 5. Football & Clubs (VIP)
  {
    id: 'football',
    nameAr: 'كورة وأندية 🔒',
    nameEn: 'Football & Clubs 🔒',
    name: 'كورة وأندية 🔒',
    isLocked: true,
    icon: '⚽',
    wordsAr: [
      'ريال مدريد', 'برشلونة', 'رونالدو', 'ميسي', 'الهلال', 'النصر', 'تسلل', 'ركلة جزاء',
      'دوري الأبطال', 'كلاسيكو', 'كأس العالم', 'حذاء ذهبي', 'ضربة حرة', 'كرت أحمر',
      'باريس', 'مانشستر سيتي', 'أرسنال', 'ليفربول', 'الاتحاد', 'الأهلي', 'حارس مرمى', 'فار VAR'
    ],
    wordsEn: [
      'Real Madrid', 'Barcelona', 'Cristiano Ronaldo', 'Lionel Messi', 'Al Hilal', 'Al Nassr',
      'Offside', 'Penalty Kick', 'Champions League', 'World Cup', 'Golden Boot', 'Free Kick',
      'Red Card', 'PSG', 'Manchester City', 'Arsenal', 'Liverpool', 'Al Ittihad', 'Goalkeeper', 'VAR'
    ],
    words: [
      'ريال مدريد', 'برشلونة', 'رونالدو', 'ميسي', 'الهلال', 'النصر', 'تسلل', 'ركلة جزاء',
      'دوري الأبطال', 'كلاسيكو', 'كأس العالم', 'حذاء ذهبي', 'ضربة حرة', 'كرت أحمر',
      'باريس', 'مانشستر سيتي', 'أرسنال', 'ليفربول', 'الاتحاد', 'الأهلي', 'حارس مرمى', 'فار VAR'
    ],
  },

  // 6. Video Games (VIP)
  {
    id: 'gaming',
    nameAr: 'ألعاب فيديو 🔒',
    nameEn: 'Video Games 🔒',
    name: 'ألعاب فيديو 🔒',
    isLocked: true,
    icon: '🎮',
    wordsAr: [
      'قراند', 'فيفا', 'ماينكرافت', 'روبلوكس', 'فورتنايت', 'كول أوف ديوتي', 'فالورانت',
      'سوني', 'ديسكورد', 'ستيم', 'ليق أوف ليجندز', 'إيلدن رينق', 'ببجي', 'كراش',
      'ماريو', 'زيلدا', 'تيكن', 'أوفر ووتش', 'ريد ديد', 'أساسنز كريد', 'غود أوف وور'
    ],
    wordsEn: [
      'Grand Theft Auto', 'FIFA FC', 'Minecraft', 'Roblox', 'Fortnite', 'Call of Duty',
      'Valorant', 'PlayStation', 'Steam', 'Discord', 'League of Legends', 'Elden Ring',
      'PUBG', 'Crash Bandicoot', 'Super Mario', 'Zelda', 'Tekken', 'Overwatch', 'Red Dead Redemption', 'God of War'
    ],
    words: [
      'قراند', 'فيفا', 'ماينكرافت', 'روبلوكس', 'فورتنايت', 'كول أوف ديوتي', 'فالورانت',
      'سوني', 'ديسكورد', 'ستيم', 'ليق أوف ليجندز', 'إيلدن رينق', 'ببجي', 'كراش',
      'ماريو', 'زيلدا', 'تيكن', 'أوفر ووتش', 'ريد ديد', 'أساسنز كريد', 'غود أوف وور'
    ],
  },

  // 7. Anime & Manga (VIP)
  {
    id: 'anime',
    nameAr: 'أنمي ومانجا 🔒',
    nameEn: 'Anime & Manga 🔒',
    name: 'أنمي ومانجا 🔒',
    isLocked: true,
    icon: '⚡',
    wordsAr: [
      'ون بيس', 'ناروتو', 'هجوم العمالقة', 'قاتل الشياطين', 'لوفي', 'غوكو', 'كونان',
      'جوجوتسو كايسن', 'ديث نوت', 'بليتش', 'هنتر هنتر', 'سيلور مون', 'ساسكي', 'زورو',
      'كايدو', 'إيتاشي', 'إرين', 'ليفاي', 'كاكاشي', 'مادارا', 'غوجو ساتورو'
    ],
    wordsEn: [
      'One Piece', 'Naruto', 'Attack on Titan', 'Demon Slayer', 'Monkey D. Luffy', 'Goku',
      'Detective Conan', 'Jujutsu Kaisen', 'Death Note', 'Bleach', 'Hunter x Hunter',
      'Roronoa Zoro', 'Sasuke Uchiha', 'Itachi', 'Eren Yeager', 'Levi Ackerman', 'Kakashi', 'Madara', 'Satoru Gojo', 'Dragon Ball'
    ],
    words: [
      'ون بيس', 'ناروتو', 'هجوم العمالقة', 'قاتل الشياطين', 'لوفي', 'غوكو', 'كونان',
      'جوجوتسو كايسن', 'ديث نوت', 'بليتش', 'هنتر هنتر', 'سيلور مون', 'ساسكي', 'زورو',
      'كايدو', 'إيتاشي', 'إرين', 'ليفاي', 'كاكاشي', 'مادارا', 'غوجو ساتورو'
    ],
  },

  // 8. Movies & Series (VIP)
  {
    id: 'movies',
    nameAr: 'مسلسلات وأفلام 🔒',
    nameEn: 'Movies & Series 🔒',
    name: 'مسلسلات وأفلام 🔒',
    isLocked: true,
    icon: '🎬',
    wordsAr: [
      'بريكنق باد', 'صراع العروش', 'هاري بوتر', 'سبايدرمان', 'باتمان', 'الجوكر', 'نتفلكس',
      'أوسكار', 'إنسبشن', 'إنترستيلر', 'سيد الخواتم', 'أفاتار', 'طاش ما طاش', 'شباب البومب',
      'باب الحارة', 'تايتانيك', 'بيكي بلايندرز', 'سترينجر ثينقز', 'مارفل', 'أوبنهايمر'
    ],
    wordsEn: [
      'Breaking Bad', 'Game of Thrones', 'Harry Potter', 'Spider-Man', 'Batman', 'Joker',
      'Netflix', 'Oscar Trophy', 'Inception', 'Interstellar', 'Lord of the Rings', 'Avatar',
      'Titanic', 'Peaky Blinders', 'Stranger Things', 'Marvel Studios', 'Star Wars', 'The Matrix', 'Oppenheimer', 'Gladiator'
    ],
    words: [
      'بريكنق باد', 'صراع العروش', 'هاري بوتر', 'سبايدرمان', 'باتمان', 'الجوكر', 'نتفلكس',
      'أوسكار', 'إنسبشن', 'إنترستيلر', 'سيد الخواتم', 'أفاتار', 'طاش ما طاش', 'شباب البومب',
      'باب الحارة', 'تايتانيك', 'بيكي بلايندرز', 'سترينجر ثينقز', 'مارفل', 'أوبنهايمر'
    ],
  },

  // 9. Countries & Tourism (VIP)
  {
    id: 'countries',
    nameAr: 'دول ومدن سياحية 🔒',
    nameEn: 'Countries & Cities 🔒',
    name: 'دول ومدن سياحية 🔒',
    isLocked: true,
    icon: '✈️',
    wordsAr: [
      'الكويت', 'الرياض', 'دبي', 'إفران', 'كازابلانكا', 'باريس', 'طوكيو', 'لندن',
      'إسطنبول', 'القاهرة', 'المالديف', 'برشلونة', 'نيويورك', 'روما', 'بالي',
      'الدوحة', 'جدة', 'مراكش', 'سيول', 'لوس أنجلوس', 'صلالة'
    ],
    wordsEn: [
      'Kuwait', 'Riyadh', 'Dubai', 'Ifrane', 'Casablanca', 'Paris', 'Tokyo', 'London',
      'Istanbul', 'Cairo', 'Maldives', 'Barcelona', 'New York', 'Rome', 'Bali',
      'Doha', 'Jeddah', 'Marrakech', 'Seoul', 'Los Angeles', 'Salalah'
    ],
    words: [
      'الكويت', 'الرياض', 'دبي', 'إفران', 'كازابلانكا', 'باريس', 'طوكيو', 'لندن',
      'إسطنبول', 'القاهرة', 'المالديف', 'برشلونة', 'نيويورك', 'روما', 'بالي',
      'الدوحة', 'جدة', 'مراكش', 'سيول', 'لوس أنجلوس', 'صلالة'
    ],
  },

  // 10. Cars & Brands (VIP)
  {
    id: 'cars',
    nameAr: 'سيارات وماركات 🔒',
    nameEn: 'Cars & Brands 🔒',
    name: 'سيارات وماركات 🔒',
    isLocked: true,
    icon: '🏎️',
    wordsAr: [
      'مرسيدس', 'بي إم دبليو', 'بورش', 'فراري', 'تويوتا', 'لاندكروزر', 'تسلا', 'لكزس',
      'نيسان باترول', 'رولز رويس', 'لامبورغيني', 'رينج روفر', 'فورد موستنج', 'بنتلي',
      'أودي', 'مازيراتي', 'شيفروليه', 'كامري', 'كورفيت', 'جيب شيروكي'
    ],
    wordsEn: [
      'Mercedes-Benz', 'BMW', 'Porsche', 'Ferrari', 'Toyota', 'Land Cruiser', 'Tesla', 'Lexus',
      'Nissan Patrol', 'Rolls-Royce', 'Lamborghini', 'Range Rover', 'Ford Mustang', 'Bentley',
      'Audi', 'Maserati', 'Chevrolet', 'Camry', 'Corvette', 'Jeep Cherokee'
    ],
    words: [
      'مرسيدس', 'بي إم دبليو', 'بورش', 'فراري', 'تويوتا', 'لاندكروزر', 'تسلا', 'لكزس',
      'نيسان باترول', 'رولز رويس', 'لامبورغيني', 'رينج روفر', 'فورد موستنج', 'بنتلي',
      'أودي', 'مازيراتي', 'شيفروليه', 'كامري', 'كورفيت', 'جيب شيروكي'
    ],
  },

  // 11. Tech & University Life (VIP)
  {
    id: 'tech',
    nameAr: 'تقنية وجامعة 🔒',
    nameEn: 'Tech & Uni Life 🔒',
    name: 'تقنية وجامعة 🔒',
    isLocked: true,
    icon: '💻',
    wordsAr: [
      'آيفون', 'شات جي بي تي', 'بايثون', 'لابتوب', 'اختبار نهائي', 'محاضرة', 'كود', 'واي فاي',
      'بطارية', 'بروجكتر', 'ذكاء اصطناعي', 'إيميل', 'يوتيوب', 'بلوتوث', 'ماوس', 'كيبورد',
      'شاحن', 'خوارزمية', 'بحث تخرج', 'معدل تراكمي', 'حضور وغياب'
    ],
    wordsEn: [
      'iPhone', 'ChatGPT', 'Python', 'Laptop', 'Final Exam', 'Lecture', 'Source Code', 'Wi-Fi',
      'Battery', 'Projector', 'Artificial Intelligence', 'Email', 'YouTube', 'Bluetooth', 'Mouse', 'Keyboard',
      'Charger', 'Algorithm', 'Graduation Project', 'GPA', 'Attendance'
    ],
    words: [
      'آيفون', 'شات جي بي تي', 'بايثون', 'لابتوب', 'اختبار نهائي', 'محاضرة', 'كود', 'واي فاي',
      'بطارية', 'بروجكتر', 'ذكاء اصطناعي', 'إيميل', 'يوتيوب', 'بلوتوث', 'ماوس', 'كيبورد',
      'شاحن', 'خوارزمية', 'بحث تخرج', 'معدل تراكمي', 'حضور وغياب'
    ],
  },

  // 12. Custom Category ✍️ (VIP)
  {
    id: 'custom',
    nameAr: 'فئة مخصصة ✍️ 🔒',
    nameEn: 'Custom Category ✍️ 🔒',
    name: 'فئة مخصصة ✍️ 🔒',
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

export const DEFAULT_CATEGORY_ID = 'food';

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

    if (isCustom && customCategory && customCategory.name) {
      localizedName = `${customCategory.name} ✍️`;
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
