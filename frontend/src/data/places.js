// Places shown on the maps. Sources are listed in src/data/sources.js.
// `role`: hub = main producing district, grower = significant producer, research = where it started.

export const DISTRICTS = [
  { id: "jhenaidah", lat: 23.545, lon: 89.153, role: "hub", en: "Jhenaidah", bn: "ঝিনাইদহ",
    note: { en: "The main hub, about 39% of the country's dragon fruit", bn: "প্রধান কেন্দ্র, দেশের প্রায় ৩৯% ড্রাগন ফল" } },
  { id: "chuadanga", lat: 23.64, lon: 88.841, role: "grower", en: "Chuadanga", bn: "চুয়াডাঙ্গা",
    note: { en: "Major producer in the southwest", bn: "দক্ষিণ-পশ্চিমের বড় উৎপাদক" } },
  { id: "jashore", lat: 23.166, lon: 89.209, role: "grower", en: "Jashore", bn: "যশোর",
    note: { en: "Major producer in the southwest", bn: "দক্ষিণ-পশ্চিমের বড় উৎপাদক" } },
  { id: "kushtia", lat: 23.901, lon: 89.12, role: "grower", en: "Kushtia", bn: "কুষ্টিয়া",
    note: { en: "Among the most suitable lands for dragon fruit", bn: "ড্রাগন চাষের জন্য সবচেয়ে উপযোগী জমির একটি" } },
  { id: "natore", lat: 24.41, lon: 88.987, role: "grower", en: "Natore", bn: "নাটোর",
    note: { en: "Major producer in the north", bn: "উত্তরের বড় উৎপাদক" } },
  { id: "chapainawabganj", lat: 24.596, lon: 88.271, role: "grower", en: "Chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ",
    note: { en: "Growing fast alongside mango orchards", bn: "আম বাগানের পাশাপাশি দ্রুত বাড়ছে" } },
  { id: "lalmonirhat", lat: 25.917, lon: 89.445, role: "grower", en: "Lalmonirhat", bn: "লালমনিরহাট",
    note: { en: "Farmers finding success in the far north", bn: "দূর উত্তরে কৃষকেরা সফল হচ্ছেন" } },
  { id: "bandarban", lat: 22.195, lon: 92.218, role: "grower", en: "Bandarban", bn: "বান্দরবান",
    note: { en: "Major producer in the hills", bn: "পাহাড়ি এলাকার বড় উৎপাদক" } },
  { id: "mymensingh", lat: 24.756, lon: 90.406, role: "research", en: "Mymensingh", bn: "ময়মনসিংহ",
    note: { en: "BAU Germplasm Centre, where plants from Thailand and Vietnam arrived in 2007",
            bn: "বাকৃবি জার্মপ্লাজম সেন্টার, যেখানে ২০০৭ সালে থাইল্যান্ড ও ভিয়েতনাম থেকে চারা আসে" } },
];

// Names must match world-atlas (Natural Earth) country names.
export const COUNTRIES = [
  { name: "Mexico", en: "Mexico", bn: "মেক্সিকো", note: { en: "Native home of the wild cactus", bn: "বুনো ক্যাকটাসের আদি নিবাস" } },
  { name: "Colombia", en: "Colombia", bn: "কলম্বিয়া", note: { en: "Native range, yellow pitaya growers", bn: "আদি এলাকা, হলুদ পিতায়া চাষ" } },
  { name: "Ecuador", en: "Ecuador", bn: "ইকুয়েডর", note: { en: "Grower and exporter", bn: "চাষি ও রপ্তানিকারক দেশ" } },
  { name: "Vietnam", en: "Vietnam", bn: "ভিয়েতনাম", note: { en: "The world's leading producer and exporter", bn: "বিশ্বের শীর্ষ উৎপাদক ও রপ্তানিকারক" } },
  { name: "China", en: "China", bn: "চীন", note: { en: "Large and fast growing producer", bn: "বড় ও দ্রুত বাড়তে থাকা উৎপাদক" } },
  { name: "Thailand", en: "Thailand", bn: "থাইল্যান্ড", note: { en: "Commercial grower; early plants for Bangladesh came from here", bn: "বাণিজ্যিক চাষি; বাংলাদেশের প্রথম চারার উৎস" } },
  { name: "Malaysia", en: "Malaysia", bn: "মালয়েশিয়া", note: { en: "Commercial grower", bn: "বাণিজ্যিক চাষি দেশ" } },
  { name: "Indonesia", en: "Indonesia", bn: "ইন্দোনেশিয়া", note: { en: "Commercial grower", bn: "বাণিজ্যিক চাষি দেশ" } },
  { name: "Philippines", en: "Philippines", bn: "ফিলিপাইন", note: { en: "Brought by the Spanish in the 1500s", bn: "১৫০০ সালের দিকে স্প্যানিশরা নিয়ে আসে" } },
  { name: "Taiwan", en: "Taiwan", bn: "তাইওয়ান", note: { en: "Commercial grower", bn: "বাণিজ্যিক চাষি দেশ" } },
  { name: "Israel", en: "Israel", bn: "ইসরায়েল", note: { en: "Commercial grower", bn: "বাণিজ্যিক চাষি দেশ" } },
  { name: "Sri Lanka", en: "Sri Lanka", bn: "শ্রীলঙ্কা", note: { en: "Commercial grower", bn: "বাণিজ্যিক চাষি দেশ" } },
  { name: "India", en: "India", bn: "ভারত", note: { en: "Fast growing producer", bn: "দ্রুত বাড়তে থাকা উৎপাদক" } },
  { name: "Bangladesh", en: "Bangladesh", bn: "বাংলাদেশ", note: { en: "From 5 hectares in 2014-15 to 695 hectares in 2020-21", bn: "২০১৪-১৫ সালে ৫ হেক্টর থেকে ২০২০-২১ সালে ৬৯৫ হেক্টর" } },
  { name: "Australia", en: "Australia", bn: "অস্ট্রেলিয়া", note: { en: "Commercial grower", bn: "বাণিজ্যিক চাষি দেশ" } },
];
