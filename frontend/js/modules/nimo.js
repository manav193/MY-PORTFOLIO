/**
 * NIMO — Portfolio Assistant (v3.0 Multilingual Intent & NLU Engine)
 * Local-first, website-aware assistant with intent scoring, entity extraction,
 * 75+ developer glossary terms, contextual follow-up memory, and multilingual support
 * (English, Devanagari Hindi, and Hinglish / Roman Hindi).
 */

import { fetchNimoBackendReply } from '../services/nimo-api.js';

export const NIMO_PERSONA = {
  name: 'NIMO',
  identity: 'female AI companion & system intelligence',
  gender: 'female',
  tone: 'smart, confident, warm, slightly futuristic, witty',
  voiceGender: 'female'
};

// ==========================================
// 1. PORTFOLIO & PROJECT ENTITY DATABASE
// ==========================================

const PROJECTS_DB = [
  {
    id: 'arcade-os',
    name: 'MY-PORTFOLIO / ArcadeOS',
    aliases: ['arcade os', 'arcadeos', 'arcade', 'cabinet', 'games os', 'retro games', 'game os', 'आर्केड'],
    category: 'system',
    type: 'Interactive portfolio system',
    tech: ['Vanilla JS', 'Canvas 2D', 'Web Audio API', 'PWA', 'Gamepad API'],
    summary: 'A modular browser-based operating system built with Vanilla JS, featuring 3 playable retro games, 2 creative tools, persistent profiles, cabinet customization, and unified input handlers.',
    caseStudy: 'project-arcade-os.html',
    liveUrl: '#intro-sequence'
  },
  {
    id: 'nimo',
    name: 'NIMO Assistant',
    aliases: ['nimo assistant', 'nimo ai', 'nimo project', 'nimo case study', 'nimo page', 'नीमो'],
    category: 'system',
    type: 'Interactive assistant system',
    tech: ['Vanilla JS', 'Intent NLU', 'Context Resolver', 'Multilingual', 'ES Modules'],
    summary: 'A local-first, website-aware portfolio assistant that understands natural-language navigation, project questions, case-study context, developer concepts, and trilingual English/Hindi/Hinglish queries.',
    caseStudy: 'project-nimo.html',
    liveUrl: '#nimo-widget'
  },
  {
    id: 'toolverse',
    name: 'ToolVerse',
    aliases: ['toolverse', 'tollverse', 'tool verse', 'tools', 'pdf tools', 'pwa tools', 'utility tools', 'टूलवर्स'],
    category: 'web',
    type: 'Web application / PWA',
    tech: ['HTML', 'CSS', 'Vanilla JS', 'Node SSG', 'Playwright'],
    summary: 'A privacy-first PWA delivering 70+ PDF, image, text, developer, student, and calculator tools with private local browser processing.',
    caseStudy: 'project-toolverse.html',
    liveUrl: 'https://tool-verse-theta.vercel.app/'
  },
  {
    id: 'selfyy',
    name: 'SELFYY',
    aliases: ['selfyy', 'selfy', 'cinematic memory', 'memory site', 'personal web platform', 'सेलफ़ी'],
    category: 'web',
    type: 'Personal web platform',
    tech: ['Vanilla JS', 'CSS Grid', 'LocalStorage', 'Web Share', 'Vercel'],
    summary: 'A cinematic memory website platform for building personal birthday, wedding, invitation, and portfolio experiences.',
    caseStudy: 'project-selfyy.html',
    liveUrl: 'https://selfyy.vercel.app/'
  },
  {
    id: 'shift-zero',
    name: 'SHIFT-ZERO',
    aliases: ['shift zero', 'shiftzero', 'godot game', 'hud design', 'gravity shift', 'शिफ्ट जीरो'],
    category: 'game',
    type: 'Game architecture & HUD design',
    tech: ['Godot 4', 'GDScript', 'Python', 'CI', 'Architecture'],
    summary: 'A mobile-first Godot game foundation for one-touch gravity shifting and rule-changing modifiers paired with a high-contrast HUD UI language.',
    caseStudy: 'project-shift-zero.html'
  },
  {
    id: 'love',
    name: 'LOVE',
    aliases: ['love', 'love journey', 'narrative site', 'narrative experiment', 'लव जर्नी'],
    category: 'web',
    type: 'Narrative web experiment',
    tech: ['HTML', 'CSS Grid', 'Canvas', 'Web Audio'],
    summary: 'An immersive narrative website exploring paced scrolling, photography, ambient audio, and personal timeline storytelling.',
    caseStudy: 'project-love-journey.html'
  },
  {
    id: 'velora-bites',
    name: 'Velora Bites',
    aliases: ['velora bites', 'velora', 'restaurant ui', 'dining ui', 'luxury restaurant', 'वेलोरा बाइट्स', 'रेस्टोरेंट बाइट्स'],
    category: 'ui',
    type: 'UI/UX design prototype',
    tech: ['Figma', 'Responsive UI', 'Design Systems', 'Prototyping'],
    summary: 'A responsive fine-dining interface concept that translates luxury hospitality into a clear editorial reservation journey.',
    caseStudy: 'project-velora-bites.html'
  },
  {
    id: 'nintendo',
    name: 'Nintendo UI',
    aliases: ['nintendo', 'nintendo ui', 'nintedno', 'nintendo switch', 'switch ui', 'nintendo os', 'console ui', 'निंटेंडो'],
    category: 'ui',
    type: 'Gaming UI concept',
    tech: ['Figma', 'Console UI', 'UX Design', 'Design Systems'],
    summary: 'A conceptual redesign of the Nintendo console user interface, modernizing visual density, navigation speed, and spatial interactions.',
    caseStudy: 'project-nintendo.html'
  },
  {
    id: 'nike',
    name: 'Nike Website UI',
    aliases: ['nike', 'nike ui', 'nik ui', 'nike air zoom', 'pegasus 41', 'nike website', 'e-commerce ui', 'नाइकी'],
    category: 'ui',
    type: 'E-commerce UI concept',
    tech: ['Figma', 'E-Commerce', 'Sports Branding', 'Motion UI'],
    summary: 'A high-performance e-commerce interaction model focused on sports branding, dynamic typography, and product storytelling.',
    caseStudy: 'project-nike.html'
  }
];

const PORTFOLIO_KNOWLEDGE = {
  owner: {
    name: 'Manav Agarwal',
    role: 'Creative Frontend Developer',
    location: 'Hyderabad, India',
    availability: 'Open to junior frontend roles and freelance projects',
    bio: 'Manav Agarwal is a Creative Frontend Developer based in Hyderabad, India. He specializes in high-performance web systems, product UI/UX design, modular frontend architecture, and interactive web experiences.',
    skills: [
      'Frontend Engineering (HTML5, Vanilla JS, ES Modules, CSS Grid)',
      'UI/UX Design Systems (Figma, Responsive Systems, Motion Interaction)',
      'Web Applications & PWA Architecture (Node SSG, Playwright)',
      'Game Architecture & HUD Systems (Godot, Canvas, Web Audio API)'
    ]
  },
  contact: {
    email: 'monographicalpixel@gmail.com',
    github: 'https://github.com/manav193',
    resume: 'Manav-Agarwal-Resume.pdf'
  },
  website: {
    title: 'Manav Agarwal Portfolio & Arcade OS',
    description: 'This is Manav Agarwal\'s creative technologist portfolio — a high-performance web system featuring product design case studies, interactive UI explorations, a complete GitHub archive, and an integrated retro Arcade OS cabinet.'
  }
};

// ==========================================
// 2. EXPANDED DEVELOPER GLOSSARY DATABASE (75+ CONCEPTS)
// ==========================================

const GLOSSARY_DB = {
  dom: {
    en: "The DOM (Document Object Model) is an in-memory tree representation of an HTML document, allowing JavaScript to dynamically access, manipulate, and update page elements.",
    hinglish: "DOM (Document Object Model) HTML document ka ek in-memory tree structure hota hai, jiske zariye JavaScript page elements ko dynamically access aur update karti hai.",
    hi: "DOM (Document Object Model) किसी HTML दस्तावेज़ का इन-मेमोरी ट्री स्ट्रक्चर होता है, जिससे JavaScript पेज के एलिमेंट्स को डायनामिक रूप से एक्सेस और अपडेट करती है।"
  },
  bom: {
    en: "The BOM (Browser Object Model) provides objects to interact with the browser window environment (e.g., window, location, navigator, history).",
    hinglish: "BOM (Browser Object Model) browser window environment (jaise window, location, navigator) ke saath interact karne ke liye APIs deta hai.",
    hi: "BOM (Browser Object Model) ब्राउज़र विंडो के माहौल (जैसे window, location, navigator) से इंटरैक्ट करने के लिए ऑब्जेक्ट्स प्रदान करता है।"
  },
  html: {
    en: "HTML (HyperText Markup Language) is the standard markup language used to structure web pages and define content such as headings, paragraphs, links, and media.",
    hinglish: "HTML (HyperText Markup Language) web pages ki structure banane ke liye standard markup language hai. Iska use headings, paragraphs, links aur media define karne ke liye hota hai.",
    hi: "HTML (HyperText Markup Language) वेब पेजों का ढांचा (structure) बनाने की स्टैंडर्ड भाषा है। इसका इस्तेमाल टेक्स्ट, लिंक्स और मीडिया को व्यवस्थित करने के लिए किया जाता है।"
  },
  css: {
    en: "CSS (Cascading Style Sheets) controls the visual presentation, layout, colors, typography, and responsive design of web pages.",
    hinglish: "CSS (Cascading Style Sheets) website ki visual styling, colors, layout, fonts aur responsive design ko control karta hai.",
    hi: "CSS (Cascading Style Sheets) वेब पेजों के स्टाइल, रंग, लेआउट और रिस्पॉन्सिव डिज़ाइन को कंट्रोल करता है।"
  },
  js: {
    en: "JavaScript (JS) is the core programming language of the web that adds dynamic interactivity, logic, data fetching, and animations to websites.",
    hinglish: "JavaScript (JS) web ki main programming language hai jo websites mein dynamic logic, animations, user interaction aur data fetching add karti hai.",
    hi: "JavaScript (JS) वेब की मुख्य प्रोग्रामिंग भाषा है जो वेबसाइट्स में डायनामिक लॉजिक, एनिमेशन और इंटरएक्टिव फीचर्स जोड़ती है।"
  },
  javascript: {
    en: "JavaScript (JS) is the core programming language of the web that adds dynamic interactivity, logic, data fetching, and animations to websites.",
    hinglish: "JavaScript (JS) web ki main programming language hai jo websites mein dynamic logic, animations, user interaction aur data fetching add karti hai.",
    hi: "JavaScript (JS) वेब की मुख्य प्रोग्रामिंग भाषा है जो वेबसाइट्स में डायनामिक लॉजिक, एनिमेशन और इंटरएक्टिव फीचर्स जोड़ती है।"
  },
  typescript: {
    en: "TypeScript is a strongly-typed syntactic superset of JavaScript that adds static type checking to catch errors early during development.",
    hinglish: "TypeScript JavaScript ka ek typed superset hai jo code mein static types add karke development ke dauran hi errors pakadne mein help karta hai.",
    hi: "TypeScript, JavaScript का एक टाइप्ड वर्जन है जो डेवलपमेंट के दौरान कोड में एरर्स को जल्दी पकड़ने में मदद करता है।"
  },
  frontend: {
    en: "Frontend development focuses on everything users see and interact with directly in their browser, using HTML, CSS, JavaScript, and UI frameworks.",
    hinglish: "Frontend development mein wo sab aata hai jo user directly browser mein dekhta hai — jaise HTML, CSS, JavaScript aur UI interfaces.",
    hi: "Frontend डेवलपमेंट में वह सब शामिल है जिसे यूजर सीधे ब्राउज़र में देखता है और इस्तेमाल करता है, जैसे HTML, CSS और UI डिज़ाइन।"
  },
  backend: {
    en: "Backend development manages server-side logic, databases, authentication, API endpoints, and server infrastructure.",
    hinglish: "Backend development server-side logic, databases, APIs, authentication aur server infrastructure ko handle karta hai.",
    hi: "Backend डेवलपमेंट सर्वर-साइड लॉजिक, डेटाबेस, एपीआई और यूज़र ऑथेंटिकेशन को मैनेज करता है।"
  },
  fullstack: {
    en: "Full-stack development encompasses both frontend (client-side user interfaces) and backend (server-side logic and databases).",
    hinglish: "Full-stack development mein frontend (client UI) aur backend (server & database) dono shamil hote hain.",
    hi: "Full-stack डेवलपमेंट में फ़्रंटएंड (UI) और बैकएंड (सर्वर व डेटाबेस) दोनों की इंजीनियरिंग शामिल होती है।"
  },
  webapp: {
    en: "A website primarily delivers content for reading and browsing, while a web application provides rich interactive software features and actions directly in the browser.",
    hinglish: "Website zyadatar reading/browsing content deliver karti hai, jabki Web App browser mein direct interactive software actions aur functionality provide karti hai.",
    hi: "वेबसाइट मुख्य रूप से कंटेंट पढ़ने के लिए होती है, जबकि वेब ऐप (Web App) ब्राउज़र में सॉफ्टवेयर की तरह इंटरैक्टिव फीचर्स और काम पूरा करती है।"
  },
  responsive: {
    en: "Responsive design ensures layouts automatically adjust and scale smoothly across mobile phones, tablets, and desktop displays.",
    hinglish: "Responsive design ka matlab hai ki website ka layout mobile, tablet aur desktop sabhi screens par perfectly fit aur clear dikhe.",
    hi: "रिस्पॉन्सिव डिज़ाइन का मतलब है कि वेब लेआउट मोबाइल, टैबलेट और डेस्कटॉप सभी स्क्रीन पर अपने-आप सही से सेट हो जाता है।"
  },
  mobilefirst: {
    en: "Mobile-first design is a strategy where web interfaces are designed for small screens first, then progressively enhanced for larger desktop displays.",
    hinglish: "Mobile-first design ek aisi approach hai jahan interface pehle small mobile screens ke liye design kiya jata hai, fir desktop ke liye adjust hota hai.",
    hi: "मोबाइल-फ़र्स्ट डिज़ाइन में इंटरफ़ेस को पहले छोटी मोबाइल स्क्रीन के लिए डिज़ाइन किया जाता है, फिर बड़ी स्क्रीन के लिए बढ़ाया जाता है।"
  },
  ui: {
    en: "UI (User Interface) refers to visual elements of a digital product, including buttons, typography, colors, layouts, and input controls.",
    hinglish: "UI (User Interface) digital product ke visual elements hote hain — jaise buttons, fonts, colors aur screen layout.",
    hi: "UI (User Interface) किसी डिजिटल प्रोडक्ट के विजुअल एलिमेंट्स (जैसे बटन, फ़ॉन्ट, कलर और लेआउट) को कहा जाता है।"
  },
  ux: {
    en: "UX (User Experience) focuses on the overall usability, clarity, and satisfaction of a user's journey through an application.",
    hinglish: "UX (User Experience) app ko use karne ke overall experience, ease, simplicity aur user satisfaction par focus karta hai.",
    hi: "UX (User Experience) इस बात पर ध्यान देता है कि यूज़र के लिए किसी ऐप का इस्तेमाल करना कितना आसान, सहज और संतोषजनक है।"
  },
  api: {
    en: "An API (Application Programming Interface) is a set of defined rules allowing different software applications to communicate and exchange data.",
    hinglish: "API (Application Programming Interface) alag-alag software applications ke beech data aur functionality share karne ka ek standard zariya hai.",
    hi: "API (Application Programming Interface) एक नियम-सेट है जिससे दो अलग-अलग सॉफ्टवेयर आपस में डेटा का आदान-प्रदान करते हैं।"
  },
  rest: {
    en: "REST (Representational State Transfer) is a standard architectural style for designing networked web services using HTTP methods (GET, POST, PUT, DELETE).",
    hinglish: "REST ek standard web service architectural style hai jo HTTP methods (GET, POST, PUT, DELETE) ke zariye APIs design karne ke liye use hota hai.",
    hi: "REST नेटवर्क वेब सर्विसेज बनाने का एक मानक तरीका है जो HTTP मेथड्स (GET, POST, PUT, DELETE) का उपयोग करता है।"
  },
  graphql: {
    en: "GraphQL is a query language for APIs that allows clients to request exactly the data structure they need, avoiding over-fetching.",
    hinglish: "GraphQL APIs ke liye ek query language hai jisse client wahi exact data maang sakta hai jo use chahiye, bina extra data fetch kiye.",
    hi: "GraphQL एपीआई के लिए एक क्वेरी लैंग्वेज है जिससे क्लाइंट अपनी ज़रूरत का सटीक डेटा ही रिक्वेस्ट कर सकता है।"
  },
  json: {
    en: "JSON (JavaScript Object Notation) is a lightweight data format used for transmitting structured data between web servers and browsers.",
    hinglish: "JSON (JavaScript Object Notation) server aur browser ke beech structured data bhejni ke liye lightweight text format hai.",
    hi: "JSON (JavaScript Object Notation) सर्वर और ब्राउज़र के बीच डेटा ट्रांसफर करने का एक हल्का और सुव्यवस्थित फ़ॉर्मेट है।"
  },
  git: {
    en: "Git is a distributed version control system that tracks source code changes over time, allowing developers to collaborate and roll back code.",
    hinglish: "Git ek distributed version control system hai jo code changes ko track karta hai aur developers ko team collaboration aur code rollback ki suvidha deta hai.",
    hi: "Git एक वर्ज़न कंट्रोल सिस्टम है जो कोड में किए गए बदलावों को ट्रैक करता है और डेवलपर्स को एक साथ काम करने में मदद करता है।"
  },
  github: {
    en: "GitHub is a cloud-based hosting platform for Git repositories, providing code sharing, pull requests, issue tracking, and CI/CD automation.",
    hinglish: "GitHub Git repositories ko cloud par host karne ka platform hai jahan code sharing, issues tracking aur team collaboration hota hai.",
    hi: "GitHub क्लाउड आधारित प्लेटफॉर्म है जहाँ कोड रिपॉजिटरीज़ को होस्ट, शेयर और सहयोग के साथ मैनेज किया जाता है।"
  },
  npm: {
    en: "npm (Node Package Manager) is the official package registry and command-line manager for installing open-source JavaScript packages and tools.",
    hinglish: "npm (Node Package Manager) JavaScript open-source packages aur libraries install aur manage karne ka official tool hai.",
    hi: "npm (Node Package Manager) JavaScript लाइब्रेरीज़ और पैकेज इंस्टॉल व मैनेज करने का टूल है।"
  },
  nodejs: {
    en: "Node.js is a JavaScript runtime environment allowing developers to execute JavaScript code on servers outside the web browser.",
    hinglish: "Node.js ek JavaScript runtime environment hai jo browser ke bahar server par JavaScript execute karne ki permission deta hai.",
    hi: "Node.js एक runtime environment है जो ब्राउज़र के बाहर सर्वर पर JavaScript कोड चलाने की अनुमति देता है।"
  },
  react: {
    en: "React is an open-source JavaScript library developed by Meta for building component-based user interfaces.",
    hinglish: "React Meta dwaara banayi gayi ek open-source JavaScript library hai jo component-based user interfaces banane ke liye use hoti hai.",
    hi: "React एक open-source JavaScript लाइब्रेरी है जिसका उपयोग कंपोनेंट-बेस्ड यूजर इंटरफेस बनाने के लिए किया जाता है।"
  },
  nextjs: {
    en: "Next.js is a full-stack React framework enabling server-side rendering, static site generation, and optimized web performance.",
    hinglish: "Next.js ek React framework hai jo Server-Side Rendering (SSR), Static Site Generation (SSG) aur high web performance provide karta hai.",
    hi: "Next.js एक लोकप्रिय React फ़्रेमवर्क है जो सर्वर-साइड रेंडरिंग (SSR) और फ़ास्ट वेब परफ़ॉरमेंस देता है।"
  },
  pwa: {
    en: "A Progressive Web App (PWA) uses modern web APIs to deliver native app experiences, including offline support and installability.",
    hinglish: "Progressive Web App (PWA) browser ke zariye offline caching aur installable app-like experience provide karti hai.",
    hi: "Progressive Web App (PWA) वेब पेजों को ऐप जैसी सुविधाएं (ऑफ़लाइन एक्सेस और होम स्क्रीन इंस्टॉल) देती है।"
  },
  serviceworkers: {
    en: "Service Workers are background scripts that act as network proxies, enabling offline caching, push notifications, and background sync for PWAs.",
    hinglish: "Service Workers background scripts hote hain jo network proxy ki tarah kaam karke PWAs ko offline caching aur push notifications empower karte hain.",
    hi: "Service Workers बैकग्राउंड स्क्रिप्ट्स हैं जो PWAs के लिए ऑफ़लाइन कैशिंग और पुश नोटिफिकेशन सक्षम करते हैं।"
  },
  canvas: {
    en: "The HTML5 Canvas API enables high-performance 2D dynamic graphics and pixel manipulation directly in JavaScript.",
    hinglish: "HTML5 Canvas API JavaScript ke zariye browser mein direct 2D graphics render karne aur pixel animation ke liye use hoti hai.",
    hi: "HTML5 Canvas API से ब्राउज़र में सीधे 2D डायनामिक ग्राफिक्स और पिक्सेल एनिमेशन बनाए जाते हैं।"
  },
  gamepadapi: {
    en: "The Gamepad API allows web applications to detect and read inputs from USB and Bluetooth game controllers in real time.",
    hinglish: "Gamepad API browser ko Bluetooth aur USB game controllers ke input buttons real-time mein read karne ki capability deta hai.",
    hi: "Gamepad API से ब्राउज़र गेम कंट्रोलर (जैसे USB/Bluetooth Gamepads) के इनपुट को रियल-टाइम में प्रोसेस करता है।"
  },
  webaudioapi: {
    en: "The Web Audio API is a powerful browser API for synthesizing, processing, and playing audio directly in JavaScript.",
    hinglish: "Web Audio API JavaScript ke zariye browser mein custom audio synthesis, sound effects aur dynamic audio processing handle karti hai.",
    hi: "Web Audio API ब्राउज़र में साउंड इफेक्ट्स और ऑडियो सिंथेसिस को सीधे कोड से प्रोसेस करने की सुविधा देती है।"
  },
  docker: {
    en: "Docker is a containerization platform that packages software and its dependencies into isolated containers for consistent deployment.",
    hinglish: "Docker software aur uski sabhi dependencies ko isolated containers mein package karta hai taaki har environment mein consistent run kare.",
    hi: "Docker सॉफ्टवेयर और उसकी ज़रूरतों को एक डिब्बे (Container) में पैक करता है ताकि वह हर जगह एक जैसा चले।"
  },
  cicd: {
    en: "CI/CD (Continuous Integration / Continuous Deployment) automates building, testing, and deploying code changes whenever developers push updates.",
    hinglish: "CI/CD code changes push karne par automatic build, testing aur server deployment ki automation process hai.",
    hi: "CI/CD स्वचालित प्रक्रिया है जो नया कोड पुश होने पर टेस्ट और डिप्लॉयमेंट को ऑटोमैटिक पूरा करती है।"
  }
};

// ==========================================
// 3. MULTILINGUAL & NORMALIZATION ENGINE
// ==========================================

let sessionLanguageLocked = null; // 'en' | 'hi' | 'hinglish'
let explicitCommandActive = false;

function setSessionLanguage(lang, explicit = false) {
  if (['en', 'hi', 'hinglish'].includes(lang)) {
    sessionLanguageLocked = lang;
    explicitCommandActive = explicit;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('nimo_language_pref', lang);
    }
  }
}

function getSessionLanguage() {
  const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nimo_language_pref') : null;
  return sessionLanguageLocked || stored || 'en';
}

function detectLanguageStyle(rawInput) {
  const text = rawInput.trim();

  // Explicit language commands check
  if (/\b(english\s*(mein|me|in)|speak\s*english|answer\s*in\s*english|reply\s*in\s*english)\b/i.test(text)) {
    setSessionLanguage('en', true);
    return { lang: 'en', explicitCommand: true };
  }
  if (/\b(hindi\s*(mein|me|in)|speak\s*hindi|reply\s*in\s*hindi|हिंदी\s*में)\b/i.test(text)) {
    setSessionLanguage('hi', true);
    return { lang: 'hi', explicitCommand: true };
  }
  if (/\b(hinglish\s*(mein|me|in)|speak\s*hinglish|roman\s*hindi)\b/i.test(text)) {
    setSessionLanguage('hinglish', true);
    return { lang: 'hinglish', explicitCommand: true };
  }

  // 1. Devanagari Script Detection
  if (/[\u0900-\u097F]/.test(text)) {
    if (!explicitCommandActive) setSessionLanguage('hi');
    return { lang: explicitCommandActive ? getSessionLanguage() : 'hi', explicitCommand: false };
  }

  // 2. Hinglish / Roman Hindi STOPWORDS Detection
  const hinglishTokens = [
    'kya', 'kaise', 'kese', 'kaha', 'kahan', 'kisne', 'kisnay', 'mujhe', 'muje', 'batao', 'btao',
    'dikhao', 'dikha', 'kholo', 'le chalo', 'le jao', 'ye', 'yeh', 'iska', 'isme', 'mera', 'tum',
    'aap', 'kaun', 'kon', 'par', 'pe', 'mai', 'main', 'hu', 'hoon', 'hai', 'he', 'h', 'wala', 'wali',
    'wale', 'kisne banaya', 'kisne banayi', 'bataen', 'kya hai', 'kya hota'
  ];

  const lowerText = text.toLowerCase();
  const hasHinglishToken = hinglishTokens.some(token => {
    return new RegExp(`\\b${token}\\b`, 'i').test(lowerText);
  });

  if (hasHinglishToken) {
    if (!explicitCommandActive) setSessionLanguage('hinglish');
    return { lang: explicitCommandActive ? getSessionLanguage() : 'hinglish', explicitCommand: false };
  }

  // 3. If no Devanagari script and no Hinglish tokens are present:
  if (explicitCommandActive) {
    return { lang: getSessionLanguage(), explicitCommand: false };
  }

  setSessionLanguage('en');
  return { lang: 'en', explicitCommand: false };
}

// Devanagari to Roman transliteration map for intent matching
const DEVANAGARI_MAP = [
  [/एचटीएमएल|एटीएमएल/g, 'html'],
  [/सीएसएस/g, 'css'],
  [/जावास्क्रिप्ट|जेएस/g, 'javascript'],
  [/टाइपस्क्रिप्ट/g, 'typescript'],
  [/प्रोजेक्ट्स|प्रोजेक्ट/g, 'projects'],
  [/आर्केड/g, 'arcade'],
  [/मुझे/g, 'mujhe'],
  [/पर/g, 'par'],
  [/ले/g, 'le'],
  [/चलो|चलिए/g, 'chalo'],
  [/मैं/g, 'main'],
  [/अभी/g, 'abhi'],
  [/क्या/g, 'kya'],
  [/देख/g, 'dekh'],
  [/रहा/g, 'raha'],
  [/हूँ|हूं/g, 'hu'],
  [/यह|ये/g, 'ye'],
  [/वेबसाइट|साइट/g, 'website'],
  [/किसने/g, 'kisne'],
  [/बनाई|बनाया/g, 'banaya'],
  [/खोलो/g, 'kholo'],
  [/दिखाओ|दिखाइए/g, 'dikhao'],
  [/कौन/g, 'kaun'],
  [/कहाँ|कहां/g, 'kahan'],
  [/कैसे/g, 'kaise'],
  [/है|हैं/g, 'hai'],
  [/इस/g, 'is'],
  [/इसमें/g, 'isme'],
  [/इसका/g, 'iska'],
  [/सारांश|ओवरव्यू/g, 'summary'],
  [/बताओ|बताइए/g, 'batao'],
  [/मानव/g, 'manav'],
  [/नमस्ते|हेलो/g, 'hello']
];

const HINGLISH_NORMALIZATION_MAP = [
  // Full phrase mappings FIRST to avoid partial token corruption
  [/\bnimo\s*(kisne|kisnay)\s*(banaya|banayi|created|made)\b/g, 'who made nimo'],
  [/\b(ye|yeh|is)?\s*(website|site|portfolio)?\s*(kisne|kisnay)\s*(banayi|banaya)\b|\bkisne\s*banaya\b|\bkisne\s*banayi\b|\bwebsite kisne banayi\b/g, 'who built this website'],
  [/\b(mujhe)?\s*(projects|work|selected work)\s*(section)?\s*(par|pe)?\s*(le chalo|le jao|dikhao|dikha|chalo|jao)\b|\bprojects dikhao\b|\bproject dikhao\b/g, 'go to projects'],
  [/\b(mujhe)?\s*(home|top|main page)\s*(par|pe)?\s*(le chalo|le jao|chalo|jao)\b/g, 'go home'],
  [/\babout\s*(section)?\s*(par|pe)?\s*(le chalo|le jao|dikhao|batao)\b/g, 'go to about'],
  [/\bcontact\s*(kahan|kaha)?\s*(hai|he|h)?\b|\bcontact\s*(par|pe)?\s*(le chalo|dikhao)\b/g, 'go to contact'],
  [/\barcade\s*(os)?\s*(kholo|open|chalao)\b/g, 'open arcade os'],
  [/\bmanav\s*(kaun|kon)\s*hai\b|\bmanav\s*ke\s*baare\b/g, 'who is manav'],
  [/\bnimo\s*(kya|kaun|kon)\s*hai\b|\bnimo\s*ke\s*baare\b/g, 'what is nimo'],
  [/\btum\s*kya\s*kar\s*sakte\s*ho\b|\bkya\s*kar\s*sakte\s*ho\b/g, 'what can you do'],
  [/\bmain\s*(abhi)?\s*(kya|kahan)\s*(dekh|dekhne)\s*(raha|rahe)\s*(hu|hoon|hai)\b|\bye\s*(konsa|kaunsa)\s*page\s*hai\b|\babhi\s*kaha\s*hu\b|\bkaunsa\s*project\s*open\s*hai\b/g, 'what am i viewing'],
  [/\bis\s*project\s*ka\s*summary\s*do\b|\bye\s*kya\s*project\s*hai\b|\biska\s*summary\s*do\b|\bis\s*project\s*ke\s*baare\s*mein\s*batao\b|\bis\s*project\s*ka\s*summary\s*batao\b/g, 'summarize it'],
  [/\bisme\s*kya\s*tech\s*use\s*hui\b|\bisme\s*kya\s*technologies\s*hai\b|\bkonsi\s*tech\s*use\s*hui\b/g, 'what tech was used'],
  [/\bisme\s*kya\s*problem\s*solve\s*hui\b|\bye\s*kyu\s*banaya\b/g, 'problem does it solve'],
  [/\biske\s*main\s*features\s*kya\s*hai\b|\bmain\s*features\s*batao\b/g, 'main features'],
  [/\brestaurant\s*(wala|wali)?\s*project\b/g, 'open velora-bites'],
  [/\bgame\s*(wala|wali)?\s*projects\b/g, 'game projects'],
  [/\bui\s*(wala|wali)?\s*projects\b/g, 'ui projects'],
  [/\bfrontend\s*aur\s*backend\s*mein\s*difference\s*kya\s*hai\b|\bfrontend\s*vs\s*backend\b/g, 'frontend vs backend'],
  [/\btum\s*kaise\s*ho\b|\bnimo\s*kaise\s*ho\b|\bkaise\s*ho\b/g, 'how are you'],

  // Single word token normalizations AFTER phrases
  [/\bkia\b/g, 'kya'],
  [/\bkese\b/g, 'kaise'],
  [/\bkaha\b/g, 'kahan'],
  [/\bbtao\b/g, 'batao'],
  [/\bdikha\b|\bdikho\b/g, 'dikhao'],
  [/\bmuje\b/g, 'mujhe'],
  [/\bkon\b/g, 'kaun'],
  [/\bkisnay\b/g, 'kisne'],
  [/\bproj\b/g, 'project'],
  [/\bopen karo\b|\blaunch karo\b|\bchalao\b/g, 'kholo'],
  [/\ble jao\b/g, 'le chalo']
];

const TYPO_MAP = [
  [/\bwhatv\b|\bwat\b/g, 'what'],
  [/\bans\b/g, 'answer'],
  [/\blang\b/g, 'language'],
  [/\bhtlm\b/g, 'html'],
  [/\bjavascrpt\b|\bjavscript\b|\bjvs\b/g, 'javascript'],
  [/\btollverse\b|\btoolvese\b/g, 'toolverse'],
  [/\bnintedno\b|\bnintend\b/g, 'nintendo'],
  [/\bnik website\b|\bnik ui\b|\bnik\b/g, 'nike'],
  [/\breactjs\b/g, 'react'],
  [/\bthreejs\b/g, 'three js'],
  [/\bnode\s*\.?\s*js\b/g, 'nodejs'],
  [/\bnext\s*\.?\s*js\b/g, 'nextjs'],
  [/\bvue\s*\.?\s*js\b/g, 'vue'],
  [/\bfull\s+stack\b/g, 'fullstack'],
  [/\bmobile\s+first\b/g, 'mobilefirst'],
  [/\bweb\s+app\b/g, 'webapp'],
  [/\blocal\s+storage\b/g, 'localstorage'],
  [/\bsession\s+storage\b/g, 'sessionstorage'],
  [/\bservice\s+workers\b/g, 'serviceworkers'],
  [/\bweb\s+audio\s+api\b/g, 'webaudioapi'],
  [/\bgamepad\s+api\b/g, 'gamepadapi'],
  [/\bcanvas\s+api\b/g, 'canvas'],
  [/\bunit\s+test\b|\bunit\s+testing\b/g, 'unittest'],
  [/\bintegration\s+test\b|\bintegration\s+testing\b/g, 'integrationtest'],
  [/\bdark\s+mode\b/g, 'darkmode'],
  [/\blazy\s+loading\b/g, 'lazyloading'],
  [/\bci\s*\/\s*cd\b/g, 'cicd']
];

const CONTRACTION_MAP = [
  [/\bwhat's\b/g, 'what is'],
  [/\bwho's\b/g, 'who is'],
  [/\bhow's\b/g, 'how is'],
  [/\bwhere's\b/g, 'where is'],
  [/\bthat's\b/g, 'that is'],
  [/\bit's\b/g, 'it is'],
  [/\bthere's\b/g, 'there is'],
  [/\bcan't\b/g, 'cannot'],
  [/\bdon't\b/g, 'do not'],
  [/\bwhats\b/g, 'what is'],
  [/\bwhos\b/g, 'who is'],
  [/\bhows\b/g, 'how is']
];

const SHORTHAND_MAP = [
  [/\bu\b/g, 'you'],
  [/\br\b/g, 'are'],
  [/\bur\b/g, 'your'],
  [/\br\s+u\b/g, 'are you'],
  [/\bpls\b|\bplz\b/g, 'please'],
  [/\bthx\b/g, 'thanks']
];

const REPEATED_CONVERSATIONAL_MAP = [
  [/\b(hi){2,}\b/g, 'hi'],
  [/\b(ha){2,}\b/g, 'haha'],
  [/\bhe+y+\b/g, 'hey'],
  [/\bhi{2,}\b/g, 'hi'],
  [/\bhe+l+o+\b/g, 'hello'],
  [/\byo{2,}\b/g, 'yo'],
  [/\bthank+s+\b/g, 'thanks'],
  [/\bby+e+\b/g, 'bye'],
  [/\bplea+s+e*\b/g, 'please'],
  [/\boka+y+\b/g, 'okay'],
  [/\bye+s+\b/g, 'yes'],
  [/\bno{2,}\b/g, 'no'],
  [/\bup{2,}\b/g, 'up'],
  [/\byou{2,}\b/g, 'you']
];

function normalizeText(rawInput) {
  let text = rawInput.toLowerCase().trim().replace(/’/g, "'").replace(/[“”]/g, '"');

  // Devanagari transliteration to English/Roman
  for (const [pattern, replacement] of DEVANAGARI_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Safe repeated-character normalization for conversational words
  for (const [pattern, replacement] of REPEATED_CONVERSATIONAL_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Contractions & Shorthand
  for (const [pattern, replacement] of CONTRACTION_MAP) {
    text = text.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of SHORTHAND_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Multilingual Hinglish normalization
  for (const [pattern, replacement] of HINGLISH_NORMALIZATION_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Typos & space normalization
  for (const [pattern, replacement] of TYPO_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Clean punctuation except letters, numbers, spaces, and Devanagari range
  text = text.replace(/[^a-z0-9\u0900-\u097F\s]/gi, ' ').replace(/\s+/g, ' ').trim();

  // Vocative NIMO name stripping (only when not target of identity query)
  const isNimoTargetQuery = matchesAnyPhrase(text, [
    'what is nimo', 'who is nimo', 'tell me about nimo', 'explain nimo',
    'who made nimo', 'who built nimo', 'who created nimo', 'is nimo ai', 'what can nimo do',
    'what does nimo do', 'open nimo', 'close nimo', 'nimo project', 'nimo case study', 'nimo assistant', 'open nimo case study'
  ]);

  if (!isNimoTargetQuery) {
    text = text
      .replace(/^hey\s+nimo\s*/g, 'hey ')
      .replace(/^hi\s+nimo\s*/g, 'hi ')
      .replace(/^hello\s+nimo\s*/g, 'hello ')
      .replace(/^yo\s+nimo\s*/g, 'yo ')
      .replace(/^nimo\s+/g, '')
      .replace(/\s+nimo\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return text;
}

function matchesAnyPhrase(text, phrases) {
  return phrases.some(p => {
    if (['hi', 'hey', 'yo', 'who', 'ui', 'ai'].includes(p)) {
      return new RegExp(`\\b${p}\\b`, 'i').test(text);
    }
    return text.includes(p);
  });
}

// ==========================================
// 4. ENTITY EXTRACTION ENGINE
// ==========================================

function extractEntities(normalizedInput) {
  const entities = {
    project: null,
    technology: null,
    section: null,
    isPronounTarget: false,
    pronoun: null
  };

  // 1. Project Entity Extraction
  for (const project of PROJECTS_DB) {
    if (new RegExp(`\\b${project.id}\\b`, 'i').test(normalizedInput) || normalizedInput.includes(project.name.toLowerCase())) {
      entities.project = project;
      break;
    }
    for (const alias of project.aliases) {
      if (new RegExp(`\\b${alias}\\b`, 'i').test(normalizedInput)) {
        entities.project = project;
        break;
      }
    }
    if (entities.project) break;
  }

  // 2. Section Entity Extraction
  const sections = [
    { id: 'work', aliases: ['work', 'projects', 'portfolio work', 'case studies', 'projects section'] },
    { id: 'about', aliases: ['about', 'log origin', 'background', 'story'] },
    { id: 'skills', aliases: ['skills', 'capabilities', 'tech stack'] },
    { id: 'experience', aliases: ['experience', 'timeline', 'journey'] },
    { id: 'contact', aliases: ['contact', 'email', 'get in touch', 'reach out'] },
    { id: 'arcade', aliases: ['arcade', 'arcade os', 'cabinet', 'games'] },
    { id: 'home', aliases: ['home', 'main-content', 'top'] }
  ];

  for (const s of sections) {
    for (const alias of s.aliases) {
      if (new RegExp(`\\b${alias}\\b`, 'i').test(normalizedInput)) {
        entities.section = s.id;
        break;
      }
    }
    if (entities.section) break;
  }

  // 3. Pronoun Entity Extraction
  const pronouns = ['it', 'this', 'that', 'this project', 'the project', 'that project', 'ye', 'yeh', 'iska', 'isme', 'woh', 'wo'];
  for (const p of pronouns) {
    const regex = new RegExp(`\\b${p}\\b`, 'i');
    if (regex.test(normalizedInput)) {
      entities.isPronounTarget = true;
      entities.pronoun = p;
      break;
    }
  }

  // 4. Technology Entity Extraction
  const sortedGlossaryKeys = Object.keys(GLOSSARY_DB).sort((a, b) => b.length - a.length);
  for (const term of sortedGlossaryKeys) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(normalizedInput)) {
      entities.technology = term;
      break;
    }
  }

  return entities;
}

// ==========================================
// 5. CONVERSATIONAL CONTEXT STORE
// ==========================================

const ConversationalContext = {
  lastIntent: null,
  lastProject: null,
  lastSection: null,

  update(intentId, projectEntity, sectionEntity) {
    if (intentId) this.lastIntent = intentId;
    if (projectEntity) this.lastProject = projectEntity;
    if (sectionEntity) this.lastSection = sectionEntity;
  },

  resolveProjectTarget(currentCaseStudy) {
    return currentCaseStudy || this.lastProject || null;
  }
};

// ==========================================
// 6. INTENT REGISTRY & SCORING ENGINE
// ==========================================

const INTENT_REGISTRY = [
  // 1. NIMO Creator
  {
    id: 'nimo_creator',
    priority: 115,
    matches: (text) => matchesAnyPhrase(text, [
      'who made nimo', 'who built nimo', 'who created nimo', 'who built you', 'who made you',
      'who created you', 'who coded you', 'who coded nimo', 'who programmed you', 'who programmed nimo'
    ]),
    handler: () => ({
      intentId: 'nimo_creator',
      text: `**NIMO** was designed and engineered by **${PORTFOLIO_KNOWLEDGE.owner.name}** as part of this interactive portfolio.`,
      actions: [
        { label: 'Read About Manav', navigate: 'index.html#about' },
        { label: 'View Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 2. Owner & Developer Creator Identity
  {
    id: 'owner_identity',
    priority: 110,
    matches: (text) => matchesAnyPhrase(text, [
      'who built this', 'who built this website', 'who built this site', 'who built this portfolio',
      'who made this website', 'who made this site', 'who made this portfolio', 'who created this website',
      'who created this site', 'who created this portfolio', 'who is the owner', 'whose portfolio is this',
      'whose portfolio', 'whose website', 'who owns this website', 'who owns this site', 'who is the developer',
      'who is behind this portfolio', 'who developed this', 'who owns this', 'tell me who made this',
      'kisne banaya', 'kisne banayi', 'who built', 'who made', 'who created', 'creator', 'author'
    ]),
    handler: () => ({
      intentId: 'owner_identity',
      text: `This portfolio was designed and engineered by **${PORTFOLIO_KNOWLEDGE.owner.name}**, a ${PORTFOLIO_KNOWLEDGE.owner.role} based in ${PORTFOLIO_KNOWLEDGE.owner.location}.\n\nIt showcases his web applications, UI/UX design concepts, game systems, case studies, and interactive experiments like Arcade OS and NIMO.`,
      actions: [
        { label: 'Read About Section', navigate: 'index.html#about' },
        { label: 'View Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 3. NIMO Implementation / Programming Language
  {
    id: 'nimo_code_language',
    priority: 108,
    matches: (text) => {
      if (matchesAnyPhrase(text, ['manav', 'developer', 'his', 'he', 'person'])) return false;
      return matchesAnyPhrase(text, [
        'in which language is your code written', 'what language is your code written in',
        'what programming language powers you', 'are you written in javascript',
        'what tech is nimo built with', 'what is nimo coded in', 'which language your code written',
        'what code powers you', 'what are you built with', 'how were you made', 'how was nimo made',
        'what tech powers nimo', 'what technology powers you', 'what programming language'
      ]);
    },
    handler: () => ({
      intentId: 'nimo_code_language',
      text: `**NIMO** is primarily implemented in **JavaScript using ES modules**, with HTML5 and Vanilla CSS3 for its interface and visual styling.`,
      actions: [
        { label: 'View NIMO Case Study', navigate: 'project-nimo.html' },
        { label: 'Explore Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 4. NIMO Supported Languages
  {
    id: 'nimo_languages_supported',
    priority: 105,
    matches: (text) => {
      if (matchesAnyPhrase(text, ['code', 'written', 'programming', 'manav'])) return false;
      return matchesAnyPhrase(text, [
        'what languages do you support', 'what languages do you speak', 'what languages can you speak',
        'which languages do you know', 'languages do you understand', 'what languages can nimo speak',
        'what languages do you understand'
      ]);
    },
    handler: () => ({
      intentId: 'nimo_languages_supported',
      text: `I support natural conversation in **English**, **Hindi (Devanagari)**, and **Hinglish (Roman Hindi)**. You can ask me questions or tell me to switch languages anytime (e.g., *"Hindi mein bolo"*).`,
      actions: [
        { label: 'Hinglish mein bolo', query: 'Hinglish mein bolo' },
        { label: 'Hindi mein bolo', query: 'Hindi mein bolo' }
      ]
    })
  },

  // 5. NIMO Local Architecture & API Questions
  {
    id: 'nimo_api_architecture',
    priority: 104,
    matches: (text) => matchesAnyPhrase(text, [
      'do you use ai', 'do you use chatgpt', 'do you use an api', 'do you use openai',
      'are you local', 'do you need internet', 'do you use an llm', 'how is your knowledge stored',
      'do you use external ai', 'does nimo use chatgpt', 'does nimo use openai'
    ]),
    handler: () => ({
      intentId: 'nimo_api_architecture',
      text: `My core behavior is **local-first**. I use structured intent recognition, project data, page context, and local knowledge instead of depending on a general-purpose external LLM or paid AI API for core functionality.`,
      actions: [
        { label: 'How do you work?', query: 'How do you work?' },
        { label: 'View NIMO Case Study', navigate: 'project-nimo.html' }
      ]
    })
  },

  // 6. NIMO Self Limitations
  {
    id: 'nimo_limitations',
    priority: 103,
    matches: (text) => matchesAnyPhrase(text, [
      'what cannot you do', 'what can not you do', 'what are your limits', 'what do not you know',
      'do you know everything', 'can you answer anything', 'are you like chatgpt', 'what are your limitations',
      'how smart are you', 'are you all knowing', 'what are your bounds'
    ]),
    handler: () => ({
      intentId: 'nimo_limitations',
      text: `I'm not a general-purpose AI that knows everything. I'm built specifically for this portfolio, its projects, site navigation, case studies, and common web-development questions.`,
      actions: [
        { label: 'What can you do?', query: 'What can you do?' },
        { label: 'Explore Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 7. NIMO Real Identity & Existence
  {
    id: 'nimo_real_identity',
    priority: 102,
    matches: (text) => {
      if (matchesAnyPhrase(text, ['project', 'website', 'portfolio', 'site']) && !matchesAnyPhrase(text, ['you', 'u', 'nimo', 'bot', 'ai', 'human', 'alive'])) return false;
      return matchesAnyPhrase(text, [
        'are you real', 'are you actually real', 'are you a real ai', 'are you alive',
        'are you human', 'are you a bot', 'are you real or fake'
      ]);
    },
    handler: () => ({
      intentId: 'nimo_real_identity',
      text: `I'm real in the sense that I'm an actual interactive assistant running inside this website, but I'm not a human or a conscious being. I'm a local website-aware assistant built specifically for this portfolio.`,
      actions: [
        { label: 'What can you do?', query: 'What can you do?' },
        { label: 'View Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 8. NIMO Self Purpose
  {
    id: 'nimo_purpose',
    priority: 101,
    matches: (text) => matchesAnyPhrase(text, [
      'why were you made', 'why do you exist', 'what is your purpose', 'why are you here',
      'why is nimo on this website', 'why was nimo built', 'what are you here for'
    ]),
    handler: () => ({
      intentId: 'nimo_purpose',
      text: `I was built to make this portfolio easier and more interactive to explore — instead of manually searching through pages, you can ask me about projects, case studies, or where you want to go.`,
      actions: [
        { label: 'Take me to Projects', navigate: 'index.html#work' },
        { label: 'Open Arcade', navigate: 'arcade' }
      ]
    })
  },

  // 9. How NIMO Works
  {
    id: 'nimo_how_it_works',
    priority: 100,
    matches: (text) => {
      if (matchesAnyPhrase(text, ['website', 'portfolio', 'site']) && !matchesAnyPhrase(text, ['you', 'u', 'nimo', 'question', 'answer', 'navigate'])) return false;
      return matchesAnyPhrase(text, [
        'how do you work', 'how does nimo work', 'explain how you work', 'how do you understand questions',
        'how do you know what i mean', 'how do you answer', 'how do you navigate the website',
        'how you work', 'how do you understand me'
      ]);
    },
    handler: () => ({
      intentId: 'nimo_how_it_works',
      text: `I process your message through text normalization, intent detection, entity matching, and page/context awareness. Then I either answer from structured local knowledge or trigger an action such as navigating to a project or section.`,
      actions: [
        { label: 'View NIMO Case Study', navigate: 'project-nimo.html' },
        { label: 'What can you do?', query: 'What can you do?' }
      ]
    })
  },

  // 10. NIMO AI Technical Honesty
  {
    id: 'nimo_ai_honesty',
    priority: 99,
    matches: (text) => matchesAnyPhrase(text, ['are you an ai', 'are you a chatbot', 'are you real ai', 'are you a real ai', 'are you ai', 'is nimo ai']),
    handler: () => ({
      intentId: 'nimo_ai_honesty',
      text: `I'm a website-aware assistant built specifically for this portfolio. My responses and navigation work locally through structured knowledge and intent recognition rather than a general-purpose AI model.`,
      actions: [
        { label: 'What can you do?', query: 'What can you do?' },
        { label: 'Explore Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 11. Arcade NIMO service authorization (session-scoped UX secret)
  {
    id: 'arcade_nimo_override',
    priority: 99,
    matches: (text) => matchesAnyPhrase(text, [
      'unlock arcade override', 'arcade override', 'nimo override', 'service access',
      'show deeper arcade secret', 'authorize developer mode', 'override arcade'
    ]),
    handler: (text, entities, locationCtx, isHindi, isHinglish) => {
      const authorization = window.ArcadeDeveloperMode?.authorizeFromNimo();
      if (isHinglish) {
        return {
          intentId: 'arcade_nimo_override',
          text: `${authorization?.text || 'Override accepted.'}\n\nService authorization mil gayi hai. Developer Mode abhi bhi OFF hai.`,
          actions: authorization?.actions || []
        };
      }
      return {
        intentId: 'arcade_nimo_override',
        text: `${authorization?.text || 'Override accepted.'}\n\nAuthorization: **${authorization?.code || 'SESSION GRANTED'}**\nDeveloper Mode remains OFF until you open the cabinet service layer.`,
        actions: authorization?.actions || []
      };
    }
  },

  // 11b. NIMO Definition & Identity
  {
    id: 'nimo_identity',
    priority: 98,
    matches: (text) => matchesAnyPhrase(text, ['what is nimo', 'who is nimo', 'tell me about nimo', 'explain nimo', 'what exactly are you']),
    handler: () => ({
      intentId: 'nimo_identity',
      text: `**NIMO** is the local-first, website-aware female AI companion built into this portfolio. I can help you navigate the site, explore projects, explain case studies, answer common web-development questions, and understand what you're currently viewing.`,
      actions: [
        { label: 'What can you do?', query: 'What can you do?' },
        { label: 'Take me to Projects', navigate: 'index.html#work' }
      ]
    })
  },

  // 12. NIMO Self Capabilities & Knowledge Scope
  {
    id: 'nimo_capabilities',
    priority: 97,
    matches: (text) => {
      if (matchesAnyPhrase(text, ['manav', 'developer', 'his', 'he'])) return false;
      return matchesAnyPhrase(text, [
        'what does nimo do', 'what can nimo do', 'what can you do', 'what are you capable of',
        'what is your ability', 'what are your abilities', 'what can you answer', 'what do you know',
        'do you know anything', 'what can you understand', 'what topics do you know',
        'what can i ask you', 'what should i ask you', 'what questions can you answer', 'help', 'commands', 'options'
      ]);
    },
    handler: () => ({
      intentId: 'nimo_capabilities',
      text: `I'm **NIMO**, your portfolio assistant! I can help you navigate this portfolio, find and explain projects, summarize case studies, understand what page you're viewing, answer common web-development questions, and respond in English, Hindi, or Hinglish.`,
      actions: [
        { label: 'Show UI Projects', query: 'Show me UI projects' },
        { label: 'Open Arcade', navigate: 'arcade' }
      ]
    })
  },

  // 13. Location / Current Page Context
  {
    id: 'location_context',
    priority: 95,
    matches: (text) => matchesAnyPhrase(text, ['what am i viewing', 'tell me what i am viewing', 'what page am i on', 'where am i', 'which page is this', 'what section am i on', 'which project am i viewing', 'what project is this', 'what am i looking at', 'tell me where i am', 'what is open right now', 'current page', 'current section', 'where are we']),
    handler: (text, entities, locationCtx) => {
      if (locationCtx.type === 'case-study') {
        return {
          intentId: 'location_context',
          subType: 'case-study',
          title: locationCtx.title,
          text: locationCtx.description,
          actions: [
            { label: 'Summarize it', query: 'Summarize it' },
            { label: 'What tech was used?', query: 'What tech was used?' },
            { label: 'Back to Projects', navigate: 'index.html#work' }
          ]
        };
      } else if (locationCtx.type === 'arcade') {
        return {
          intentId: 'location_context',
          subType: 'arcade',
          text: locationCtx.description,
          actions: [{ label: 'View Projects', navigate: 'index.html#work' }]
        };
      } else {
        return {
          intentId: 'location_context',
          subType: locationCtx.id || 'home',
          title: locationCtx.title,
          text: `${locationCtx.description}\n\nYou can ask me to take you to Projects, About, Contact, or Arcade.`,
          actions: [
            { label: 'Take me to Projects', navigate: 'index.html#work' },
            { label: 'Open Arcade', navigate: 'arcade' }
          ]
        };
      }
    }
  },

  // 14. Navigation Intents
  {
    id: 'navigation',
    priority: 92,
    matches: (text) => matchesAnyPhrase(text, ['open arcade os', 'open arcade', 'play games', 'games os', 'launch arcade', 'play arcade', 'go back', 'back to projects', 'return to work', 'all projects', 'back to work', 'go home', 'take me home', 'homepage', 'top of page', 'main page', 'start', 'go to projects', 'take me to projects', 'show me projects', 'show projects', 'view projects', 'see work', 'show work', 'selected work', 'work section', 'go to about', 'take me to about', 'open about', 'show about', 'about section', 'log origin', 'go to contact', 'take me to contact', 'open contact', 'show contact', 'contact section']),
    handler: (text) => {
      if (matchesAnyPhrase(text, ['go back', 'back to projects', 'return to work', 'all projects', 'back to work'])) {
        return { intentId: 'navigation', target: 'work', text: "Sure — taking you back to the Projects section.", navigateTarget: 'index.html#work' };
      }
      if (matchesAnyPhrase(text, ['go home', 'take me home', 'homepage', 'top of page', 'main page', 'start'])) {
        return { intentId: 'navigation', target: 'home', text: "Taking you to the top of the portfolio.", navigateTarget: 'index.html#main-content' };
      }
      if (matchesAnyPhrase(text, ['go to projects', 'take me to projects', 'show me projects', 'show projects', 'view projects', 'see work', 'show work', 'selected work', 'work section'])) {
        return { intentId: 'navigation', target: 'work', text: "Navigating to the Projects section.", navigateTarget: 'index.html#work' };
      }
      if (matchesAnyPhrase(text, ['go to about', 'take me to about', 'open about', 'show about', 'about section', 'log origin'])) {
        return { intentId: 'navigation', target: 'about', text: "Taking you to the About section (Log Origin).", navigateTarget: 'index.html#about' };
      }
      if (matchesAnyPhrase(text, ['go to contact', 'take me to contact', 'open contact', 'show contact', 'contact section'])) {
        return { intentId: 'navigation', target: 'contact', text: "Opening the Contact section.", navigateTarget: 'index.html#contact' };
      }
      return { intentId: 'navigation', target: 'arcade', text: "Opening Arcade OS! Launching cabinet interface...", navigateTarget: 'arcade' };
    }
  },

  // 15. Case Study Context & Follow-Ups
  {
    id: 'case_study_context',
    priority: 90,
    matches: (text, entities, locationCtx, activeCS) => {
      if (!activeCS) return false;
      if (locationCtx?.type !== 'case-study' && (text.includes("manav") || text.includes("portfolio"))) return false;
      if (entities.technology && GLOSSARY_DB[entities.technology]) return false;
      return matchesAnyPhrase(text, ['summary', 'summarize', 'overview', 'about this project', 'what is this project', 'tell me about this', 'summarize it', 'summarize this', 'tech', 'technology', 'built with', 'stack', 'languages', 'tech was used', 'tech is used', 'what tech', 'problem', 'challenge', 'goal', 'problem does it solve', 'feature', 'features', 'main features', 'key features', 'its main features']);
    },
    handler: (text, entities, locationCtx, activeCS) => {
      if (matchesAnyPhrase(text, ['summary', 'summarize', 'overview', 'about this project', 'what is this project', 'tell me about this', 'summarize it', 'summarize this'])) {
        return {
          intentId: 'case_study_context',
          subType: 'summary',
          title: activeCS.title,
          summaryText: activeCS.summary,
          text: `**${activeCS.title}**\n\n${activeCS.summary}`,
          actions: [{ label: 'Back to Projects', navigate: 'index.html#work' }]
        };
      }
      if (matchesAnyPhrase(text, ['tech', 'technology', 'technologies', 'built with', 'stack', 'languages', 'tech was used', 'tech is used', 'what tech'])) {
        return {
          intentId: 'case_study_context',
          subType: 'tech',
          title: activeCS.title,
          techList: activeCS.tech,
          text: `**Technologies used in ${activeCS.title}:**\n\n${activeCS.tech.join(' • ')}`,
          actions: [{ label: 'View Summary', query: 'Summarize it' }]
        };
      }
      if (matchesAnyPhrase(text, ['problem', 'challenge', 'goal', 'why', 'problem does it solve'])) {
        return {
          intentId: 'case_study_context',
          subType: 'problem',
          title: activeCS.title,
          text: `**Core Challenge / Problem:**\n\n${activeCS.problem}`,
          actions: [{ label: 'Back to Projects', navigate: 'index.html#work' }]
        };
      }
      return {
        intentId: 'case_study_context',
        subType: 'features',
        title: activeCS.title,
        text: `**Key Features:**\n\n${activeCS.features}`,
        actions: [{ label: 'Back to Projects', navigate: 'index.html#work' }]
      };
    }
  },

  // 16. Developer Glossary Queries
  {
    id: 'developer_glossary',
    priority: 85,
    matches: (text, entities) => {
      if (entities.technology && GLOSSARY_DB[entities.technology]) {
        if (matchesAnyPhrase(text, ['what is', 'meaning', 'stands for', 'full form', 'definition', 'explain', 'what does', 'why use', 'why is', 'kya hai', 'kya hota', 'ka matlab', 'kya h'])) {
          return true;
        }
        if (new RegExp(`^${entities.technology}$`, 'i').test(text)) return true;
      }
      if (text.includes('github') && (text.includes('what is') || text.includes('meaning') || text.includes('explain') || text.includes('kya hai') || text.includes('ka matlab'))) return true;
      return false;
    },
    handler: (text, entities) => {
      const termKey = entities.technology || (text.includes('github') ? 'github' : 'html');
      const entry = GLOSSARY_DB[termKey];
      const defaultText = typeof entry === 'string' ? entry : (entry?.en || GLOSSARY_DB.html.en);
      return {
        intentId: 'developer_glossary',
        termKey,
        text: defaultText,
        actions: [{ label: 'Explore Projects', navigate: 'index.html#work' }]
      };
    }
  },

  // 17. Website Architecture & Technology Stack Checks
  {
    id: 'architecture_inquiry',
    priority: 80,
    matches: (text) => matchesAnyPhrase(text, ['how to make a website like this', 'how was this website made', 'how was this site made', 'how can i build a portfolio like this', 'how do i create a site like this', 'what do i need to make a portfolio like this', 'how was this site built', 'tech behind this site', 'how is this built', 'technologies were used for this portfolio', 'is this built with react', 'is this react', 'built with react', 'does this site use react', 'is this gsap', 'three js', 'threejs', 'does this use gsap', 'how does this website work', 'how does this site work', 'how does this portfolio work']),
    handler: (text) => {
      if (matchesAnyPhrase(text, ['is this built with react', 'is this react', 'built with react', 'does this site use react'])) {
        return {
          intentId: 'architecture_inquiry',
          subType: 'react',
          text: `No. This portfolio is built with pure **HTML5, Vanilla CSS, and modular ES Modules** rather than React.`,
          actions: [{ label: 'Explore Projects', navigate: 'index.html#work' }]
        };
      }
      if (matchesAnyPhrase(text, ['is this gsap', 'three js', 'threejs', 'does this use gsap'])) {
        return {
          intentId: 'architecture_inquiry',
          subType: 'gsap',
          text: `No. All visual animations, smooth rail navigation, and Arcade cabinet transformations use native **CSS Grid/Flexbox, Canvas 2D, and mathematical Web APIs**.`,
          actions: [{ label: 'Open Arcade OS', navigate: 'arcade' }]
        };
      }
      return {
        intentId: 'architecture_inquiry',
        subType: 'general',
        text: `To build a portfolio like this, start with a strong **HTML5, Vanilla CSS, and modular JavaScript** foundation. Build reusable project configurations, case-study pages, responsive CSS Grid layouts, dark/light theme switching, and interactive features like Arcade OS and NIMO using pure ES modules.\n\nThe key is establishing a clean core portfolio first before layering advanced interactions, Gamepad API support, and custom canvas/audio tools on top. I can also take you to any section or project you'd like to inspect!`,
        actions: [
          { label: 'Explore Projects', navigate: 'index.html#work' },
          { label: 'Open Arcade OS', navigate: 'arcade' }
        ]
      };
    }
  },

  // 18. Specific Project Lookup & Hybrid Command Navigation
  {
    id: 'project_lookup',
    priority: 75,
    matches: (text, entities) => !!entities.project,
    handler: (text, entities) => {
      const p = entities.project;
      const isNavRequested = matchesAnyPhrase(text, ['open', 'take me to', 'go to', 'show', 'launch', 'navigate']);
      if (isNavRequested) {
        return {
          intentId: 'project_lookup',
          isNav: true,
          projectName: p.name,
          text: `Opening **${p.name}**...`,
          navigateTarget: p.caseStudy
        };
      }
      return {
        intentId: 'project_lookup',
        isNav: false,
        projectName: p.name,
        type: p.type,
        summary: p.summary,
        tech: p.tech,
        text: `**${p.name}** (${p.type})\n\n${p.summary}\n\n**Tech:** ${p.tech.join(' • ')}`,
        actions: [
          { label: `Open ${p.name}`, navigate: p.caseStudy }
        ]
      };
    }
  },

  // 19. Recruiter & Hiring Queries
  {
    id: 'recruiter_inquiry',
    priority: 65,
    matches: (text) => matchesAnyPhrase(text, ['why hire', 'why should i hire', 'hire manav', 'recruiter', 'strongest project', 'most technical', 'available for work', 'good at ui']),
    handler: () => ({
      intentId: 'recruiter_inquiry',
      text: `Based on this portfolio, **${PORTFOLIO_KNOWLEDGE.owner.name}** demonstrates strong hands-on experience in frontend engineering, product UI/UX design systems, PWA tools platforms (**ToolVerse** - 70+ browser tools), and interactive game engines (**Arcade OS** & **SHIFT-ZERO**).\n\nHe is currently ${PORTFOLIO_KNOWLEDGE.owner.availability.toLowerCase()}. I recommend exploring his case studies and live projects to evaluate fit for your team!`,
      actions: [
        { label: 'View Case Studies', navigate: 'index.html#work' },
        { label: 'Contact Manav', navigate: 'index.html#contact' }
      ]
    })
  },

  // 20. Project Filter / List Queries
  {
    id: 'project_filter',
    priority: 60,
    matches: (text) => matchesAnyPhrase(text, ['what projects are here', 'list projects', 'show me projects', 'all projects', 'projects list', 'what projects', 'ui projects', 'design projects', 'ui concepts', 'figma', 'ui project', 'game projects', 'games', 'godot', 'gaming', 'game project', 'ai projects', 'artificial intelligence', 'machine learning', 'best project', 'which project', 'recommendation', 'flagship', 'where to start', 'start here', 'most advanced']),
    handler: (text) => {
      if (matchesAnyPhrase(text, ['ui projects', 'design projects', 'ui concepts', 'figma', 'ui project'])) {
        const uiProjects = PROJECTS_DB.filter(p => p.category === 'ui');
        return {
          intentId: 'project_filter',
          subType: 'ui',
          text: `**UI/UX Design Projects:**\n\n` + uiProjects.map(p => `• **${p.name}**: ${p.summary}`).join('\n\n'),
          actions: [{ label: 'Open Nintendo UI', navigate: 'project-nintendo.html' }, { label: 'Open Nike UI', navigate: 'project-nike.html' }]
        };
      }
      if (matchesAnyPhrase(text, ['game projects', 'games', 'godot', 'gaming', 'game project'])) {
        const gameProjects = PROJECTS_DB.filter(p => p.category === 'game' || p.id === 'arcade-os');
        return {
          intentId: 'project_filter',
          subType: 'game',
          text: `**Game & Interactive Architecture Projects:**\n\n` + gameProjects.map(p => `• **${p.name}**: ${p.summary}`).join('\n\n'),
          actions: [{ label: 'Open Arcade OS', navigate: 'arcade' }, { label: 'Open SHIFT-ZERO', navigate: 'project-shift-zero.html' }]
        };
      }
      if (matchesAnyPhrase(text, ['ai projects', 'artificial intelligence', 'machine learning'])) {
        return {
          intentId: 'project_filter',
          subType: 'ai',
          text: `**AI-related projects & explorations:**\n\n• **PromptAI**: Dense split-pane workspace for comparing LLM prompts, models, and outputs.\n• **Fate AI**: Multi-model AI workspace with account routing and failover.\n• **ToolVerse**: 70+ privacy-first browser tools with local processing.`,
          actions: [{ label: 'View Projects', navigate: 'index.html#work' }]
        };
      }
      if (matchesAnyPhrase(text, ['best project', 'which project', 'recommendation', 'flagship', 'where to start', 'start here', 'most advanced'])) {
        return {
          intentId: 'project_filter',
          subType: 'best',
          text: `I recommend starting with **MY-PORTFOLIO / ArcadeOS** (a browser-based operating system with playable games and tools) or **ToolVerse** (a privacy-first 70+ PWA tools platform).`,
          actions: [
            { label: 'Open Arcade OS', navigate: 'arcade' },
            { label: 'Open ToolVerse', navigate: 'project-toolverse.html' }
          ]
        };
      }
      return {
        intentId: 'project_filter',
        subType: 'all',
        text: `**Featured Portfolio Projects:**\n\n` + PROJECTS_DB.map(p => `• **${p.name}** (${p.type}): ${p.summary}`).join('\n\n'),
        actions: [{ label: 'Open Arcade OS', navigate: 'arcade' }, { label: 'Open ToolVerse', navigate: 'project-toolverse.html' }]
      };
    }
  },

  // 21. Developer Skills & Background
  {
    id: 'developer_skills',
    priority: 50,
    matches: (text) => matchesAnyPhrase(text, ['who is manav', 'tell me about manav', 'tell me about the developer', 'tell me about the person behind this website', 'about the developer', 'what does he do', 'what kind of developer is he', 'what are his skills', 'his skills', 'skills', 'manav skills', 'developer skills', 'what skills does he have', 'what does manav do', 'what can manav do', 'what can the developer do', 'background', 'technologies does he know']),
    handler: () => ({
      intentId: 'developer_skills',
      text: `**${PORTFOLIO_KNOWLEDGE.owner.name}** is a ${PORTFOLIO_KNOWLEDGE.owner.role} based in ${PORTFOLIO_KNOWLEDGE.owner.location}.\n\n**Core Capabilities:**\n• ${PORTFOLIO_KNOWLEDGE.owner.skills.join('\n• ')}\n\nHe is currently ${PORTFOLIO_KNOWLEDGE.owner.availability.toLowerCase()}.`,
      actions: [
        { label: 'View Case Studies', navigate: 'index.html#work' },
        { label: 'Contact Manav', navigate: 'index.html#contact' }
      ]
    })
  },

  // 22. Contact Details & Social Links
  {
    id: 'contact_info',
    priority: 45,
    matches: (text) => matchesAnyPhrase(text, ['how can i contact manav', 'how do i contact', 'how to contact manav', 'how to contact', 'where can i contact him', 'show contact details', 'contact details', 'contact info', 'reach manav', 'email manav', 'get in touch']),
    handler: () => ({
      intentId: 'contact_info',
      text: `You can reach **${PORTFOLIO_KNOWLEDGE.owner.name}** directly via email at **${PORTFOLIO_KNOWLEDGE.contact.email}** or inspect his public project repositories on GitHub at **${PORTFOLIO_KNOWLEDGE.contact.github}**.\n\nWould you like me to take you to the Contact section?`,
      actions: [
        { label: 'Take me to Contact', navigate: 'index.html#contact' }
      ]
    })
  },

  // 23. Portfolio & Site Purpose
  {
    id: 'portfolio_purpose',
    priority: 40,
    matches: (text) => matchesAnyPhrase(text, ['what is this website', 'what is this site', 'what is this portfolio about', 'what is this portfolio', 'what can i find here', 'why was this website made', 'what does this site showcase', 'what kind of projects are here', 'portfolio about', 'tell me about this website', 'portfolio info']),
    handler: () => ({
      intentId: 'portfolio_purpose',
      text: `${PORTFOLIO_KNOWLEDGE.website.description}\n\n**Key Areas to Explore:**\n• **Selected Work**: Product case studies & UI explorations\n• **Arcade OS**: Playable retro cabinet & creative tools\n• **Complete Archive**: 15+ dedicated project deep dives`,
      actions: [
        { label: 'View Selected Work', navigate: 'index.html#work' },
        { label: 'Launch Arcade OS', navigate: 'arcade' }
      ]
    })
  },

  // 24. Small Talk (How are you)
  {
    id: 'smalltalk_howareyou',
    priority: 35,
    matches: (text) => matchesAnyPhrase(text, ['how are you', 'how r u', 'how are ya', "how's it going", 'how is it going', 'you good', 'how are things', "what's up", 'whats up', 'sup', 'how do you do']),
    handler: () => ({
      intentId: 'smalltalk_howareyou',
      text: `I'm doing great — ready to help you explore the portfolio. What would you like to see?`,
      actions: [
        { label: 'Take me to Projects', navigate: 'index.html#work' },
        { label: 'Open Arcade', navigate: 'arcade' }
      ]
    })
  },

  // 25. Small Talk (Greetings)
  {
    id: 'smalltalk_greeting',
    priority: 30,
    matches: (text) => matchesAnyPhrase(text, ['hi', 'hello', 'hey', 'yo', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings']),
    handler: (text) => {
      const GREETINGS = [
        "Hey! 👋 What would you like to explore?",
        "Hey there! I’m **NIMO**. Want to explore a project, Arcade, or something about the portfolio?",
        "Hi! What can I help you find today?",
        "Hello! I'm **NIMO**, your portfolio assistant. How can I help you explore Manav's work today?"
      ];
      const selected = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      return {
        intentId: 'smalltalk_greeting',
        text: selected,
        actions: [{ label: 'Show Projects', navigate: 'index.html#work' }, { label: 'Open Arcade', navigate: 'arcade' }]
      };
    }
  },

  // 26. Small Talk (Thanks)
  {
    id: 'smalltalk_thanks',
    priority: 25,
    matches: (text) => matchesAnyPhrase(text, ['thanks', 'thank you', 'thx', 'appreciate it', 'nice to meet you', 'awesome', 'cool', 'great']),
    handler: () => ({
      intentId: 'smalltalk_thanks',
      text: `You're very welcome! Feel free to ask if you need anything else or want to navigate anywhere.`,
      actions: [{ label: 'Take me to Projects', navigate: 'index.html#work' }]
    })
  },

  // 27. Small Talk (Goodbye)
  {
    id: 'smalltalk_goodbye',
    priority: 20,
    matches: (text) => matchesAnyPhrase(text, ['bye', 'goodbye', 'see you', 'see ya', 'later', 'cya']),
    handler: () => ({
      intentId: 'smalltalk_goodbye',
      text: `Goodbye! Have a great time exploring the portfolio.`
    })
  },

  // 28. Secrets / Hidden Tips
  {
    id: 'secret_tip',
    priority: 15,
    matches: (text) => matchesAnyPhrase(text, ['secret', 'tell me a secret', 'tell me secret', 'any secret', 'do you know a secret', 'show me a secret', 'hidden tip', 'easter egg']),
    handler: (text) => {
      const SECRET_TIPS = [
        "Here’s a secret: you can play Arcade with a controller. 🎮",
        "Secret unlocked: you can access me from almost any page on this website.",
        "A little secret — Arcade isn’t just decoration. Some of it is actually playable.",
        "Psst… try exploring the Arcade with a controller. You might like what you find. 👀",
        "Here’s one: I know which project you’re currently viewing, so you can ask me to summarize it without mentioning its name.",
        "Secret: you don’t always need to click around. Just tell me where you want to go.",
        "You found a hidden tip: ask me to take you directly to a project by its name."
      ];
      const tip = SECRET_TIPS[Math.floor(Math.random() * SECRET_TIPS.length)];
      const arcadeSecretAsked = /arcade|cabinet|machine|deeper/i.test(text);
      return {
        intentId: 'secret_tip',
        text: arcadeSecretAsked
          ? `The cabinet has a service layer that normal menus do not advertise. I can authorize it, but only for this session.`
          : `${tip}\n\nSome secrets are attached to the cabinet itself. Ask me about a deeper Arcade secret if you want a clue.`,
        actions: arcadeSecretAsked
          ? [{ label: 'AUTHORIZE SERVICE ACCESS', query: 'Show deeper Arcade secret' }]
          : [{ label: 'Ask about the cabinet', query: 'Do you know a deeper Arcade secret?' }]
      };
    }
  },

  // 29. Out-of-Scope Polite Redirect
  {
    id: 'out_of_scope',
    priority: 10,
    matches: (text) => matchesAnyPhrase(text, ['doctor', 'medical', 'politics', 'president', 'weather', 'recipe', 'crypto', 'bitcoin', 'stock market', 'finance']),
    handler: () => ({
      intentId: 'out_of_scope',
      text: `I'm specifically built to assist with this portfolio, Manav's projects, web development concepts (HTML, CSS, JS), Arcade OS, and site navigation! Ask me about any project or skill.`,
      actions: [
        { label: 'Take me to Projects', navigate: 'index.html#work' },
        { label: 'Open Arcade', navigate: 'arcade' }
      ]
    })
  }
];

// Sort Intent Registry by priority descending
INTENT_REGISTRY.sort((a, b) => b.priority - a.priority);

// ==========================================
// 7. RESPONSE LOCALIZATION ENGINE
// ==========================================

function localizeResponse(res, lang) {
  if (!res || lang === 'en') return res;

  const localized = { ...res };
  const id = res.intentId;

  // Handle Developer Glossary Multilingual Dictionary
  if (id === 'developer_glossary' && res.termKey && GLOSSARY_DB[res.termKey]) {
    const entry = GLOSSARY_DB[res.termKey];
    if (typeof entry === 'object' && entry[lang]) {
      localized.text = entry[lang];
    }
  } else if (lang === 'hinglish') {
    switch (id) {
      case 'nimo_creator':
        localized.text = `**NIMO** ko **Manav Agarwal** ne is interactive portfolio ke part ke roop mein design aur engineer kiya hai.`;
        break;
      case 'nimo_code_language':
        localized.text = `**NIMO** primary roop se **JavaScript (ES Modules)** mein implement hua hai, jisme HTML5 aur Vanilla CSS3 UI panel styling ke liye use hui hai.`;
        break;
      case 'nimo_languages_supported':
        localized.text = `Main **English**, **Hindi (Devanagari)** aur **Hinglish (Roman Hindi)** teenon languages support karta hoon. Tum mujhe kisi bhi language mein pooch sakte ho ya language switch karne ko bol sakte ho (*"Hindi mein bolo"*).`;
        break;
      case 'nimo_api_architecture':
        localized.text = `Mera core architecture **local-first** hai. Main general-purpose external LLM ya paid AI API par depend hone ke bajaye local intent recognition, structured project data aur page context use karta hoon.`;
        break;
      case 'nimo_limitations':
        localized.text = `Main koi sab kuch janne wala general-purpose AI nahi hoon. Main specifically is portfolio, iske projects, site navigation, case studies aur web-development questions ke liye built hoon.`;
        break;
      case 'nimo_real_identity':
        localized.text = `Main real hoon is sense mein ki main is website ke andar chalne wala ek real interactive assistant hoon, par main koi insaan ya conscious being nahi hoon. Main ek local website-aware assistant hoon.`;
        break;
      case 'nimo_purpose':
        localized.text = `Main is portfolio ko explore karna aasan aur interactive banane ke liye banaya gaya hoon — tum manual searching ki jagah direct projects, case studies ya navigation ke baare mein pooch sakte ho.`;
        break;
      case 'nimo_how_it_works':
        localized.text = `Main tumhare message ko text normalization, intent detection, entity matching aur page context ke zariye process karta hoon, fir local knowledge se answer deta hoon ya navigation trigger karta hoon.`;
        break;
      case 'owner_identity':
        localized.text = `Is portfolio ko **Manav Agarwal** ne design aur engineer kiya hai, jo Hyderabad, India ke ek Creative Frontend Developer hain.\n\nYeh unke web applications, UI/UX design concepts, game systems, case studies aur Arcade OS aur NIMO jaise interactive experiments ko showcase karta hai.`;
        break;
      case 'nimo_ai_honesty':
        localized.text = `Main is portfolio ke liye built ek website-aware assistant hoon. Mere responses aur navigation structured knowledge aur intent recognition ke zariye locally kaam karte hain, bina kisi external AI model ke.`;
        break;
      case 'nimo_identity':
        localized.text = `**NIMO** is portfolio mein built-in ek local-first, website-aware assistant hai. Main tumhe site navigate karne, projects explore karne, case studies samajhne, common web-development questions ke answer dene, aur tum abhi kya dekh rahe ho yeh batane mein help kar sakta hoon.`;
        break;
      case 'nimo_capabilities':
        localized.text = `Main **NIMO** hoon, tumhara portfolio assistant! Main tumhe portfolio navigate karne, projects explore karne, current case study ka summary dene, Manav ke work ke baare mein batane, aur web-development concepts explain karne mein help kar sakta hoon.`;
        break;
      case 'location_context':
        if (res.subType === 'case-study') {
          localized.text = `Tum abhi **${res.title || 'Case Study'}** project ka case study dekh rahe ho.`;
        } else if (res.subType === 'arcade') {
          localized.text = `Tum abhi **Arcade OS** ke andar ho.`;
        } else {
          localized.text = `Tum abhi **${res.title || 'Home'}** section dekh rahe ho.\n\nTum mujhe Projects, About, Contact, ya Arcade par le chalne ko keh sakte ho.`;
        }
        break;
      case 'navigation':
        if (res.target === 'arcade') {
          localized.text = `Arcade OS open kar raha hoon! Cabinet interface launch ho raha hai...`;
        } else if (res.target === 'home') {
          localized.text = `Portfolio ke top section par le chalta hoon.`;
        } else if (res.target === 'about') {
          localized.text = `About section (Log Origin) par le chalta hoon.`;
        } else if (res.target === 'contact') {
          localized.text = `Contact section open kar raha hoon.`;
        } else {
          localized.text = `Sure, tumhe Projects section par le chalta hoon.`;
        }
        break;
      case 'case_study_context':
        if (res.subType === 'summary') {
          localized.text = `**${res.title}**\n\n${res.summaryText || res.text}`;
        } else if (res.subType === 'tech') {
          localized.text = `**${res.title} mein use hui technologies:**\n\n${(res.techList || []).join(' • ')}`;
        }
        break;
      case 'project_lookup':
        if (res.isNav) {
          localized.text = `**${res.projectName}** open kar raha hoon...`;
        } else {
          localized.text = `**${res.projectName}** (${res.type})\n\n${res.summary}\n\n**Tech:** ${(res.tech || []).join(' • ')}`;
        }
        break;
      case 'recruiter_inquiry':
        localized.text = `Is portfolio ke according, **Manav Agarwal** ke paas frontend engineering, product UI/UX design systems, PWA tools platforms (**ToolVerse** - 70+ browser tools), aur interactive game engines (**Arcade OS** & **SHIFT-ZERO**) ka strong hands-on experience hai.\n\nWo abhi junior frontend roles aur freelance projects ke liye available hain!`;
        break;
      case 'developer_skills':
        localized.text = `**Manav Agarwal** Hyderabad, India ke ek Creative Frontend Developer hain.\n\n**Core Capabilities:**\n• ${PORTFOLIO_KNOWLEDGE.owner.skills.join('\n• ')}\n\nWo abhi open positions ke liye available hain.`;
        break;
      case 'contact_info':
        localized.text = `Tum **Manav Agarwal** ko email par **${PORTFOLIO_KNOWLEDGE.contact.email}** par contact kar sakte ho ya GitHub **${PORTFOLIO_KNOWLEDGE.contact.github}** par unke public projects dekh sakte ho.`;
        break;
      case 'portfolio_purpose':
        localized.text = `Yeh Manav Agarwal ka creative technologist portfolio hai — ek high-performance web system jisme product case studies, UI explorations aur Arcade OS retro cabinet shamil hain.`;
        break;
      case 'smalltalk_howareyou':
        localized.text = `Main bilkul badhiya hoon — portfolio explore karne mein help karne ke liye ready hoon. Tum kya dekhna chahoge?`;
        break;
      case 'smalltalk_greeting':
        localized.text = `Hello! Main **NIMO** hoon, tumhara portfolio assistant. Aaj Manav ke work ko explore karne mein main tumhari kaise help karoon?`;
        break;
      case 'smalltalk_thanks':
        localized.text = `Tumhara bahut swagat hai! Agar kuch aur poochna ho ya kahin navigate karna ho toh zaroor batao.`;
        break;
      case 'smalltalk_goodbye':
        localized.text = `Goodbye! Portfolio explore karte huye tumhara time accha beete.`;
        break;
      case 'out_of_scope':
        localized.text = `Main specifically is portfolio, Manav ke projects, web development concepts (HTML, CSS, JS), Arcade OS, aur site navigation mein help karne ke liye bana hoon!`;
        break;
    }
  } else if (lang === 'hi') {
    switch (id) {
      case 'nimo_creator':
        localized.text = `**NIMO** को **Manav Agarwal** ने इस इंटरैक्टिव पोर्टफोलियो के हिस्से के रूप में डिज़ाइन और इंजीनियर किया है।`;
        break;
      case 'nimo_code_language':
        localized.text = `**NIMO** मुख्य रूप से **JavaScript (ES Modules)** में बनाया गया है, और इसका UI HTML5 व CSS3 से तैयार हुआ है।`;
        break;
      case 'nimo_languages_supported':
        localized.text = `मैं **English**, **हिंदी (देवनागरी)** और **Hinglish (रोमन हिंदी)** तीनों भाषाओं में बात कर सकता हूँ। आप मुझसे किसी भी भाषा में पूछ सकते हैं।`;
        break;
      case 'nimo_api_architecture':
        localized.text = `मेरा मुख्य आर्किटेक्चर **local-first** है। मैं किसी बाहरी LLM या पेड AI API पर निर्भर रहने के बजाय लोकल इंटेंट रिकग्निशन और स्ट्रक्चर्ड पोर्टफोलियो डेटा का उपयोग करता हूँ।`;
        break;
      case 'nimo_limitations':
        localized.text = `मैं सब कुछ जानने वाला जनरल-परपज़ AI नहीं हूँ। मुझे मुख्य रूप से इस पोर्टफोलियो, इसके प्रोजेक्ट्स, साइट नेविगेशन और वेब डेवलपमेंट के सवालों के लिए बनाया गया है।`;
        break;
      case 'nimo_real_identity':
        localized.text = `मैं एक वास्तविक अस्सिटेंट हूँ जो इस वेबसाइट के अंदर काम करता है, लेकिन मैं इंसान या संवेदी जीव नहीं हूँ।`;
        break;
      case 'nimo_purpose':
        localized.text = `मुझे इस पोर्टफोलियो को एक्सप्लोर करना आसान और इंटरैक्टिव बनाने के लिए बनाया गया है।`;
        break;
      case 'nimo_how_it_works':
        localized.text = `मैं आपके मैसेज को टेक्स्ट नॉर्मलाइज़ेशन, इंटेंट डिटेक्शन और पेज कॉन्टेक्स्ट के ज़रिए प्रोसेस करता हूँ, और फिर जवाब देता हूँ या नेविगेट करता हूँ।`;
        break;
      case 'owner_identity':
        localized.text = `इस पोर्टफोलियो को **Manav Agarwal** ने डिज़ाइन और इंजीनियर किया है, जो हैदराबाद (भारत) में रहने वाले Creative Frontend Developer हैं।\n\nयह उनके वेब एप्लिकेशन्स, UI/UX डिज़ाइन कॉन्ससेप्ट्स, गेम सिस्टम्स और Arcade OS व NIMO जैसे इंटरैक्टिव एक्सपेरिमेंट्स को प्रदर्शित करता है।`;
        break;
      case 'nimo_ai_honesty':
        localized.text = `मैं इस पोर्टफोलियो के लिए बनाया गया एक website-aware अस्सिटेंट हूँ। मेरे जवाब और नेविगेशन स्ट्रक्चर्ड नॉलेज और इंटेंट रिकग्निशन के ज़रिए लोकल स्तर पर काम करते हैं, न कि किसी जनरल-परपज़ AI मॉडल पर।`;
        break;
      case 'nimo_identity':
        localized.text = `**NIMO** इस पोर्टफोलियो में built-in एक local-first, website-aware सहायक है। मैं आपको साइट नेविगेट करने, प्रोजेक्ट्स एक्सप्लोर करने, केस स्टडी समझने और वेब डेवलपमेंट के सवालों के जवाब देने में मदद कर सकता हूँ।`;
        break;
      case 'nimo_capabilities':
        localized.text = `मैं **NIMO** हूँ, आपका पोर्टफोलियो अस्सिटेंट! मैं आपको पोर्टफोलियो नेविगेट करने, प्रोजेक्ट्स खोजने, केस स्टडी समझने और वेब डेवलपमेंट के सवालों के जवाब देने में मदद कर सकता हूँ।`;
        break;
      case 'location_context':
        if (res.subType === 'case-study') {
          localized.text = `आप अभी **${res.title || 'Case Study'}** प्रोजेक्ट की केस स्टडी देख रहे हैं।`;
        } else if (res.subType === 'arcade') {
          localized.text = `आप अभी **Arcade OS** के अंदर हैं।`;
        } else {
          localized.text = `आप अभी पोर्टफोलियो के **${res.title || 'Home'}** सेक्शन पर हैं।\n\nआप मुझसे Projects, About, Contact या Arcade पर चलने के लिए कह सकते हैं।`;
        }
        break;
      case 'navigation':
        if (res.target === 'arcade') {
          localized.text = `Arcade OS खोल रहा हूँ! Cabinet इंटरफ़ेस लॉन्च हो रहा है...`;
        } else if (res.target === 'home') {
          localized.text = `पोर्टफोलियो के मुख्य (Top) सेक्शन पर ले चलता हूँ।`;
        } else if (res.target === 'about') {
          localized.text = `About सेक्शन (Log Origin) पर ले चलता हूँ।`;
        } else if (res.target === 'contact') {
          localized.text = `Contact सेक्शन खोल रहा हूँ।`;
        } else {
          localized.text = `ज़रूर, आपको Projects सेक्शन पर ले चलता हूँ।`;
        }
        break;
      case 'case_study_context':
        if (res.subType === 'summary') {
          localized.text = `**${res.title}**\n\n${res.summaryText || res.text}`;
        } else if (res.subType === 'tech') {
          localized.text = `**${res.title} में इस्तेमाल हुई टेक्नोलॉजीज़:**\n\n${(res.techList || []).join(' • ')}`;
        }
        break;
      case 'project_lookup':
        if (res.isNav) {
          localized.text = `**${res.projectName}** खोल रहा हूँ...`;
        } else {
          localized.text = `**${res.projectName}** (${res.type})\n\n${res.summary}\n\n**Tech:** ${(res.tech || []).join(' • ')}`;
        }
        break;
      case 'recruiter_inquiry':
        localized.text = `इस पोर्टफोलियो के अनुसार, **Manav Agarwal** को फ़्रंटएंड इंजीनियरिंग, UI/UX डिज़ाइन सिस्टम्स, PWA टूल प्लेटफॉर्म्स (**ToolVerse** - 70+ ब्राउज़र टूल्स) और गेम इंजनों (**Arcade OS** व **SHIFT-ZERO**) का बेहतरीन अनुभव है।`;
        break;
      case 'developer_skills':
        localized.text = `**Manav Agarwal** हैदराबाद, भारत में स्थित एक Creative Frontend Developer हैं।\n\n**मुख्य क्षमताएं:**\n• ${PORTFOLIO_KNOWLEDGE.owner.skills.join('\n• ')}`;
        break;
      case 'contact_info':
        localized.text = `आप **Manav Agarwal** से ईमेल **${PORTFOLIO_KNOWLEDGE.contact.email}** पर संपर्क कर सकते हैं या GitHub **${PORTFOLIO_KNOWLEDGE.contact.github}** पर उनके रिपॉजिटरीज़ देख सकते हैं।`;
        break;
      case 'portfolio_purpose':
        localized.text = `यह Manav Agarwal का क्रिएटिव टेक्नोलॉजिस्ट पोर्टफोलियो है — एक हाई-परफ़ॉर्मेंस वेब सिस्टम जिसमें प्रोडक्ट केस स्टडीज, UI एक्सप्लोरेशन्स और Arcade OS शामिल हैं।`;
        break;
      case 'smalltalk_howareyou':
        localized.text = `मैं बिल्कुल बढ़िया हूँ! पोर्टफोलियो एक्सप्लोर करने में आपकी मदद के लिए तैयार हूँ। आप क्या देखना चाहेंगे?`;
        break;
      case 'smalltalk_greeting':
        localized.text = `नमस्ते! मैं **NIMO** हूँ, आपका पोर्टफोलियो अस्सिटेंट। आज Manav के काम को एक्सप्लोर करने में मैं आपकी क्या मदद करूँ?`;
        break;
      case 'smalltalk_thanks':
        localized.text = `आपका स्वागत है! अगर आपको कुछ और पूछना हो या कहीं नेविगेट करना हो तो बेझिझक बताएं।`;
        break;
      case 'smalltalk_goodbye':
        localized.text = `नमस्ते! आपका पोर्टफोलियो एक्सप्लोर करने का अनुभव बेहतरीन रहे।`;
        break;
      case 'out_of_scope':
        localized.text = `मैं मुख्य रूप से इस पोर्टफोलियो, Manav के प्रोजेक्ट्स, वेब डेवलपमेंट और साइट नेविगेशन में मदद करने के लिए बनाया गया हूँ।`;
        break;
    }
  }

  // Localize Action Button Labels
  if (localized.actions && localized.actions.length > 0) {
    localized.actions = localized.actions.map(act => {
      let label = act.label;
      if (lang === 'hinglish') {
        if (label.includes('View Projects') || label.includes('Take me to Projects') || label.includes('Explore Projects') || label.includes('Show Projects')) label = 'Projects Dikhao';
        if (label.includes('Open Arcade')) label = 'Arcade Kholo';
        if (label.includes('Summarize')) label = 'Summary Do';
        if (label.includes('Contact')) label = 'Contact Karo';
        if (label.includes('What can you do')) label = 'Tum kya kar sakte ho?';
        if (label.includes('View NIMO Case Study')) label = 'NIMO Case Study Dekho';
      } else if (lang === 'hi') {
        if (label.includes('View Projects') || label.includes('Take me to Projects') || label.includes('Explore Projects') || label.includes('Show Projects')) label = 'प्रोजेक्ट्स दिखाओ';
        if (label.includes('Open Arcade')) label = 'आर्केड खोलो';
        if (label.includes('Summarize')) label = 'सारांश बताओ';
        if (label.includes('Contact')) label = 'संपर्क करें';
        if (label.includes('What can you do')) label = 'तुम क्या कर सकते हो?';
        if (label.includes('View NIMO Case Study')) label = 'NIMO केस स्टडी देखें';
      }
      return { ...act, label };
    });
  }

  return localized;
}

// ==========================================
// 8. QUERY PROCESSOR & MULTI-PART INTENT ENGINE
// ==========================================

let lastViewedProject = null;

function processUserQuery(rawInput) {
  const langDetection = detectLanguageStyle(rawInput);
  const detectedLang = langDetection.lang;

  if (langDetection.explicitCommand) {
    if (detectedLang === 'en') {
      return { text: "Sure, I've switched your preferred language to English." };
    } else if (detectedLang === 'hi') {
      return { text: "ज़रूर, अब से मैं हिंदी में बात करूँगा!" };
    } else {
      return { text: "Sure, ab se main Hinglish mein baat karunga!" };
    }
  }

  const normalizedInput = normalizeText(rawInput);
  const entities = extractEntities(normalizedInput);
  const locationCtx = getCurrentLocationContext();
  const activeCS = ConversationalContext.resolveProjectTarget(getCurrentCaseStudyContext());

  // Multi-part requests
  if (normalizedInput.includes('and open it') || normalizedInput.includes('and then open it') || normalizedInput.includes('and launch it')) {
    if (entities.project) {
      const canonicalRes = {
        intentId: 'project_lookup',
        isNav: true,
        projectName: entities.project.name,
        text: `**${entities.project.name}** (${entities.project.type})\n\n${entities.project.summary}\n\nOpening **${entities.project.name}** now...`,
        navigateTarget: entities.project.caseStudy
      };
      return localizeResponse(canonicalRes, detectedLang);
    }
  }

  if (normalizedInput.includes('who built this website') && normalizedInput.includes('contact')) {
    const canonicalRes = {
      intentId: 'owner_identity',
      text: `This portfolio was designed and engineered by **${PORTFOLIO_KNOWLEDGE.owner.name}**, a ${PORTFOLIO_KNOWLEDGE.owner.role} based in ${PORTFOLIO_KNOWLEDGE.owner.location}.\n\nYou can reach him via email at **${PORTFOLIO_KNOWLEDGE.contact.email}** or GitHub at **${PORTFOLIO_KNOWLEDGE.contact.github}**.`,
      actions: [{ label: 'Go to Contact Section', navigate: 'index.html#contact' }]
    };
    return localizeResponse(canonicalRes, detectedLang);
  }

  // Iterate registry by priority
  for (const intent of INTENT_REGISTRY) {
    if (intent.matches(normalizedInput, entities, locationCtx, activeCS)) {
      const response = intent.handler(normalizedInput, entities, locationCtx, activeCS);
      ConversationalContext.update(intent.id, entities.project, entities.section);
      return localizeResponse(response, detectedLang);
    }
  }

  // Multilingual Honest Fallback
  let fallbackRes = {
    intentId: 'fallback',
    text: `I don’t have enough information about that specific query yet. I can help with this portfolio, its projects, web development basics (HTML, CSS, JS, API), Arcade OS, NIMO, or navigation.`,
    actions: [
      { label: 'Take me to Projects', navigate: 'index.html#work' },
      { label: 'Open Arcade', navigate: 'arcade' }
    ]
  };

  if (detectedLang === 'hinglish') {
    fallbackRes.text = `Mujhe abhi exactly samajh nahi aaya. Tum portfolio, projects, web-development basics, Arcade, NIMO, ya navigation ke baare mein pooch sakte ho.`;
    fallbackRes.actions = [
      { label: 'Projects Dikhao', navigate: 'index.html#work' },
      { label: 'Arcade Kholo', navigate: 'arcade' }
    ];
  } else if (detectedLang === 'hi') {
    fallbackRes.text = `मुझे अभी पूरी तरह समझ नहीं आया। आप portfolio, projects, web-development basics, Arcade, NIMO या navigation के बारे में पूछ सकते हैं।`;
    fallbackRes.actions = [
      { label: 'प्रोजेक्ट्स दिखाओ', navigate: 'index.html#work' },
      { label: 'आर्केड खोलो', navigate: 'arcade' }
    ];
  }

  return fallbackRes;
}

// ==========================================
// 9. LOCATION CONTEXT RESOLVER
// ==========================================

function getCurrentLocationContext() {
  const chassis = document.querySelector('.cabinet-chassis');
  const isArcade = chassis?.classList.contains('is-scaled') ||
    document.body?.classList.contains('arcade-active') ||
    (window.ArcadeOS && window.ArcadeOS.osVisible) ||
    (window.ArcadeOS && !['BOOT'].includes(window.ArcadeOS.state));

  if (isArcade) {
    return {
      type: 'arcade',
      title: 'Arcade OS',
      description: "You're currently inside **Arcade OS**."
    };
  }

  const currentCaseStudy = getCurrentCaseStudyContext();
  if (currentCaseStudy) {
    lastViewedProject = currentCaseStudy;
    ConversationalContext.update(null, currentCaseStudy, null);
    return {
      type: 'case-study',
      id: currentCaseStudy.id,
      title: currentCaseStudy.title,
      description: `You're currently viewing the **${currentCaseStudy.title}** project case study.`,
      summary: currentCaseStudy.summary,
      tech: currentCaseStudy.tech,
      problem: currentCaseStudy.problem,
      features: currentCaseStudy.features
    };
  }

  const activeRailLink = document.querySelector('.section-progress-rail__link.is-active');
  const sectionId = activeRailLink?.getAttribute('data-section-id') || getViewportActiveSection();

  if (sectionId === 'work') {
    return {
      type: 'section',
      id: 'work',
      title: 'Projects',
      description: "You're viewing the **Projects** section, where Manav's portfolio work and case studies are listed."
    };
  }
  if (sectionId === 'about') {
    return {
      type: 'section',
      id: 'about',
      title: 'About',
      description: "You're currently viewing the **About** section."
    };
  }
  if (sectionId === 'skills') {
    return {
      type: 'section',
      id: 'skills',
      title: 'Skills',
      description: "You're currently viewing the **Skills** section."
    };
  }
  if (sectionId === 'experience') {
    return {
      type: 'section',
      id: 'experience',
      title: 'Experience',
      description: "You're viewing the **Experience** section."
    };
  }
  if (sectionId === 'contact') {
    return {
      type: 'section',
      id: 'contact',
      title: 'Contact',
      description: "You're on the **Contact** section."
    };
  }

  return {
    type: 'section',
    id: 'home',
    title: 'Home',
    description: "You're currently on the **Home** section of Manav's portfolio."
  };
}

function getViewportActiveSection() {
  const sections = ['contact', 'experience', 'skills', 'about', 'work', 'home'];
  const anchor = window.innerHeight * 0.44;
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= anchor) {
      return id;
    }
  }
  return 'home';
}

function getCurrentCaseStudyContext() {
  const theme = document.body?.getAttribute('data-project-theme');
  const path = window.location.pathname.toLowerCase();
  
  let matchId = null;
  if (theme) {
    matchId = theme === 'love' ? 'love-journey' : theme;
  } else {
    for (const p of PROJECTS_DB) {
      if (path.includes(p.caseStudy) || path.includes(p.id)) {
        matchId = p.id;
        break;
      }
    }
  }

  if (!matchId) return null;
  const project = PROJECTS_DB.find(p => p.id === matchId || p.category === matchId);
  
  const title = project?.name || document.querySelector('h1')?.innerText || 'Case Study';
  const tagline = document.querySelector('.tagline, .cs-hero-subtitle')?.innerText || project?.summary || '';
  
  const problemEl = document.querySelector('.cs-split-content h2, .cs-section-title');
  const problemText = problemEl ? problemEl.closest('section')?.innerText.replace(/\n+/g, ' ').substring(0, 250) + '...' : 'Focuses on user interaction and visual architecture.';

  const featureItems = Array.from(document.querySelectorAll('.cs-glass-panel, .cs-feature-grid li, .cs-body li'))
    .slice(0, 3)
    .map(el => el.innerText.trim())
    .filter(Boolean);

  const featuresText = featureItems.length > 0 ? featureItems.join(' • ') : 'Modular component hierarchy, responsive optimization, and polished interaction states.';

  return {
    id: matchId,
    title,
    summary: tagline || project?.summary || 'Product case study detailing engineering architecture and design decisions.',
    tech: project?.tech || ['HTML', 'CSS', 'JavaScript'],
    problem: problemText,
    features: featuresText
  };
}

// ==========================================
// 10. DOM & UI WIDGET LIFECYCLE
// ==========================================

function getSuggestedPrompts(lang) {
  if (lang === 'hinglish') {
    return [
      "Projects Dikhao",
      "Mujhe Projects pe le chalo",
      "Ye website kisne banayi",
      "Arcade Kholo",
      "Tum kya kar sakte ho?"
    ];
  }
  if (lang === 'hi') {
    return [
      "प्रोजेक्ट्स दिखाओ",
      "मुझे प्रोजेक्ट्स पर ले चलो",
      "यह वेबसाइट किसने बनाई?",
      "आर्केड खोलो",
      "तुम क्या कर सकते हो?"
    ];
  }
  return [
    "Show me the best projects",
    "Take me to Projects",
    "Tell me about this website",
    "Open Arcade",
    "What can you do?"
  ];
}

// Public Usage Guardrail Helpers
export function isCodeGenerationRequest(text) {
  const normalized = String(text || '').toLowerCase().trim();

  // Exclude purely informational questions about tech stack/languages/skills
  const isInformationalTech = /what (tech|language|stack|framework|library|tools?)|how (was|is) .* built|what is .* written in/i.test(normalized);
  if (isInformationalTech && !/(write|generate|create|build|give me|make) (code|script|app|component|function|program|snippet|html|css|js)/i.test(normalized)) {
    return false;
  }

  const codePatterns = [
    /\b(write|generate|create|build|make|give me|produce|code)\b.*\b(code|script|app|application|website|page|component|function|program|class|algorithm|snippet|html|css|javascript|js|python|react)\b/i,
    /\b(react component|html page|css layout|javascript function|python script|node service|full stack app|saas app|code snippet)\b/i,
    /\b(write a|build me a|make me a|code a|create a)\b.*\b(app|website|game|tool|bot|component|script|snippet|function)\b/i,
    /\b(give me the code|show me the code|write code for|generate code for|write code)\b/i
  ];

  return codePatterns.some(pattern => pattern.test(normalized));
}

export function sanitizeCodeOutput(replyText, userText) {
  if (!replyText || typeof replyText !== 'string') return replyText;

  const isCodeReq = isCodeGenerationRequest(userText);
  const codeBlockRegex = /```[a-z]*\n([\s\S]*?)\n```/gi;

  let sanitized = replyText.replace(codeBlockRegex, (match, codeContent) => {
    const lines = codeContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 2) {
      if (isCodeReq && lines.length > 8) {
        return `*Nice try 😏 I’m Manav’s portfolio companion, not your free coding department. I can explain the approach though. ✨*`;
      }
      const cappedCode = lines.slice(0, 2).join('\n');
      return `\`\`\`javascript\n${cappedCode}\n// [Code output capped at 2 lines max] ✨\n\`\`\``;
    }
    return match;
  });

  return sanitized;
}

export function initNimo() {
  window.NIMO = {
    processUserQuery,
    getCurrentLocationContext,
    INTENT_REGISTRY,
    GLOSSARY_DB,
    ConversationalContext,
    detectLanguageStyle,
    setSessionLanguage,
    getSessionLanguage,
    isCodeGenerationRequest,
    sanitizeCodeOutput,
    authorizeArcadeDeveloperMode: () => window.ArcadeDeveloperMode?.authorizeFromNimo()
  };
  if (document.getElementById('nimo-widget')) return;

  const widget = createWidgetDOM();
  document.body.appendChild(widget);

  const launcher = document.getElementById('nimo-launcher');
  const panel = document.getElementById('nimo-panel');
  const closeBtn = document.getElementById('nimo-close-btn');
  const form = document.getElementById('nimo-input-form');
  const input = document.getElementById('nimo-input');
  const messagesContainer = document.getElementById('nimo-messages');
  const suggestionsContainer = document.getElementById('nimo-suggestions');

  let isOpen = false;

  const sessionLog = JSON.parse(sessionStorage.getItem('nimo_history') || '[]');

  if (sessionLog.length > 0) {
    sessionLog.forEach(msg => renderMessage(msg.role, msg.text, false));
  } else {
    const welcome = getWelcomeMessage(getSessionLanguage());
    renderMessage('assistant', welcome, false);
    renderSuggestions();
  }

  launcher.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel();
    });
  }
  widget.addEventListener('click', (e) => {
    if (e.target.closest('#nimo-close-btn, .nimo-close-btn')) {
      e.stopPropagation();
      closePanel();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleUserMessage(text);
  });

  suggestionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('nimo-chip')) {
      const promptText = e.target.textContent;
      handleUserMessage(promptText);
    }
  });

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    }
  }, { capture: true });

  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add('active');
    panel.removeAttribute('aria-hidden');
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
  }

  window.NIMO.openNimo = openPanel;
  window.NIMO.closeNimo = closePanel;
  window.NIMO.toggleNimo = togglePanel;

  function getWelcomeMessage(lang) {
    if (lang === 'hinglish') {
      return `Hi! Main **NIMO** hoon, tumhara portfolio assistant.\n\nMain tumhe site navigate karne, case studies explain karne, web development questions ke answer dene, ya Arcade OS launch karne mein help kar sakta hoon. Aaj main tumhari kya help karoon?`;
    }
    if (lang === 'hi') {
      return `नमस्ते! मैं **NIMO** हूँ, आपका पोर्टफोलियो अस्सिटेंट।\n\nमैं आपको पोर्टफोलियो नेविगेट करने, केस स्टडीज समझने, वेब डेवलपमेंट के सवालों के जवाब देने या Arcade OS खोलने में मदद कर सकता हूँ। आज मैं आपकी क्या मदद करूँ?`;
    }
    return `Hi! I'm **NIMO**, your portfolio assistant.\n\nI can help you navigate, explain case studies, answer web development questions, or launch Arcade OS. How can I help you today?`;
  }

  let isRequestPending = false;
  let lastSubmitTime = 0;

  async function handleUserMessage(userText) {
    if (isRequestPending) return;

    const now = Date.now();
    if (now - lastSubmitTime < 1800) {
      renderMessage('user', userText, true);
      renderMessage('assistant', "Easy there 😭 My circuits need a second. ⚡", true);
      return;
    }
    lastSubmitTime = now;

    renderMessage('user', userText, true);
    saveToHistory('user', userText);

    // 1. Input Length Guard (< 350 chars)
    if (userText.length > 350) {
      renderMessage('assistant', "Whoa, that’s a whole novel 😭 Keep it shorter and I’ll take a look. ⚡", true);
      saveToHistory('assistant', "Whoa, that’s a whole novel 😭 Keep it shorter and I’ll take a look. ⚡");
      return;
    }

    // 2. Process local deterministic intent engine first
    const localResponse = processUserQuery(userText);
    const isLocalFallback = localResponse.intentId === 'fallback';

    if (!isLocalFallback) {
      // Keep confident local response 100% local!
      const typingEl = showTypingIndicator();
      setTimeout(() => {
        typingEl.remove();
        renderMessage('assistant', localResponse.text, true, localResponse.actions);
        saveToHistory('assistant', localResponse.text);
        renderSuggestions();
        if (localResponse.navigateTarget) {
          setTimeout(() => {
            executeNavigation(localResponse.navigateTarget);
          }, 600);
        }
      }, 150);
      return;
    }

    // 3. Code Request Classification & 5-Request Session Quota Check
    const isCodeReq = isCodeGenerationRequest(userText);
    let codeRequestsUsed = parseInt(sessionStorage.getItem('nimo_code_requests_used') || '0', 10);

    if (isCodeReq) {
      if (codeRequestsUsed >= 5) {
        renderMessage('assistant', "Code credits exhausted 😌⚡ I’m here to show you Manav’s work now.", true);
        saveToHistory('assistant', "Code credits exhausted 😌⚡ I’m here to show you Manav’s work now.");
        renderSuggestions();
        return;
      }
      codeRequestsUsed += 1;
      sessionStorage.setItem('nimo_code_requests_used', codeRequestsUsed.toString());
    }

    // 4. Remote Fallback -> Consult Cloudflare Worker / OpenRouter API
    isRequestPending = true;
    if (input) input.disabled = true;
    const sendBtn = document.getElementById('nimo-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    const typingEl = showTypingIndicator();
    const locCtx = getCurrentLocationContext();
    const detectedLangInfo = detectLanguageStyle(userText);
    const contextPayload = {
      page: locCtx?.title || locCtx?.type || 'home',
      section: locCtx?.id || locCtx?.title || 'home',
      project: locCtx?.id || locCtx?.title || null,
      language: detectedLangInfo?.lang || getSessionLanguage()
    };

    try {
      const backendResult = await fetchNimoBackendReply(userText, contextPayload);
      typingEl.remove();

      if (backendResult && backendResult.success && backendResult.reply) {
        let finalReply = sanitizeCodeOutput(backendResult.reply, userText);
        const actions = (backendResult.actions && backendResult.actions.length > 0)
          ? backendResult.actions
          : localResponse.actions;

        renderMessage('assistant', finalReply, true, actions);
        saveToHistory('assistant', finalReply);
      } else {
        renderMessage('assistant', localResponse.text, true, localResponse.actions);
        saveToHistory('assistant', localResponse.text);
      }
    } catch (err) {
      typingEl.remove();
      renderMessage('assistant', localResponse.text, true, localResponse.actions);
      saveToHistory('assistant', localResponse.text);
    } finally {
      isRequestPending = false;
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      renderSuggestions();
    }
  }

  function renderMessage(role, text, animate = true, actions = []) {
    const bubble = document.createElement('div');
    bubble.className = `nimo-msg nimo-msg-${role} ${animate ? 'reveal' : ''}`;
    
    let formatted = escapeHTML(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = `
      <div class="nimo-msg-content">${formatted}</div>
    `;

    if (actions && actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'nimo-msg-actions';
      actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'nimo-action-btn';
        btn.textContent = act.label;
        btn.addEventListener('click', () => {
          if (act.navigate) executeNavigation(act.navigate);
          if (act.query) handleUserMessage(act.query);
          if (act.action === 'openArcadeServiceAccess') {
            window.ArcadeDeveloperMode?.openServiceAccess();
          }
        });
        actionsDiv.appendChild(btn);
      });
      bubble.appendChild(actionsDiv);
    }

    messagesContainer.appendChild(bubble);
    scrollToBottom();
  }

  function renderSuggestions() {
    suggestionsContainer.innerHTML = '';
    const prompts = getSuggestedPrompts(getSessionLanguage());
    prompts.forEach(prompt => {
      const chip = document.createElement('button');
      chip.className = 'nimo-chip';
      chip.textContent = prompt;
      suggestionsContainer.appendChild(chip);
    });
  }

  function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'nimo-msg nimo-msg-assistant nimo-typing';
    typing.innerHTML = `<div class="nimo-typing-dots"><span></span><span></span><span></span></div>`;
    messagesContainer.appendChild(typing);
    scrollToBottom();
    return typing;
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function saveToHistory(role, text) {
    sessionLog.push({ role, text });
    if (sessionLog.length > 20) sessionLog.shift();
    sessionStorage.setItem('nimo_history', JSON.stringify(sessionLog));
  }
}

function executeNavigation(target) {
  if (target === 'arcade') {
    if (typeof window.enterArcade === 'function') {
      window.enterArcade();
    } else {
      window.location.href = 'index.html#intro-sequence';
    }
    return;
  }

  if (target.startsWith('index.html#')) {
    const hash = target.split('#')[1];
    const isMainPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('project-');
    
    if (isMainPage) {
      if (typeof window.exitArcadeToPortfolio === 'function') {
        window.exitArcadeToPortfolio(hash);
      } else {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.location.href = target;
    }
    return;
  }

  window.location.href = target;
}

function createWidgetDOM() {
  const container = document.createElement('div');
  container.id = 'nimo-widget';
  container.className = 'nimo-widget';

  const logoSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="26" height="26" class="nimo-logo-svg">
      <defs>
        <linearGradient id="nimo-grad-icon" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#a855f7"/>
          <stop offset="0.5" stop-color="#6366f1"/>
          <stop offset="1" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="54" height="54" rx="17" fill="#0b1020"/>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="none" stroke="url(#nimo-grad-icon)" stroke-width="2.5" opacity="0.95"/>
      <path d="M18 45V19h7.1l13.8 16.2V19H46v26h-6.8L25 28.5V45H18Z" fill="url(#nimo-grad-icon)"/>
      <circle cx="47.5" cy="16.5" r="4.5" fill="#67e8f9"/>
      <circle cx="47.5" cy="16.5" r="2" fill="#ecfeff"/>
    </svg>
  `;

  container.innerHTML = `
    <button id="nimo-launcher" class="nimo-launcher" aria-label="Open AI Assistant NIMO" aria-expanded="false">
      <div class="nimo-mascot" aria-hidden="true">
        <span class="nimo-mascot-halo"></span>
        <span class="nimo-mascot-antenna"></span>
        <span class="nimo-mascot-head">
          <span class="nimo-mascot-ear nimo-mascot-ear-left"></span>
          <span class="nimo-mascot-ear nimo-mascot-ear-right"></span>
          <span class="nimo-mascot-face">
            <span class="nimo-mascot-eye"></span>
            <span class="nimo-mascot-eye"></span>
          </span>
        </span>
        <span class="nimo-mascot-body"><span>N</span></span>
        <span class="nimo-mascot-arm nimo-mascot-arm-left"></span>
        <span class="nimo-mascot-arm nimo-mascot-arm-right"></span>
        <span class="nimo-mascot-thruster"></span>
      </div>
      <span class="sr-only">NIMO AI</span>
    </button>

    <div id="nimo-panel" class="nimo-panel" role="dialog" aria-label="NIMO Assistant" aria-hidden="true">
      <div class="nimo-header">
        <div class="nimo-header-brand">
          <div class="nimo-avatar">
            ${logoSVG}
          </div>
          <div class="nimo-header-info">
            <span class="nimo-name">NIMO</span>
            <span class="nimo-status">Portfolio Assistant</span>
          </div>
        </div>
        <button id="nimo-close-btn" class="nimo-close-btn" aria-label="Close Assistant" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div id="nimo-messages" class="nimo-messages"></div>
      <div id="nimo-suggestions" class="nimo-suggestions"></div>

      <form id="nimo-input-form" class="nimo-input-form">
        <input 
          type="text" 
          id="nimo-input" 
          class="nimo-input" 
          placeholder="Ask NIMO anything..." 
          autocomplete="off" 
          data-arcade-control="text"
        />
        <button type="submit" id="nimo-send-btn" class="nimo-send-btn" aria-label="Send Message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  `;
  return container;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
