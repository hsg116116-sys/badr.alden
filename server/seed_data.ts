import { type User, type Category, type Product } from "@shared/schema";

export const initialCategories: Category[] = [
    { id: 'chocolate', name: 'شوكولاتة مستوردة ومحلية', icon: '🍫', image: null, parentId: null },
    { id: 'nuts', name: 'مكسرات وبذور', icon: '🥜', image: null, parentId: null },
    { id: 'dates', name: 'تمور ومعمول', icon: '🌴', image: null, parentId: null },
    { id: 'soda', name: 'مشروبات غازية', icon: '🥤', image: null, parentId: null },
    { id: 'energy', name: 'مشروبات طاقة وعصائر', icon: '⚡', image: null, parentId: null },
    { id: 'jelly', name: 'جيلي وحلوى مطاطة', icon: '🍭', image: null, parentId: null },
    { id: 'biscuits', name: 'بسكويت وكوكيز', icon: '🍪', image: null, parentId: null },
    { id: 'toffee', name: 'حلوى وتوفي', icon: '🍬', image: null, parentId: null },
    { id: 'candy', name: 'مصاصات وكاندي أطفال', icon: '🍡', image: null, parentId: null },
    { id: 'coffee', name: 'قهوة وشاي', icon: '☕', image: null, parentId: null },
    { id: 'chips', name: 'مقرمشات وشيبس', icon: '🍿', image: null, parentId: null },
    { id: 'eastern_sweets', name: 'حلوى شرقية ونوجا', icon: '🎂', image: null, parentId: null },
    { id: 'water', name: 'مياه معدنية', icon: '💧', image: null, parentId: null },
    { id: 'dried_fruits', name: 'فواكه مجففة وتين', icon: '🍇', image: null, parentId: null },
    { id: 'toys', name: 'ألعاب وهدايا أطفال', icon: '🎁', image: null, parentId: null },
];

export const initialProducts: Product[] = [
    // Chocolate
    {
        id: 1, name: "ميلكا كاملة", categoryId: "chocolate", price: 12, unit: "قطعة",
        image: "/images/products/milka.png", description: "شوكولاتة ميلكا الكلاسيكية بالحليب الكامل الدسم، مستوردة.",
        badge: "مستورد", size: null, weight: "100غ", isFeatured: true, isActive: true,
        stockQuantity: 200, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 2, name: "كيت كات أصلي", categoryId: "chocolate", price: 5, unit: "قطعة",
        image: "/images/products/kitkat.png", description: "كيت كات بالشوكولاتة الكاملة والبسكويت المقرمش.",
        badge: null, size: null, weight: "45غ", isFeatured: false, isActive: true,
        stockQuantity: 300, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 3, name: "فيريرو روشيه", categoryId: "chocolate", price: 45, unit: "علبة",
        image: "/images/products/ferrero.png", description: "فيريرو روشيه الفاخر، هدية مثالية في كل مناسبة.",
        badge: "فاخر", size: null, weight: "200غ", isFeatured: true, isActive: true,
        stockQuantity: 100, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 4, name: "لينت ميلك", categoryId: "chocolate", price: 35, unit: "قطعة",
        image: "/images/products/lindt.png", description: "شوكولاتة لينت السويسرية الناعمة بالحليب الكامل.",
        badge: "سويسري", size: null, weight: "100غ", isFeatured: false, isActive: true,
        stockQuantity: 150, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Nuts
    {
        id: 5, name: "فستق حلبي محمص", categoryId: "nuts", price: 120, unit: "كيلو",
        image: "/images/products/pistachios.png", description: "فستق حلبي سوري محمص طازج يومياً بدرجات تحميص مختلفة.",
        badge: "طازج", size: null, weight: null, isFeatured: true, isActive: true,
        stockQuantity: 50, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: true, allowSpecialInstructions: true,
    },
    {
        id: 6, name: "كاجو خام / محمص", categoryId: "nuts", price: 95, unit: "كيلو",
        image: "/images/products/cashew.png", description: "كاجو أصلي فيتنامي، متاح خام أو محمص حسب رغبتك.",
        badge: "الأكثر مبيعاً", size: null, weight: null, isFeatured: true, isActive: true,
        stockQuantity: 80, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: true, allowSpecialInstructions: true,
    },
    {
        id: 7, name: "لوز مقشور محمص", categoryId: "nuts", price: 80, unit: "كيلو",
        image: "/images/products/almonds.png", description: "لوز كاليفورني مقشور محمص بزيت الزيتون والملح الخشن.",
        badge: null, size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 60, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: true, allowSpecialInstructions: true,
    },
    {
        id: 8, name: "ماكاديميا", categoryId: "nuts", price: 150, unit: "كيلو",
        image: "/images/products/macadamia.png", description: "ماكاديميا أسترالية فاخرة، طعم زبداني رائع.",
        badge: "فاخر", size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 30, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: false, allowSpecialInstructions: true,
    },
    {
        id: 9, name: "بيكان", categoryId: "nuts", price: 110, unit: "كيلو",
        image: "/images/products/pecan.png", description: "بيكان أمريكي منتقى، محمص بعناية.",
        badge: null, size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 40, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: false, allowSpecialInstructions: true,
    },

    // Dates
    {
        id: 10, name: "تمر مجدول", categoryId: "dates", price: 90, unit: "كيلو",
        image: "/images/products/medjool.png", description: "تمر مجدول أردني فاخر، كبير الحجم وطري القوام.",
        badge: "فاخر", size: null, weight: null, isFeatured: true, isActive: true,
        stockQuantity: 100, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 11, name: "معمول بتمر", categoryId: "dates", price: 60, unit: "كيلو",
        image: "/images/products/maamoul.png", description: "معمول تقليدي محشو بعجوة التمر، مصنوع يدوياً.",
        badge: "منزلي", size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 50, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Soda Drinks
    {
        id: 12, name: "بيبسي", categoryId: "soda", price: 3, unit: "علبة",
        image: "/images/products/pepsi.png", description: "بيبسي كولا الكلاسيكية المنعشة، 330 مل.",
        badge: null, size: null, weight: "330مل", isFeatured: false, isActive: true,
        stockQuantity: 500, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 13, name: "كوكاكولا", categoryId: "soda", price: 3, unit: "علبة",
        image: "/images/products/cocacola.png", description: "كوكاكولا الأصلية المنعشة، 330 مل.",
        badge: null, size: null, weight: "330مل", isFeatured: false, isActive: true,
        stockQuantity: 500, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 14, name: "باربيكان تفاح", categoryId: "soda", price: 7, unit: "علبة",
        image: "/images/products/barbican.png", description: "باربيكان بنكهة التفاح، مشروب لذيذ بدون كحول.",
        badge: "مفضل", size: null, weight: "330مل", isFeatured: true, isActive: true,
        stockQuantity: 200, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Energy Drinks
    {
        id: 15, name: "ريد بول", categoryId: "energy", price: 10, unit: "علبة",
        image: "/images/products/redbull.png", description: "ريد بول مشروب الطاقة الأصلي، 250 مل.",
        badge: null, size: null, weight: "250مل", isFeatured: false, isActive: true,
        stockQuantity: 200, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 16, name: "هايب", categoryId: "energy", price: 8, unit: "علبة",
        image: "/images/products/hype.png", description: "مشروب الطاقة هايب، توليفة مميزة من الفيتامينات.",
        badge: null, size: null, weight: "250مل", isFeatured: false, isActive: true,
        stockQuantity: 150, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Jelly
    {
        id: 17, name: "هاريبو مكس", categoryId: "jelly", price: 15, unit: "كيس",
        image: "/images/products/haribo.png", description: "هاريبو المجموعة المختلطة، مذاقات متنوعة للجميع.",
        badge: "الأكثر مبيعاً", size: null, weight: "200غ", isFeatured: true, isActive: true,
        stockQuantity: 150, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 18, name: "مارشميلو", categoryId: "jelly", price: 10, unit: "كيس",
        image: "/images/products/marshmallow.png", description: "مارشميلو ناعم وخفيف، متوفر بألوان وأشكال متعددة.",
        badge: null, size: null, weight: "150غ", isFeatured: false, isActive: true,
        stockQuantity: 100, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Biscuits
    {
        id: 19, name: "أوريو أصلي", categoryId: "biscuits", price: 8, unit: "علبة",
        image: "/images/products/oreo.png", description: "بسكويت أوريو الكلاسيكي بالكريمة البيضاء.",
        badge: null, size: null, weight: "154غ", isFeatured: false, isActive: true,
        stockQuantity: 300, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 20, name: "لواكر فانيليا", categoryId: "biscuits", price: 12, unit: "علبة",
        image: "/images/products/loacker.png", description: "لواكر الإيطالي بالوافل والفانيليا الكريمي.",
        badge: "إيطالي", size: null, weight: "175غ", isFeatured: false, isActive: true,
        stockQuantity: 150, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 21, name: "لوتس أصلي", categoryId: "biscuits", price: 18, unit: "علبة",
        image: "/images/products/lotus.png", description: "بسكويت لوتس البلجيكي بنكهة الكراميل المميزة.",
        badge: "بلجيكي", size: null, weight: "250غ", isFeatured: true, isActive: true,
        stockQuantity: 200, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Toffee / Candy
    {
        id: 22, name: "منتوس فراولة", categoryId: "toffee", price: 4, unit: "لفافة",
        image: "/images/products/mentos.png", description: "منتوس المنعش بنكهة الفراولة اللذيذة.",
        badge: null, size: null, weight: "37غ", isFeatured: false, isActive: true,
        stockQuantity: 400, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 23, name: "ورثرز أوريجنال", categoryId: "toffee", price: 12, unit: "كيس",
        image: "/images/products/werthers.png", description: "حلوى ورثرز الكريمية ذات المذاق الراقي.",
        badge: null, size: null, weight: "120غ", isFeatured: false, isActive: true,
        stockQuantity: 150, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Kids Candy
    {
        id: 24, name: "لولي بوب مكس", categoryId: "candy", price: 5, unit: "كيس",
        image: "/images/products/lollipop.png", description: "مجموعة مصاصات ملونة بنكهات متعددة للأطفال.",
        badge: null, size: null, weight: "100غ", isFeatured: false, isActive: true,
        stockQuantity: 300, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Coffee & Tea
    {
        id: 25, name: "نسكافيه كلاسيك", categoryId: "coffee", price: 45, unit: "علبة",
        image: "/images/products/nescafe.png", description: "نسكافيه الكلاسيكي القهوة الفورية الأشهر عالمياً.",
        badge: null, size: null, weight: "200غ", isFeatured: true, isActive: true,
        stockQuantity: 100, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 26, name: "بن أبو عوف", categoryId: "coffee", price: 55, unit: "كيلو",
        image: "/images/products/abouauf.png", description: "قهوة بن أبو عوف المحمصة، متوفر بدرجات طحن مختلفة.",
        badge: "الأكثر مبيعاً", size: null, weight: null, isFeatured: true, isActive: true,
        stockQuantity: 80, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: true, allowSpecialInstructions: true,
    },
    {
        id: 27, name: "سحلب مكس", categoryId: "coffee", price: 30, unit: "علبة",
        image: "/images/products/sahlab.png", description: "مشروب السحلب الدافئ بالقشدة والمكسرات.",
        badge: null, size: null, weight: "250غ", isFeatured: false, isActive: true,
        stockQuantity: 60, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Chips
    {
        id: 28, name: "برنجلز أصلي", categoryId: "chips", price: 15, unit: "علبة",
        image: "/images/products/pringles.png", description: "برنجلز المقرمش الكلاسيكي، مذاق لا يُقاوم.",
        badge: null, size: null, weight: "165غ", isFeatured: false, isActive: true,
        stockQuantity: 200, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 29, name: "شيبسي ملح", categoryId: "chips", price: 5, unit: "كيس",
        image: "/images/products/chipsy.png", description: "شيبسي بالملح الكلاسيكي، مقرمش ولذيذ.",
        badge: null, size: null, weight: "90غ", isFeatured: false, isActive: true,
        stockQuantity: 400, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Eastern Sweets
    {
        id: 30, name: "نوجا بالفستق", categoryId: "eastern_sweets", price: 50, unit: "كيلو",
        image: "/images/products/nougat.png", description: "نوجا تركية فاخرة محشوة بالفستق الحلبي.",
        badge: "فاخر", size: null, weight: null, isFeatured: true, isActive: true,
        stockQuantity: 40, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 31, name: "ملبس لوز", categoryId: "eastern_sweets", price: 70, unit: "كيلو",
        image: "/images/products/sugared_almond.png", description: "لوز ملبس بالسكر الناعم، هدية مناسبات مميزة.",
        badge: null, size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 50, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Water
    {
        id: 32, name: "أكوا دلتا 1.5 لتر", categoryId: "water", price: 2, unit: "زجاجة",
        image: "/images/products/aquadelta.png", description: "مياه أكوا دلتا المعدنية الطبيعية، 1.5 لتر.",
        badge: null, size: null, weight: "1.5 لتر", isFeatured: false, isActive: true,
        stockQuantity: 500, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 33, name: "نستله مياه", categoryId: "water", price: 2, unit: "زجاجة",
        image: "/images/products/nestle_water.png", description: "مياه نستله المعدنية النقية، 1.5 لتر.",
        badge: null, size: null, weight: "1.5 لتر", isFeatured: false, isActive: true,
        stockQuantity: 500, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Dried Fruits
    {
        id: 34, name: "زبيب ذهبي", categoryId: "dried_fruits", price: 25, unit: "كيلو",
        image: "/images/products/raisins.png", description: "زبيب ذهبي أفغاني فاخر، حلو الطعم غني بالحديد.",
        badge: null, size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 80, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 35, name: "تين مجفف", categoryId: "dried_fruits", price: 40, unit: "كيلو",
        image: "/images/products/dried_figs.png", description: "تين مجفف تركي طبيعي، غني بالألياف والمعادن.",
        badge: null, size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 60, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 36, name: "مشمشية مجففة", categoryId: "dried_fruits", price: 35, unit: "كيلو",
        image: "/images/products/dried_apricot.png", description: "مشمش تركي مجفف طبيعي دون مواد حافظة.",
        badge: null, size: null, weight: null, isFeatured: false, isActive: true,
        stockQuantity: 50, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },

    // Toys / Gifts
    {
        id: 37, name: "بيضة كيندر سوربريز", categoryId: "toys", price: 10, unit: "قطعة",
        image: "/images/products/kinder_surprise.png", description: "بيضة كيندر سوربريز بالشوكولاتة والمفاجأة الداخلية.",
        badge: "للأطفال", size: null, weight: "20غ", isFeatured: false, isActive: true,
        stockQuantity: 200, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: false, hasExtras: false, allowSpecialInstructions: false,
    },
    {
        id: 38, name: "هدية مكسرات وشوكولاتة", categoryId: "toys", price: 120, unit: "علبة",
        image: "/images/products/gift_box.png", description: "علبة هدايا فاخرة تحتوي على تشكيلة من المكسرات والشوكولاتة.",
        badge: "هدية", size: null, weight: null, isFeatured: true, isActive: true,
        stockQuantity: 30, isOutOfStock: false, imageObjectPosition: null,
        hasCutting: false, hasPackaging: true, hasExtras: false, allowSpecialInstructions: true,
    },
];
