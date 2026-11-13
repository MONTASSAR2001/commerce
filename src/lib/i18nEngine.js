/**
 * Intelligent Context-Aware Trilingual Localization Engine (EN / FR / AR)
 * Translates UI chrome, fashion editorial phrases, garment titles, categories, genders, colors,
 * and dynamic storefront metadata using phrase-level grammar rules rather than literal word-by-word replacement.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', label: 'FR', nativeName: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'AR', nativeName: 'العربية', dir: 'rtl' }
];

export function getLanguageMeta(lang = 'en') {
  return SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
}

export const UI_TRANSLATIONS = {
  en: {
    nav: {
      shop: 'Shop',
      drops: 'Drops',
      sale: 'Sale',
      new: 'New',
      aiStylist: 'PERSONAL STYLIST',
      lab3d: '3D LAB',
      man: 'MAN',
      woman: 'WOMAN',
      allCollections: 'ALL COLLECTIONS',
      categories: 'CATEGORIES',
      searchProducts: 'Search Products',
      wishlist: 'Wishlist',
      shoppingBag: 'Shopping Bag',
      dayMode: 'Day',
      nightMode: 'Night'
    },
    hero: {
      exploreDrop: 'Explore Drop',
      launch3dLab: '3D Fitting Lab',
      scrollHint: 'Scroll to discover',
      tunisiaFree: 'Free Tunisia delivery 300 DT+',
      tagline: 'Dress the unconventional',
      titleLine1: 'WEAR THE',
      titleLine2: 'HYPE "RAW"',
      ctaText: 'SHOP NOW'
    },
    about: {
      prefix: 'About',
      suffix: 'us',
      ctaText: 'VIEW MORE'
    },
    lookbook: {
      overlay: 'clothing',
      ctaText: 'SHOP COLLECTION'
    },
    giftCard: {
      overlay: 'gift card',
      badge: 'LIMITED EDITION',
      ctaText: 'GET NOW'
    },
    drops: {
      attentionBadge: 'ATTENTION LIMITED STOCK'
    },
    sections: {
      dropsPrefix: 'latest',
      dropsSuffix: 'DROPS',
      dropsCta: 'EXPLORE DROPS',
      salePrefix: 'studio',
      saleSuffix: 'COLLECTION',
      pricingLabel: 'PRICING:',
      piecesLoaded: 'PIECES LOADED',
      viewAll: 'VIEW ALL',
      viewingAll: 'VIEWING ALL',
      newPrefix: 'new',
      newSuffix: 'ARRIVALS',
      featuresPrefix: 'why',
      categoriesTitle: 'Categories',
      categoriesSubtitle: 'Explore By Silhouette',
      categoriesCta: 'SHOP ALL',
      holyGrailsPrefix: 'holy',
      holyGrailsSuffix: 'GRAILS',
      socialPrefix: 'social',
      socialSuffix: 'WALL',
      viewOn: 'View On',
      storesPrefix: 'walk-in',
      storesSuffix: 'STORES'
    },
    filters: {
      all: 'ALL',
      man: 'MAN',
      woman: 'WOMAN',
      allCategories: 'ALL CATEGORIES',
      promoOnly: 'PROMO',
      arrivageOnly: 'ARRIVAGE'
    },
    product: {
      quickView: 'QUICK VIEW',
      addToBag: '+ BAG',
      addedToBag: 'ADDED',
      addedBanner: 'ADDED TO BAG',
      tryOn3d: '3D TRY-ON',
      tryOn3dFull: 'TRY ON IN 3D VIRTUAL FITTING LAB',
      selectSize: 'Select Size',
      color: 'Color',
      details: 'Garment Architecture & Fabric',
      stockAvailable: 'Ready to ship',
      outOfStock: 'OUT OF STOCK',
      outOfStockDesc: 'Currently sold out — check back soon.',
      arrivage: 'ARRIVAGE',
      arrivageSoon: 'NEW ARRIVAGE · COMING SOON',
      arrivageDesc: 'Arriving soon — preview details & 3D virtual fit.',
      viewDetails: 'View Full Dossier',
      sizeGuide: '3D Smart Size Finder',
      backToCollection: 'BACK TO COLLECTION',
      collection: 'COLLECTION',
      saved: 'SAVED',
      bag: 'BAG',
      search: 'SEARCH',
      viewMore: 'View more',
      viewLess: 'View less',
      completeLook: 'COMPLETE YOUR LOOK',
      measurements: 'PRODUCT MEASUREMENTS',
      measurementsDesc: 'Standard Tunisian & EU studio cut grading',
      measurementsTipPrefix: 'True to size. Use the',
      measurementsTipLink: '3D Virtual Fitting Lab',
      measurementsTipSuffix: 'to test drape against your exact height & proportions.',
      compositionCare: 'COMPOSITION & CARE',
      inStoreAvailability: 'CHECK IN-STORE AVAILABILITY',
      shippingReturns: 'SHIPPING, EXCHANGES AND RETURNS',
      shippingBullet1: 'Express Tunisia courier delivery in 24–48 hours (Free over 300 DT).',
      shippingBullet2: 'Cash on Delivery or Card accepted across all 24 governorates.',
      shippingBullet3: 'Free exchanges & returns within 30 days with original tags.',
      studioLineup: 'STUDIO LINEUP',
      moreLabel: 'MORE',
      clickPiece: 'CLICK ANY PIECE TO OPEN PAGE',
      youMayLike: 'YOU MAY BE INTERESTED IN'
    },
    search: {
      title: 'Search Archive',
      placeholder: 'SEARCH STREETWEAR, HOODIES, JEANS...',
      noResults: 'No silhouettes matched your search.',
      tryDifferent: 'Try "jacket", "jeans", "leather", or ask AI Stylist.'
    },
    currencyModal: {
      title: 'SELECT YOUR CURRENCY'
    },
    cart: {
      title: 'YOUR BAG',
      empty: 'YOUR SHOPPING BAG IS CURRENTLY EMPTY.',
      subtotal: 'Subtotal',
      shippingFree: 'Complimentary Tunisia Express Unlocked',
      shippingAway: 'away from free Tunisia Express shipping',
      checkout: 'CHECKOUT NOW ↗',
      checkoutTitle: 'COMMANDE CHECKOUT',
      confirmedTitle: 'ORDER CONFIRMED',
      backToBag: '◂ Back to Bag',
      sizeLabel: 'SIZE',
      qtyLabel: 'QTY',
      standardColor: 'Standard',
      fullName: 'Full Name *',
      fullNamePh: 'e.g. Amine Ben Salem',
      emailLabel: 'Email *',
      phoneLabel: 'Phone Number *',
      cityLabel: 'City *',
      cityPh: 'Tunis',
      addressLabel: 'Shipping Address *',
      addressPh: 'Street, Building, Apt',
      promoLabel: 'Promo Code (e.g. KRONOS15)',
      promoPh: 'ENTER CODE',
      applyBtn: 'APPLY',
      appliedSuffix: 'applied',
      notesLabel: 'Delivery Notes',
      notesPh: 'Preferred delivery window...',
      estimatedTotal: 'ESTIMATED TOTAL',
      estimatedTotalShipping: 'ESTIMATED TOTAL (+8 DT SHIPPING <300)',
      processing: 'PROCESSING...',
      confirmOrder: 'CONFIRM COMMANDE ✓',
      commandeRegistered: 'COMMANDE REGISTERED',
      thankYouOrderPrefix: 'Thank you',
      thankYouOrderMid: 'Your order of',
      thankYouOrderSuffix: 'has been sent to Studio for confirmation.',
      continueShopping: 'CONTINUE SHOPPING',
      remove: 'Remove'
    },
    wishlist: {
      title: 'WISHLIST',
      empty: 'NO ITEMS IN YOUR WISHLIST YET.',
      moveToBag: 'ADD'
    },
    chatbot: {
      online: 'Personal Stylist Online',
      hello: 'Hello!',
      subtitle: 'How can I style or assist you today?',
      trackOrder: 'Track my order',
      trackPrompt: 'Track my order status',
      browseDrops: 'Browse drops',
      dropsPrompt: 'Show me the latest curated drops',
      findProduct: 'Find a product',
      findPrompt: 'Recommend an architectural MEN or WOMEN outfit',
      faqs: 'FAQs',
      faqsPrompt: 'Tell me about Tunisia delivery, free shipping, and promo codes',
      placeholder: 'Ask about outfits, sizing, promos, or delivery...',
      typing: 'Personal Stylist is curating your look...',
      inBag: 'IN BAG',
      addBag: '+ BAG',
      nodes: 'nodes'
    },
    footer: {
      archiveTag: 'STREETWEAR ARCHIVE',
      contactUs: 'Contact Us',
      newsletterTitle: 'Join to receive exclusive offers and 15% off your first order.',
      newsletterPlaceholder: 'Your Email Address',
      subscribe: 'Send ↗',
      subscribed: 'THANK YOU! ✓',
      navAll: 'All',
      navDrops: 'Drops',
      navNew: 'New',
      navAi: 'AI Stylist',
      navSale: 'Sale',
      navAbout: 'About',
      navCategories: 'Categories',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      adminStudio: 'Admin Studio ↗',
      customizeStore: 'CUSTOMIZE STORE',
      searchStore: 'Search Store',
      currencyLabel: 'Currency',
      neural: 'NEURAL',
      rights: 'All architectural silhouettes reserved.'
    }
  },
  fr: {
    nav: {
      shop: 'Boutique',
      drops: 'Capsules',
      sale: 'Soldes',
      new: 'Nouveau',
      aiStylist: 'CONSEILLER STYLE',
      lab3d: 'LABO 3D',
      man: 'HOMME',
      woman: 'FEMME',
      allCollections: 'TOUTES LES COLLECTIONS',
      categories: 'CATÉGORIES',
      searchProducts: 'Rechercher un article',
      wishlist: 'Favoris',
      shoppingBag: 'Panier',
      dayMode: 'Jour',
      nightMode: 'Nuit'
    },
    hero: {
      exploreDrop: 'Découvrir la Capsule',
      launch3dLab: 'Essayage 3D',
      scrollHint: 'Faire défiler',
      tunisiaFree: 'Livraison offerte en Tunisie dès 300 DT',
      tagline: 'Affirmez un style hors normes',
      titleLine1: 'PORTEZ',
      titleLine2: 'L’ESSENCE « RAW »',
      ctaText: 'DÉCOUVRIR'
    },
    about: {
      prefix: 'À propos',
      suffix: 'de nous',
      ctaText: 'EN SAVOIR PLUS'
    },
    lookbook: {
      overlay: 'vestiaire',
      ctaText: 'VOIR LA COLLECTION'
    },
    giftCard: {
      overlay: 'carte cadeau',
      badge: 'ÉDITION LIMITÉE',
      ctaText: 'COMMANDER'
    },
    drops: {
      attentionBadge: 'ATTENTION STOCK LIMITÉ'
    },
    sections: {
      dropsPrefix: 'dernières',
      dropsSuffix: 'CAPSULES',
      dropsCta: 'VOIR LES CAPSULES',
      salePrefix: 'collection',
      saleSuffix: 'STUDIO',
      pricingLabel: 'TARIFS :',
      piecesLoaded: 'PIÈCES DISPONIBLES',
      viewAll: 'TOUT VOIR',
      viewingAll: 'TOUT AFFICHÉ',
      newPrefix: 'nouvelles',
      newSuffix: 'ARRIVÉES',
      featuresPrefix: 'pourquoi',
      categoriesTitle: 'Catégories',
      categoriesSubtitle: 'Explorer par Silhouette',
      categoriesCta: 'TOUT VOIR',
      holyGrailsPrefix: 'pièces',
      holyGrailsSuffix: 'CULTES',
      socialPrefix: 'mur',
      socialSuffix: 'SOCIAL',
      viewOn: 'Voir sur',
      storesPrefix: 'nos',
      storesSuffix: 'BOUTIQUES'
    },
    filters: {
      all: 'TOUT',
      man: 'HOMME',
      woman: 'FEMME',
      allCategories: 'TOUTES CATÉGORIES',
      promoOnly: 'PROMO',
      arrivageOnly: 'ARRIVAGE'
    },
    product: {
      quickView: 'APERÇU RAPIDE',
      addToBag: '+ PANIER',
      addedToBag: 'AJOUTÉ',
      addedBanner: 'AJOUTÉ AU PANIER',
      tryOn3d: 'ESSAI 3D',
      tryOn3dFull: 'ESSAYER DANS LE LABO 3D VIRTUEL',
      selectSize: 'Choisir la taille',
      color: 'Coloris',
      details: 'Coupe, Matière & Finitions',
      stockAvailable: 'Expédition sous 24–48h',
      outOfStock: 'RUPTURE DE STOCK',
      outOfStockDesc: 'Actuellement épuisé — bientôt de retour.',
      arrivage: 'ARRIVAGE',
      arrivageSoon: 'EN ARRIVAGE · BIENTÔT DISPONIBLE',
      arrivageDesc: 'En cours d’arrivage — essayez la coupe en 3D.',
      viewDetails: 'Voir la fiche complète',
      sizeGuide: 'Guide des tailles 3D',
      backToCollection: 'RETOUR À LA COLLECTION',
      collection: 'COLLECTION',
      saved: 'FAVORIS',
      bag: 'PANIER',
      search: 'RECHERCHER',
      viewMore: 'Voir plus',
      viewLess: 'Voir moins',
      completeLook: 'COMPLÉTER LE LOOK',
      measurements: 'MESURES DU VÊTEMENT',
      measurementsDesc: 'Coupe standard Studio Tunisie & UE',
      measurementsTipPrefix: 'Taille normalement. Utilisez le',
      measurementsTipLink: 'Labo d’Essayage 3D',
      measurementsTipSuffix: 'pour tester le tombé selon votre morphologie.',
      compositionCare: 'COMPOSITION & ENTRETIEN',
      inStoreAvailability: 'DISPONIBILITÉ EN BOUTIQUE',
      shippingReturns: 'LIVRAISON, ÉCHANGES & RETOURS',
      shippingBullet1: 'Livraison express en Tunisie sous 24–48h (gratuite dès 300 DT).',
      shippingBullet2: 'Paiement à la livraison ou par carte bancaire dans les 24 gouvernorats.',
      shippingBullet3: 'Échanges et retours gratuits sous 30 jours avec étiquettes d’origine.',
      studioLineup: 'SÉLECTION STUDIO',
      moreLabel: 'PLUS',
      clickPiece: 'CLIQUEZ SUR UNE PIÈCE POUR L’OUVRIR',
      youMayLike: 'VOUS AIMEREZ AUSSI'
    },
    search: {
      title: 'Rechercher dans le Studio',
      placeholder: 'RECHERCHER VESTES, JEANS, CUIR, MAILLES...',
      noResults: 'Aucune pièce ne correspond à votre recherche.',
      tryDifferent: 'Essayez « veste », « jean », « cuir » ou demandez au Styliste IA.'
    },
    currencyModal: {
      title: 'CHOISIR VOTRE DEVISE'
    },
    cart: {
      title: 'VOTRE PANIER',
      empty: 'VOTRE PANIER EST ACTUELLEMENT VIDE.',
      subtotal: 'Sous-total',
      shippingFree: 'Livraison Express Tunisie offerte débloquée',
      shippingAway: 'pour profiter de la livraison offerte en Tunisie',
      checkout: 'COMMANDER MAINTENANT ↗',
      checkoutTitle: 'VALIDATION DE COMMANDE',
      confirmedTitle: 'COMMANDE CONFIRMÉE',
      backToBag: '◂ Retour au panier',
      sizeLabel: 'TAILLE',
      qtyLabel: 'QTÉ',
      standardColor: 'Standard',
      fullName: 'Nom complet *',
      fullNamePh: 'ex. Amine Ben Salem',
      emailLabel: 'E-mail *',
      phoneLabel: 'Téléphone *',
      cityLabel: 'Ville *',
      cityPh: 'Tunis',
      addressLabel: 'Adresse de livraison *',
      addressPh: 'Rue, immeuble, appartement',
      promoLabel: 'Code promo (ex. KRONOS15)',
      promoPh: 'ENTRER LE CODE',
      applyBtn: 'APPLIQUER',
      appliedSuffix: 'appliqué',
      notesLabel: 'Instructions de livraison',
      notesPh: 'Créneau de livraison souhaité...',
      estimatedTotal: 'TOTAL ESTIMÉ',
      estimatedTotalShipping: 'TOTAL ESTIMÉ (+8 DT LIVRAISON <300)',
      processing: 'TRAITEMENT EN COURS...',
      confirmOrder: 'CONFIRMER LA COMMANDE ✓',
      commandeRegistered: 'COMMANDE ENREGISTRÉE',
      thankYouOrderPrefix: 'Merci',
      thankYouOrderMid: 'Votre commande de',
      thankYouOrderSuffix: 'a bien été transmise au Studio pour confirmation.',
      continueShopping: 'CONTINUER MES ACHATS',
      remove: 'Retirer'
    },
    wishlist: {
      title: 'FAVORIS',
      empty: 'AUCUNE PIÈCE ENREGISTRÉE POUR LE MOMENT.',
      moveToBag: 'AJOUTER'
    },
    chatbot: {
      online: 'Conseiller Style En Ligne',
      hello: 'Bonjour !',
      subtitle: 'Comment puis-je vous conseiller aujourd’hui ?',
      trackOrder: 'Suivre ma commande',
      trackPrompt: 'Comment suivre l’état de ma commande ?',
      browseDrops: 'Voir les capsules',
      dropsPrompt: 'Montre-moi les dernières capsules exclusives',
      findProduct: 'Trouver une pièce',
      findPrompt: 'Conseille-moi un look complet HOMME ou FEMME',
      faqs: 'Questions fréquentes',
      faqsPrompt: 'Quels sont les délais de livraison en Tunisie et les codes promo actifs ?',
      placeholder: 'Demandez un look, une taille, un code promo...',
      typing: 'Votre conseiller prépare votre sélection...',
      inBag: 'AU PANIER',
      addBag: '+ PANIER',
      nodes: 'nœuds'
    },
    footer: {
      archiveTag: 'ARCHIVE STREETWEAR',
      contactUs: 'Contactez-nous',
      newsletterTitle: 'Inscrivez-vous pour recevoir nos offres exclusives et -15 % sur votre première commande.',
      newsletterPlaceholder: 'Votre adresse e-mail',
      subscribe: 'Envoyer ↗',
      subscribed: 'MERCI ! ✓',
      navAll: 'Tout',
      navDrops: 'Capsules',
      navNew: 'Nouveau',
      navAi: 'Styliste IA',
      navSale: 'Soldes',
      navAbout: 'À propos',
      navCategories: 'Catégories',
      privacy: 'Confidentialité',
      terms: 'Conditions Générales',
      adminStudio: 'Studio Admin ↗',
      customizeStore: 'PERSONNALISER',
      searchStore: 'Rechercher',
      currencyLabel: 'Devise',
      neural: 'NEURAL',
      rights: 'Toutes silhouettes architecturales réservées.'
    }
  },
  ar: {
    nav: {
      shop: 'المتجر',
      drops: 'الإصدارات',
      sale: 'التخفيضات',
      new: 'جديدنا',
      aiStylist: 'منسق الأزياء',
      lab3d: 'القياس 3D',
      man: 'رجالي',
      woman: 'نسائي',
      allCollections: 'جميع المجموعات',
      categories: 'الفئات',
      searchProducts: 'بحث عن قطعة',
      wishlist: 'المفضلة',
      shoppingBag: 'سلة التسوق',
      dayMode: 'نهاري',
      nightMode: 'ليلي'
    },
    hero: {
      exploreDrop: 'استكشف الإصدار',
      launch3dLab: 'مختبر القياس 3D',
      scrollHint: 'مرر للاكتشاف',
      tunisiaFree: 'توصيل مجاني في تونس للطلبات فوق 300 د.ت',
      tagline: 'تفرّد بإطلالة خارجة عن المألوف',
      titleLine1: 'ارتدِ روح',
      titleLine2: 'الأناقة الجريئة',
      ctaText: 'تسوّق الآن'
    },
    about: {
      prefix: 'من',
      suffix: 'نحن',
      ctaText: 'اكتشف المزيد'
    },
    lookbook: {
      overlay: 'أزياء',
      ctaText: 'استعرض المجموعة'
    },
    giftCard: {
      overlay: 'بطاقة هدية',
      badge: 'إصدار محدود',
      ctaText: 'احصل عليها الآن'
    },
    drops: {
      attentionBadge: 'تنبيه: كمية محدودة جداً'
    },
    sections: {
      dropsPrefix: 'أحدث',
      dropsSuffix: 'الإصدارات',
      dropsCta: 'استكشف الإصدارات',
      salePrefix: 'مجموعة',
      saleSuffix: 'الاستوديو',
      pricingLabel: 'الأسعار:',
      piecesLoaded: 'قطعة متوفرة',
      viewAll: 'عرض الكل',
      viewingAll: 'عرض جميع القطع',
      newPrefix: 'وصلنا',
      newSuffix: 'حديثاً',
      featuresPrefix: 'لماذا',
      categoriesTitle: 'الفئات',
      categoriesSubtitle: 'تصفح حسب التصميم',
      categoriesCta: 'تسوق الكل',
      holyGrailsPrefix: 'أيقونات',
      holyGrailsSuffix: 'نادرة',
      socialPrefix: 'إطلالات',
      socialSuffix: 'المجتمع',
      viewOn: 'شاهد على',
      storesPrefix: 'فروعنا',
      storesSuffix: 'الرئيسية'
    },
    filters: {
      all: 'الكل',
      man: 'رجالي',
      woman: 'نسائي',
      allCategories: 'كل الفئات',
      promoOnly: 'تخفيضات',
      arrivageOnly: 'وصول قريب'
    },
    product: {
      quickView: 'معاينة سريعة',
      addToBag: '+ للسلة',
      addedToBag: 'في السلة',
      addedBanner: 'تمت الإضافة للسلة',
      tryOn3d: 'تجربة 3D',
      tryOn3dFull: 'جرّب القطعة في مختبر القياس 3D',
      selectSize: 'اختر المقاس',
      color: 'اللون',
      details: 'تفاصيل القصة والخامة',
      stockAvailable: 'جاهز للشحن السريع',
      outOfStock: 'نفد المخزون',
      outOfStockDesc: 'غير متوفر حالياً — سيتوفر قريباً.',
      arrivage: 'وصول قريباً',
      arrivageSoon: 'قيد التوريد · متوفر قريباً',
      arrivageDesc: 'قيد التوريد — جرّب القطعة في مختبر القياس 3D.',
      viewDetails: 'عرض التفاصيل الكاملة',
      sizeGuide: 'مرشد المقاسات ثلاثي الأبعاد',
      backToCollection: 'العودة إلى المجموعة',
      collection: 'المجموعة',
      saved: 'المفضلة',
      bag: 'السلة',
      search: 'بحث',
      viewMore: 'عرض المزيد',
      viewLess: 'عرض أقل',
      completeLook: 'أكمل إطلالتك',
      measurements: 'قياسات القطعة',
      measurementsDesc: 'مقاسات استوديو قياسية بتدرج أوروبي وتونسي',
      measurementsTipPrefix: 'المقاس مضبوط تماماً. استخدم',
      measurementsTipLink: 'مختبر القياس 3D',
      measurementsTipSuffix: 'لتجربة القصة حسب طولك وقياساتك بدقة.',
      compositionCare: 'الخامات والعناية بالقطعة',
      inStoreAvailability: 'التوفر في الفروع',
      shippingReturns: 'الشحن والاستبدال والإرجاع',
      shippingBullet1: 'توصيل سريع في تونس خلال 24–48 ساعة (مجاني فوق 300 د.ت).',
      shippingBullet2: 'الدفع نقداً عند الاستلام أو بالبطاقة في جميع الولايات الـ 24.',
      shippingBullet3: 'استبدال وإرجاع مجاني خلال 30 يوماً مع البطاقات الأصلية.',
      studioLineup: 'تشكيلة الاستوديو',
      moreLabel: 'المزيد',
      clickPiece: 'اضغط على أي قطعة لفتح صفحتها',
      youMayLike: 'قطع قد تنال إعجابك'
    },
    search: {
      title: 'البحث في الأرشيف',
      placeholder: 'ابحث عن جاكيت، جينز، جلد، تريكو...',
      noResults: 'لم نعثر على قطع مطابقة لبحثك.',
      tryDifferent: 'جرّب البحث عن "سترة" أو "جينز" أو اسأل المنسق الذكي.'
    },
    currencyModal: {
      title: 'اختر عملتك المفضلة'
    },
    cart: {
      title: 'سلة التسوق',
      empty: 'سلة التسوق فارغة حالياً.',
      subtotal: 'المجموع الفرعي',
      shippingFree: 'تم تفعيل الشحن السريع المجاني في تونس',
      shippingAway: 'المتبقية للشحن المجاني في تونس',
      checkout: 'إتمام الطلب الآن ↗',
      checkoutTitle: 'إتمام بيانات الطلب',
      confirmedTitle: 'تم تأكيد طلبك',
      backToBag: '◂ العودة إلى السلة',
      sizeLabel: 'المقاس',
      qtyLabel: 'الكمية',
      standardColor: 'قياسي',
      fullName: 'الاسم الكامل *',
      fullNamePh: 'مثال: أمين بن سالم',
      emailLabel: 'البريد الإلكتروني *',
      phoneLabel: 'رقم الهاتف *',
      cityLabel: 'المدينة *',
      cityPh: 'تونس',
      addressLabel: 'عنوان التوصيل *',
      addressPh: 'الشارع، المبنى، الشقة',
      promoLabel: 'كود الخصم (مثال: KRONOS15)',
      promoPh: 'أدخل الكود',
      applyBtn: 'تطبيق',
      appliedSuffix: 'مُفعّل',
      notesLabel: 'ملاحظات التوصيل',
      notesPh: 'الوقت المفضل للتوصيل...',
      estimatedTotal: 'الإجمالي التقديري',
      estimatedTotalShipping: 'الإجمالي التقديري (+8 د.ت توصيل أقل من 300)',
      processing: 'جاري المعالجة...',
      confirmOrder: 'تأكيد الطلب ✓',
      commandeRegistered: 'تم تسجيل طلبك بنجاح',
      thankYouOrderPrefix: 'شكراً لك',
      thankYouOrderMid: 'تم إرسال طلبك بقيمة',
      thankYouOrderSuffix: 'إلى الاستوديو للتأكيد والتجهيز.',
      continueShopping: 'متابعة التسوق',
      remove: 'حذف'
    },
    wishlist: {
      title: 'المفضلة',
      empty: 'لا توجد قطع محفوظة في المفضلة بعد.',
      moveToBag: 'أضف'
    },
    chatbot: {
      online: 'منسق الأزياء الشخصي متصل',
      hello: 'أهلاً بك!',
      subtitle: 'كيف يمكنني تنسيق إطلالتك اليوم؟',
      trackOrder: 'تتبع طلبي',
      trackPrompt: 'كيف أتابع حالة طلبي؟',
      browseDrops: 'تصفح الإصدارات',
      dropsPrompt: 'أرني أحدث الإصدارات الحصرية',
      findProduct: 'تنسيق إطلالة',
      findPrompt: 'اقترح عليّ إطلالة رجالية أو نسائية متكاملة',
      faqs: 'الأسئلة الشائعة',
      faqsPrompt: 'أخبرني عن الشحن في تونس والتوصيل المجاني وأكواد الخصم',
      placeholder: 'اسأل عن التنسيقات، المقاسات، الخصومات...',
      typing: 'منسق الأزياء يجهز اختياراتك...',
      inBag: 'في السلة',
      addBag: '+ للسلة',
      nodes: 'عقدة'
    },
    footer: {
      archiveTag: 'أرشيف الأزياء المعاصرة',
      contactUs: 'تواصل معنا',
      newsletterTitle: 'اشترك للحصول على عروض حصرية وخصم 15% على طلبك الأول.',
      newsletterPlaceholder: 'بريدك الإلكتروني',
      subscribe: 'إرسال ↗',
      subscribed: 'شكراً لاشتراكك! ✓',
      navAll: 'الكل',
      navDrops: 'الإصدارات',
      navNew: 'جديدنا',
      navAi: 'منسق الأزياء',
      navSale: 'التخفيضات',
      navAbout: 'من نحن',
      navCategories: 'الفئات',
      privacy: 'سياسة الخصوصية',
      terms: 'الشروط والأحكام',
      adminStudio: 'لوحة التحكم ↗',
      customizeStore: 'تخصيص المتجر',
      searchStore: 'البحث في المتجر',
      currencyLabel: 'العملة',
      neural: 'ذكي',
      rights: 'جميع التصاميم المعمارية محفوظة.'
    }
  }
};

export function createTranslator(lang = 'en') {
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  return function t(path, fallback = '') {
    const parts = String(path || '').split('.');
    let cur = dict;
    for (const part of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
        cur = cur[part];
      } else {
        cur = null;
        break;
      }
    }
    if (typeof cur === 'string') return cur;
    // Fallback to English if missing key
    let enCur = UI_TRANSLATIONS.en;
    for (const part of parts) {
      if (enCur && Object.prototype.hasOwnProperty.call(enCur, part)) {
        enCur = enCur[part];
      } else {
        return fallback || path;
      }
    }
    return typeof enCur === 'string' ? enCur : fallback || path;
  };
}

const EXACT_PRODUCT_NAMES = {
  fr: {
    'TRF MID-WAIST BAGGY FOLDED JEANS': 'JEAN BAGGY TAILLE MOYENNE À REVERS TRF',
    'TEXTURED CHECK CROPPED FIT JACKET': 'VESTE COURTE À CARREAUX TEXTURÉE',
    'Z1975 HIGH-WAIST REGULAR LONG LENGTH JEANS': 'JEAN Z1975 TAILLE HAUTE COUPE DROITE LONGUE',
    'REGULAR FIT SUEDE LEATHER JACKET': 'BLOUSON EN DAIM COUPE DROITE',
    'HOODED BOMBER JACKET': 'BLOUSON BOMBER À CAPUCHE',
    'RELAXED FIT WATER-REPELLENT JACKET': 'VESTE DÉPERLANTE COUPE AMPLE',
    'BOMBER JACKET WITH WIDE COLLAR': 'BLOUSON BOMBER À COL LARGE',
    'CROPPED FIT PADDED JACKET': 'DOUDOUNE COURTE STRUCTURÉE',
    'LEATHER EFFECT JACKET WITH ADJUSTABLE DRAWSTRING WAIST': 'VESTE EFFET CUIR À TAILLE CORDON',
    'NON-IRON COMFORT OVERSHIRT': 'SURCHEMISE CONFORT INFROISSABLE',
    'REGULAR FIT LEATHER EFFECT OVERSHIRT': 'SURCHEMISE COUPE DROITE EFFET CUIR',
    'HIGH-COLLAR KNIT SWEATER': 'PULL EN MAILLE À COL MONTANT',
    'LEATHER EFFECT JACKET WITH ELASTICATED WAIST': 'VESTE EFFET CUIR À TAILLE ÉLASTIQUÉE',
    'HORIZON BLUE LONG SLEEVE': 'T-SHIRT MANCHES LONGUES BLEU HORIZON',
    'CLASSIC CREW NECK': 'T-SHIRT COL ROND CLASSIQUE',
    'STRATOS 95 SP': 'SNEAKERS STRATOS 95 SP',
    'BRUSHED BOMBER HOODIE': 'HOODIE BOMBER MOLLETONNÉ',
    'DARK BLUE EARTHY FADE JEANS': 'JEAN DÉLAVÉ BLEU NUIT',
    'ECLIPSE KNIT CARDIGAN': 'CARDIGAN EN MAILLE ÉCLIPSE',
    'SKY SOCKS': 'CHAUSSETTES ARCHITECTURALES SKY',
    'BLUE DENIM JACKET': 'VESTE EN DENIM BRUT BLEU',
    'OLIVIA WIDE LEG JEANS': 'JEAN COUPE LARGE OLIVIA'
  },
  ar: {
    'TRF MID-WAIST BAGGY FOLDED JEANS': 'جينز باغي بخصر متوسط وثنية سفلية TRF',
    'TEXTURED CHECK CROPPED FIT JACKET': 'سترة قصيرة بنقشة مربعات وملمس بارز',
    'Z1975 HIGH-WAIST REGULAR LONG LENGTH JEANS': 'جينز Z1975 بخصر عالٍ وقصة مستقيمة طويلة',
    'REGULAR FIT SUEDE LEATHER JACKET': 'جاكيت جلد سويدي فاخر بقصة مستقيمة',
    'HOODED BOMBER JACKET': 'جاكيت بومبر بغطاء رأس عصري',
    'RELAXED FIT WATER-REPELLENT JACKET': 'جاكيت مقاوم للماء بقصة مريحة',
    'BOMBER JACKET WITH WIDE COLLAR': 'جاكيت بومبر بياقة عريضة بارزة',
    'CROPPED FIT PADDED JACKET': 'جاكيت مبطن قصير بقصة معمارية',
    'LEATHER EFFECT JACKET WITH ADJUSTABLE DRAWSTRING WAIST': 'جاكيت بملمس الجلد مع رباط خصر قابل للتعديل',
    'NON-IRON COMFORT OVERSHIRT': 'قميص خارجي مريح مقاوم للتجعد',
    'REGULAR FIT LEATHER EFFECT OVERSHIRT': 'قميص خارجي بقصة مستقيمة بملمس الجلد',
    'HIGH-COLLAR KNIT SWEATER': 'كنزة تريكو بياقة عالية محبوكة',
    'LEATHER EFFECT JACKET WITH ELASTICATED WAIST': 'جاكيت بملمس الجلد مع خصر مطاطي مرن',
    'HORIZON BLUE LONG SLEEVE': 'تيشيرت بأكمام طويلة أزرق هورايزون',
    'CLASSIC CREW NECK': 'تيشيرت كلاسيكي بياقة دائرية',
    'STRATOS 95 SP': 'حذاء رياضي ستراتوس 95 SP',
    'BRUSHED BOMBER HOODIE': 'هودي بومبر ببطانة ناعمة',
    'DARK BLUE EARTHY FADE JEANS': 'جينز أزرق داكن بغسل عتيق',
    'ECLIPSE KNIT CARDIGAN': 'كارديغان تريكو إكليبس',
    'SKY SOCKS': 'جوارب استوديو سكاي',
    'BLUE DENIM JACKET': 'جاكيت دينيم أزرق كلاسيكي',
    'OLIVIA WIDE LEG JEANS': 'جينز أوليفيا بقصة أرجل واسعة'
  }
};

const PHRASE_RULES = {
  fr: [
    ['WATER-REPELLENT', 'DÉPERLANT'],
    ['LEATHER EFFECT', 'EFFET CUIR'],
    ['SUEDE LEATHER', 'CUIR DAIM'],
    ['HIGH-WAIST', 'TAILLE HAUTE'],
    ['MID-WAIST', 'TAILLE MOYENNE'],
    ['REGULAR FIT', 'COUPE DROITE'],
    ['RELAXED FIT', 'COUPE AMPLE'],
    ['CROPPED FIT', 'COUPE COURTE'],
    ['OVERSIZED', 'OVERSIZE'],
    ['OVERSHIRT', 'SURCHEMISE'],
    ['BOMBER JACKET', 'BLOUSON BOMBER'],
    ['PADDED JACKET', 'VESTE MATELASSÉE'],
    ['JACKET', 'VESTE'],
    ['JEANS', 'JEAN'],
    ['BAGGY', 'BAGGY'],
    ['KNITWEAR', 'MAILLE'],
    ['SWEATER', 'PULL'],
    ['CARDIGAN', 'CARDIGAN'],
    ['HOODED', 'À CAPUCHE'],
    ['TROUSERS', 'PANTALON'],
    ['SHIRT', 'CHEMISE'],
    ['SKIRTS', 'JUPES'],
    ['SKIRT', 'JUPE'],
    ['COAT', 'MANTEAU']
  ],
  ar: [
    ['WATER-REPELLENT', 'مقاوم للماء'],
    ['LEATHER EFFECT', 'بملمس الجلد'],
    ['SUEDE LEATHER', 'جلد سويدي'],
    ['HIGH-WAIST', 'بخصر عالٍ'],
    ['MID-WAIST', 'بخصر متوسط'],
    ['REGULAR FIT', 'بقصة مستقيمة'],
    ['RELAXED FIT', 'بقصة مريحة'],
    ['CROPPED FIT', 'بقصة قصيرة'],
    ['OVERSIZED', 'بقصة واسعة'],
    ['OVERSHIRT', 'قميص خارجي'],
    ['BOMBER JACKET', 'جاكيت بومبر'],
    ['PADDED JACKET', 'جاكيت مبطن'],
    ['JACKET', 'جاكيت'],
    ['JEANS', 'جينز'],
    ['BAGGY', 'باغي'],
    ['KNITWEAR', 'تريكو محبوك'],
    ['SWEATER', 'كنزة'],
    ['CARDIGAN', 'كارديغان'],
    ['HOODED', 'بغطاء رأس'],
    ['TROUSERS', 'بنطال'],
    ['SHIRT', 'قميص'],
    ['SKIRTS', 'تنانير'],
    ['SKIRT', 'تنورة'],
    ['COAT', 'معطف']
  ]
};

const CATEGORY_MAP = {
  fr: {
    ALL: 'TOUTES CATÉGORIES',
    Jackets: 'Vestes & Blousons',
    Jacket: 'Vestes',
    Jeans: 'Jeans & Denim',
    Overshirts: 'Surchemises',
    Knitwear: 'Mailles & Pulls',
    Shirts: 'Chemises',
    Shirt: 'Chemises',
    Trousers: 'Pantalons',
    Skirts: 'Jupes',
    Coats: 'Manteaux',
    Accessories: 'Accessoires',
    Bags: 'Sacs & Maroquinerie',
    Blazers: 'Blazers',
    Dresses: 'Robes',
    Hoodies: 'Sweats à Capuche',
    Hoodie: 'Sweat à Capuche',
    Polos: 'Polos',
    Shoes: 'Chaussures',
    Tops: 'Hauts & Tops',
    'T-Shirts': 'T-Shirts',
    'T-Shirt': 'T-Shirt'
  },
  ar: {
    ALL: 'كل الفئات',
    Jackets: 'الجاكيتات والمعاطف',
    Jacket: 'جاكيتات',
    Jeans: 'الجينز والدينيم',
    Overshirts: 'القمصان الخارجية',
    Knitwear: 'التريكو والكنزات',
    Shirts: 'القمصان',
    Shirt: 'قمصان',
    Trousers: 'البناطيل',
    Skirts: 'التنانير',
    Coats: 'المعاطف',
    Accessories: 'الإكسسوارات',
    Bags: 'الحقائب',
    Blazers: 'البليزرات',
    Dresses: 'الفساتين',
    Hoodies: 'هوديز وسويت شيرت',
    Hoodie: 'هودي',
    Polos: 'بولو',
    Shoes: 'الأحذية',
    Tops: 'البلوزات',
    'T-Shirts': 'تيشيرتات',
    'T-Shirt': 'تيشيرت'
  }
};

const COLOR_MAP = {
  fr: {
    Black: 'Noir',
    White: 'Blanc',
    Chocolate: 'Chocolat',
    'Dark brown': 'Brun Foncé',
    'Light blue': 'Bleu Clair',
    'Mid-blue': 'Bleu Moyen',
    Blue: 'Bleu',
    Charcoal: 'Anthracite',
    'Dark Charcoal': 'Anthracite Foncé',
    Cream: 'Écru',
    Sand: 'Sable',
    Camel: 'Camel',
    Olive: 'Olive',
    Burgundy: 'Bordeaux',
    'Dark tan': 'Havane Foncé'
  },
  ar: {
    Black: 'أسود',
    White: 'أبيض',
    Chocolate: 'شوكولا',
    'Dark brown': 'بني داكن',
    'Light blue': 'أزرق فاتح',
    'Mid-blue': 'أزرق متوسط',
    Blue: 'أزرق',
    Charcoal: 'رمادي فحمي',
    'Dark Charcoal': 'فحمي داكن',
    Cream: 'كريمي',
    Sand: 'رملي',
    Camel: 'جملي',
    Olive: 'زيتوني',
    Burgundy: 'عنابي',
    'Dark tan': 'تان داكن'
  }
};

export function localizeProductName(name = '', lang = 'en') {
  if (!name || lang === 'en') return name;
  const upper = String(name).trim().toUpperCase();
  const exact = EXACT_PRODUCT_NAMES[lang]?.[upper];
  if (exact) return exact;

  // Fallback intelligent phrase replacement preserving brand/silhouette natural flow
  let out = upper;
  const rules = PHRASE_RULES[lang] || [];
  for (const [src, dst] of rules) {
    if (out.includes(src)) {
      out = out.replace(new RegExp(src, 'g'), dst);
    }
  }
  return out;
}

export function localizeCategory(cat = '', lang = 'en') {
  if (!cat || lang === 'en') return cat;
  return CATEGORY_MAP[lang]?.[cat] || localizeProductName(cat, lang);
}

export function localizeGender(gender = '', lang = 'en') {
  const g = String(gender || '').toUpperCase();
  if (lang === 'fr') return g === 'WOMEN' ? 'FEMME' : g === 'MEN' ? 'HOMME' : g;
  if (lang === 'ar') return g === 'WOMEN' ? 'نسائي' : g === 'MEN' ? 'رجالي' : g;
  return g;
}

export function localizeColor(color = '', lang = 'en') {
  if (!color || lang === 'en') return color;
  return COLOR_MAP[lang]?.[color] || COLOR_MAP[lang]?.[color.trim()] || color;
}

/**
 * Intelligent editorial & storefront copy translation dictionary (idiomatic FR & AR).
 * Uses case/whitespace-normalized matching plus pattern rules for seeded and dynamic copy.
 */
const EDITORIAL_MAP = {
  fr: {
    'DRESS THE UNCONVENTIONAL': 'AFFIRMEZ UN STYLE HORS NORMES',
    'WEAR THE': 'PORTEZ',
    'HYPE "RAW"': 'L’ESSENCE « RAW »',
    'SHOP NOW': 'DÉCOUVRIR',
    'VIEW MORE': 'EN SAVOIR PLUS',
    'SHOP COLLECTION': 'VOIR LA COLLECTION',
    'GET NOW': 'COMMANDER',
    'ATTENTION LIMITED STOCK': 'ATTENTION STOCK LIMITÉ',
    'LIMITED STOCK': 'STOCK LIMITÉ',
    'LIMITED EDITION': 'ÉDITION LIMITÉE',
    'OPEN TODAY': 'OUVERT AUJOURD’HUI',
    'IN STOCK': 'EN STOCK',
    'MON - SUN, 10AM - 6PM': 'LUN - DIM, 10H - 18H',
    'KRONOS IS MORE THAN CLOTHING, IT\'S A MOVEMENT. BORN FROM THE STREETS, DRIVEN BY CULTURE, AND MADE FOR TRENDSETTERS. BOLD DROPS, EXCLUSIVE COLLABS, AND FEARLESS ENERGY DEFINE THOSE WHO STAY FRESH.':
      'KRONOS EST BIEN PLUS QUE DU PRÊT-À-PORTER : C’EST UN MOUVEMENT ARCHITECTURAL. NÉ DE LA RUE, PORTÉ PAR LA CULTURE ET PENSÉ POUR CEUX QUI DICTENT LES CODES. CAPSULES EXCLUSIVES, MATIÈRES NOBLES ET ÉNERGIE SANS COMPROMIS.',
    'RAWLINE IS MORE THAN CLOTHING, IT\'S A MOVEMENT. BORN FROM THE STREETS, DRIVEN BY CULTURE, AND MADE FOR TRENDSETTERS. BOLD DROPS, EXCLUSIVE COLLABS, AND FEARLESS ENERGY DEFINE THOSE WHO STAY FRESH.':
      'PLUS QU’UNE MARQUE, C’EST UNE SIGNATURE ARCHITECTURALE. NÉE DE LA CULTURE URBAINE, FAÇONNÉE PAR DES COUPES FRANCHES, DES CAPSULES RARES ET UNE ALLURE RÉSOLUMENT CONTEMPORAINE.',
    'NOT SURE WHAT TO GRAB? KEEP IT REAL WITH THE KRONOS GIFT CARD. FROM EXCLUSIVE DROPS TO EVERYDAY FITS, LET THEM CHOOSE THEIR VIBE. IT\'S MORE THAN A GIFT, IT\'S THEIR PASS INTO THE RAW WORLD.':
      'VOUS HÉSITEZ SUR LA PIÈCE IDÉALE ? OFFREZ LA CARTE CADEAU STUDIO. DES CAPSULES EXCLUSIVES AUX ESSENTIELS QUOTIDIENS, LAISSEZ-LEUR LE CHOIX DE LEUR PROPRE ALLURE. BIEN PLUS QU’UN CADEAU : UN ACCÈS PRIVÉ À L’UNIVERS KRONOS.',
    'JOIN TO RECEIVE EXCLUSIVE OFFERS AND 15% OFF YOUR FIRST ORDER.':
      'INSCRIVEZ-VOUS POUR RECEVOIR NOS OFFRES PRIVÉES ET -15 % SUR VOTRE PREMIÈRE COMMANDE.',
    'BUILT IN FRAMER BY SYED · RECREATED FOR KAYAN STUDIO':
      'CONÇU AVEC PRÉCISION POUR K STUDIO · ARCHITECTURE & ARTISANAT',
    '© 2026 RAWLINE STREETWEAR': '© 2026 KRONOS STUDIO · TOUS DROITS RÉSERVÉS',
    'MINIMAL FORM MEETS FUTURE FABRIC FOR EVERYDAY VERSATILITY AND EDGE.':
      'DES LIGNES ÉPURÉES ALLIÉES AUX TEXTILES TECHNIQUES POUR UNE ALLURE QUOTIDIENNE MAÎTRISÉE.',
    'CHARGED CUTS, LAYERED TEXTURES, AND RESTLESS CITY ENERGY.':
      'COUPES AFFIRMÉES, SUPERPOSITIONS DE MATIÈRES ET ÉNERGIE URBAINE INCISIVE.',
    'SOFT TONES, FLUID DRAPES, AND ATMOSPHERIC TEXTURES.':
      'NUANCES DOUCES, TOMBÉS FLUIDES ET TEXTURES ARCHITECTURALES.',
    'ARCHIVAL HEAVYWEIGHTS, DISTRESSED WASHES, AND INDUSTRIAL HARDWARE.':
      'PIÈCES D’ARCHIVE ÉPAISSES, DÉLAVAGES TRAVAILLÉS ET FINITIONS MÉTALLIQUES.',
    'GET YOUR ORDER DELIVERED QUICKLY, STRAIGHT TO YOUR DOOR.':
      'RECEVEZ VOTRE COMMANDE RAPIDEMENT, DIRECTEMENT À VOTRE PORTE EN 24 À 48H.',
    'FAST SHIPPING': 'LIVRAISON EXPRESS',
    '3–5 BUSINESS DAYS': '24–48H TUNISIE · 3–5 JOURS INT.',
    'RETURN YOUR ITEMS HASSLE-FREE. OUR FLEXIBLE POLICY MAKES IT SIMPLE.':
      'RETOURNEZ VOS ARTICLES SANS CONTRAINTE GRÂCE À NOTRE POLITIQUE FLEXIBLE.',
    'EASY RETURNS': 'RETOURS SIMPLIFIÉS',
    '7 DAYS FROM DELIVERY': '7 JOURS APRÈS RÉCEPTION',
    'PAY FOR YOUR ORDER WITH CONFIDENCE. YOUR DETAILS ARE ALWAYS PROTECTED.':
      'RÉGLEZ VOS ACHATS EN TOUTE SÉRÉNITÉ : VOS DONNÉES SONT CHIFFRÉES ET PROTÉGÉES.',
    'SECURE PAYMENTS': 'PAIEMENTS SÉCURISÉS',
    'BANK-GRADE SSL PROTECTION': 'PROTECTION SSL DE NIVEAU BANCAIRE',
    'GET THE HELP YOU NEED, FAST. OUR DEDICATED TEAM IS HERE FOR YOU.':
      'UNE QUESTION SUR UNE TAILLE OU UNE COMMANDE ? NOTRE ÉQUIPE VOUS RÉPOND SANS DÉLAI.',
    'CUSTOMER SUPPORT': 'SERVICE CLIENT',
    'THE MATERIALS FEEL PREMIUM AND THE CRAFTSMANSHIP IS EXCELLENT. I’VE WORN MY SHIRT COUNTLESS TIMES AND IT STILL LOOKS BRAND NEW.':
      'Les matières sont d’une qualité remarquable et les finitions impeccables. J’ai porté ma surchemise maintes fois, elle reste impeccable comme au premier jour.',
    'I’VE BEEN SEARCHING FOR EVERYDAY ESSENTIALS THAT DON’T COMPROMISE ON QUALITY, AND I FINALLY FOUND THEM HERE. THE T-SHIRT I BOUGHT IS SIMPLE, BUT THE FABRIC IS INCREDIBLY SOFT AND DURABLE.':
      'Je cherchais des essentiels du quotidien sans compromis sur la coupe ni la tenue, et je les ai enfin trouvés ici. Le coton est d’une douceur et d’une densité exceptionnelles.',
    'EVERY ORDER I’VE RECEIVED HAS BEEN CONSISTENT IN QUALITY. THE ATTENTION TO DETAIL IS WHAT MAKES THESE CLOTHES STAND OUT IN MY WARDROBE.':
      'Chaque commande confirme le même niveau d’exigence. Le soin apporté aux coutures et aux détails distingue vraiment ces pièces dans mon vestiaire.',
    'FROM THE MOMENT I UNPACKED MY ORDER, I COULD TELL THE CRAFTSMANSHIP WAS ON ANOTHER LEVEL. THE HOODIE IS SOFT, WELL-FITTED, AND FEELS BUILT TO LAST. SMALL DETAILS LIKE THE DRAWSTRINGS AND STITCHING REALLY ELEVATE IT.':
      'Dès l’ouverture du colis, on sent une confection haut de gamme. La coupe tombe parfaitement et chaque détail, des finitions aux surpiqûres, élève vraiment l’ensemble.',
    '2 WEEKS AGO': 'IL Y A 2 SEMAINES',
    '3 WEEKS AGO': 'IL Y A 3 SEMAINES',
    '1 MONTH AGO': 'IL Y A 1 MOIS'
  },
  ar: {
    'DRESS THE UNCONVENTIONAL': 'تفرّد بإطلالة خارجة عن المألوف',
    'WEAR THE': 'ارتدِ روح',
    'HYPE "RAW"': 'الأناقة الجريئة',
    'SHOP NOW': 'تسوّق الآن',
    'VIEW MORE': 'اكتشف المزيد',
    'SHOP COLLECTION': 'استعرض المجموعة',
    'GET NOW': 'احصل عليها الآن',
    'ATTENTION LIMITED STOCK': 'تنبيه: كمية محدودة جداً',
    'LIMITED STOCK': 'كمية محدودة',
    'LIMITED EDITION': 'إصدار محدود',
    'OPEN TODAY': 'مفتوح اليوم',
    'IN STOCK': 'متوفر في الفرع',
    'MON - SUN, 10AM - 6PM': 'يومياً من 10 صباحاً حتى 6 مساءً',
    'KRONOS IS MORE THAN CLOTHING, IT\'S A MOVEMENT. BORN FROM THE STREETS, DRIVEN BY CULTURE, AND MADE FOR TRENDSETTERS. BOLD DROPS, EXCLUSIVE COLLABS, AND FEARLESS ENERGY DEFINE THOSE WHO STAY FRESH.':
      'أكثر من مجرد أزياء، نحن رؤية معمارية معاصرة تنبض من قلب الشارع وتستلهم ثقافة التميّز. إصدارات محدودة، خامات فاخرة، وتفاصيل جريئة تصنع حضورك المختلف.',
    'RAWLINE IS MORE THAN CLOTHING, IT\'S A MOVEMENT. BORN FROM THE STREETS, DRIVEN BY CULTURE, AND MADE FOR TRENDSETTERS. BOLD DROPS, EXCLUSIVE COLLABS, AND FEARLESS ENERGY DEFINE THOSE WHO STAY FRESH.':
      'أكثر من مجرد ملابس، إنها حركة إبداعية تجمع بين القصات المعمارية والخامات الفاخرة لتمنحك حضوراً استثنائياً في كل إطلالة.',
    'NOT SURE WHAT TO GRAB? KEEP IT REAL WITH THE KRONOS GIFT CARD. FROM EXCLUSIVE DROPS TO EVERYDAY FITS, LET THEM CHOOSE THEIR VIBE. IT\'S MORE THAN A GIFT, IT\'S THEIR PASS INTO THE RAW WORLD.':
      'تبحث عن الهدية المثالية؟ اختر بطاقة الهدية الرقمية ودع من تحب يختار إطلالته المفضلة من أحدث الإصدارات الحصرية أو القطع الكلاسيكية اليومية.',
    'JOIN TO RECEIVE EXCLUSIVE OFFERS AND 15% OFF YOUR FIRST ORDER.':
      'اشترك للحصول على عروض حصرية وخصم 15% على طلبك الأول.',
    'BUILT IN FRAMER BY SYED · RECREATED FOR KAYAN STUDIO':
      'صُمّم بعناية لاستوديو K · أزياء معمارية وهوية عصرية',
    '© 2026 RAWLINE STREETWEAR': '© 2026 KRONOS STUDIO · جميع الحقوق محفوظة',
    'MINIMAL FORM MEETS FUTURE FABRIC FOR EVERYDAY VERSATILITY AND EDGE.':
      'تصاميم نقية تلتقي بخامات مستقبلية لتمنحك مرونة وأناقة يومية متكاملة.',
    'CHARGED CUTS, LAYERED TEXTURES, AND RESTLESS CITY ENERGY.':
      'قصّات حادة، خامات متعددة الطبقات، وطاقة حضرية لا تهدأ.',
    'SOFT TONES, FLUID DRAPES, AND ATMOSPHERIC TEXTURES.':
      'درجات لونية هادئة، انسدال ناعم، وملمس فاخر متوازن.',
    'ARCHIVAL HEAVYWEIGHTS, DISTRESSED WASHES, AND INDUSTRIAL HARDWARE.':
      'قطع أرشيفية ثقيلة الوزن بلمسات معتقة وإكسسوارات معدنية متقنة.',
    'GET YOUR ORDER DELIVERED QUICKLY, STRAIGHT TO YOUR DOOR.':
      'استلم طلبك بسرعة فائقة ومباشرة إلى باب منزلك في جميع أنحاء تونس.',
    'FAST SHIPPING': 'توصيل سريع',
    '3–5 BUSINESS DAYS': '24–48 ساعة في تونس · 3–5 أيام',
    'RETURN YOUR ITEMS HASSLE-FREE. OUR FLEXIBLE POLICY MAKES IT SIMPLE.':
      'استبدل أو أرجع مشترياتك بكل سهولة ومرونة بدون أي تعقيدات.',
    'EASY RETURNS': 'إرجاع واستبدال سهل',
    '7 DAYS FROM DELIVERY': 'خلال 7 أيام من الاستلام',
    'PAY FOR YOUR ORDER WITH CONFIDENCE. YOUR DETAILS ARE ALWAYS PROTECTED.':
      'ادفع بثقة وأمان تام؛ بياناتك مشفرة ومحمية بالكامل بأعلى المعايير.',
    'SECURE PAYMENTS': 'دفع آمن وموثوق',
    'BANK-GRADE SSL PROTECTION': 'حماية وتشفير بنكي SSL',
    'GET THE HELP YOU NEED, FAST. OUR DEDICATED TEAM IS HERE FOR YOU.':
      'فريقنا المخصص لخدمتك جاهز دائماً للرد السريع ومساعدتك في اختيار المقاس.',
    'CUSTOMER SUPPORT': 'دعم العملاء',
    'THE MATERIALS FEEL PREMIUM AND THE CRAFTSMANSHIP IS EXCELLENT. I’VE WORN MY SHIRT COUNTLESS TIMES AND IT STILL LOOKS BRAND NEW.':
      'الخامات فاخرة للغاية وجودة التفصيل مبهرة. ارتديت القميص عشرات المرات وما زال يحتفظ بأناقته وكأنه جديد تماماً.',
    'I’VE BEEN SEARCHING FOR EVERYDAY ESSENTIALS THAT DON’T COMPROMISE ON QUALITY, AND I FINALLY FOUND THEM HERE. THE T-SHIRT I BOUGHT IS SIMPLE, BUT THE FABRIC IS INCREDIBLY SOFT AND DURABLE.':
      'كنت أبحث عن قطع يومية لا تتنازل عن الجودة، ووجدتها هنا أخيراً. القماش ناعم جداً ومتين مع قصة أنيقة ومريحة.',
    'EVERY ORDER I’VE RECEIVED HAS BEEN CONSISTENT IN QUALITY. THE ATTENTION TO DETAIL IS WHAT MAKES THESE CLOTHES STAND OUT IN MY WARDROBE.':
      'كل طلب يصلني يحافظ على نفس المستوى الرفيع من الجودة. الاهتمام بأدق تفاصيل الحياكة هو ما يميز هذه القطع في خزانتي.',
    'FROM THE MOMENT I UNPACKED MY ORDER, I COULD TELL THE CRAFTSMANSHIP WAS ON ANOTHER LEVEL. THE HOODIE IS SOFT, WELL-FITTED, AND FEELS BUILT TO LAST. SMALL DETAILS LIKE THE DRAWSTRINGS AND STITCHING REALLY ELEVATE IT.':
      'منذ لحظة فتح الطرد أدركت أن الحرفية هنا من مستوى آخر. القصة متقنة جداً والخامة ناعمة ومتينة بكل تفاصيلها.',
    '2 WEEKS AGO': 'منذ أسبوعين',
    '3 WEEKS AGO': 'منذ 3 أسابيع',
    '1 MONTH AGO': 'منذ شهر واحد'
  }
};

export function translateEditorialCopy(text = '', lang = 'en') {
  if (!text || lang === 'en') return text;
  const normalized = String(text).trim().replace(/\s+/g, ' ').toUpperCase();
  const hit = EDITORIAL_MAP[lang]?.[normalized];
  if (hit) return hit;

  // Smart dynamic rebranding replacement if KRONOS/RAWLINE wording varies
  const swapBrand = normalized.replace(/RAWLINE/g, 'KRONOS');
  if (EDITORIAL_MAP[lang]?.[swapBrand]) return EDITORIAL_MAP[lang][swapBrand];

  // Dynamic Drop edition helper: "DROP 01 — 350 UNITS" -> FR/AR
  if (/^DROP\s+\d+/i.test(normalized)) {
    const m = normalized.match(/^DROP\s+(\d+)\s*[—-]\s*(.+)$/i);
    if (m) {
      if (lang === 'fr') return `CAPSULE ${m[1]} — ${m[2].replace('UNITS', 'UNITÉS').replace('ARCHIVAL CAPSULE', 'Édition Archive')}`;
      if (lang === 'ar') return `الإصدار ${m[1]} — ${m[2].replace('UNITS', 'قطعة').replace('ARCHIVAL CAPSULE', 'مجموعة الأرشيف')}`;
    }
  }
  if (/SOLD OUT \d+%/i.test(normalized)) {
    const pct = normalized.match(/(\d+%)/)?.[1] || '';
    if (lang === 'fr') return `ÉPUISÉ À ${pct}`;
    if (lang === 'ar') return `نفد بنسبة ${pct}`;
  }
  if (normalized === 'LIVE NOW') {
    return lang === 'fr' ? 'DISPONIBLE' : 'متاح الآن';
  }
  if (normalized === 'LIMITED RESTOCK') {
    return lang === 'fr' ? 'RÉASSORT LIMITÉ' : 'إعادة توفير محدودة';
  }
  return text;
}

export function buildLocalizedChatbotWelcome(brandName = 'K', count = 56, lang = 'en') {
  const safeBrand = brandName || 'K';
  const pieceCount = count || 56;
  if (lang === 'fr') {
    return `Bienvenue chez **${safeBrand}** ! Décrivez-moi l'occasion, la coupe (**HOMME** ou **FEMME**) ou la pièce souhaitée — nos **${pieceCount}+ silhouettes**, le **Labo d'Essayage 3D**, la **livraison express 24–48h en Tunisie** (offerte dès **300 DT**) ou vos avantages comme **KRONOS15**.`;
  }
  if (lang === 'ar') {
    return `أهلاً بك في **${safeBrand}**! أخبرني بالمناسبة أو الإطلالة التي تبحث عنها (**رجالي** أو **نسائي**) من بين **+${pieceCount} قطعة منتقاة** — وسأساعدك في التنسيق، اختيار المقاس عبر **مختبر القياس 3D**، **التوصيل السريع في تونس خلال 24–48 ساعة** (مجاني فوق **300 DT**)، أو الاستفادة من كود **KRONOS15**.`;
  }
  return `Welcome to **${safeBrand}**! Tell me the mood, fit (**MEN** or **WOMEN**), or piece you have in mind — from **${pieceCount}+ curated silhouettes** and **3D Fitting Lab** sizing to **24–48h Tunisia express delivery** (complimentary over **300 DT**) and offers like **KRONOS15**.`;
}


