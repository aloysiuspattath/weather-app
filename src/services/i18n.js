// Internationalization (i18n) Translations for NexusWX
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ml', label: 'മലയാളം', short: 'മല' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं' },
  { code: 'es', label: 'Español', short: 'ES' }
];

export const translations = {
  en: {
    dashboard: "Dashboard",
    news: "News",
    searchPlaceholder: "Search location...",
    currentConditions: "CURRENT CONDITIONS",
    feelsLike: "Feels like",
    high: "H",
    low: "L",
    humidity: "HUMIDITY",
    wind: "WIND",
    uvIndex: "UV INDEX",
    pressure: "PRESSURE",
    hourlyForecast: "HOURLY FORECAST",
    dailyForecast: "7-DAY FORECAST",
    liveRadar: "LIVE RADAR TELEMETRY",
    smartRainPredictor: "SMART RAIN PREDICTOR",
    weatherWarnings: "METEOROLOGICAL ADVISORIES & HAZARD WARNINGS",
    airQuality: "AIR QUALITY INDEX",
    multiModelConsensus: "MULTI-MODEL CONSENSUS",
    now: "NOW",
    today: "TODAY"
  },
  ml: {
    dashboard: "ഡാഷ്‌ബോർഡ്",
    news: "വാർത്തകൾ",
    searchPlaceholder: "സ്ഥലം തിരയുക...",
    currentConditions: "ഇപ്പോഴത്തെ കാലാവസ്ഥ",
    feelsLike: "അനുഭവപ്പെടുന്നത്",
    high: "പരമാവധി",
    low: "കുറഞ്ഞത്",
    humidity: "ഈർപ്പം",
    wind: "കാറ്റ്",
    uvIndex: "UV സൂചിക",
    pressure: "മർദ്ദം",
    hourlyForecast: "മണിക്കൂർ തിരിച്ചുള്ള പ്രവചനം",
    dailyForecast: "7-ദിവസത്തെ പ്രവചനം",
    liveRadar: "ലൈവ് റാഡാർ",
    smartRainPredictor: "മഴ സാധ്യത പ്രവചനം",
    weatherWarnings: "കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ",
    airQuality: "വായു ഗുണനിലവാരം",
    multiModelConsensus: "മൾട്ടി-മോഡൽ പ്രവചനം",
    now: "ഇപ്പോൾ",
    today: "ഇന്ന്"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    news: "समाचार",
    searchPlaceholder: "स्थान खोजें...",
    currentConditions: "वर्तमान स्थिति",
    feelsLike: "महसूस हो रहा है",
    high: "अधिकतम",
    low: "न्यूनतम",
    humidity: "नमी",
    wind: "हवा",
    uvIndex: "यूवी इंडेक्स",
    pressure: "दबाव",
    hourlyForecast: "प्रति घंटा पूर्वानुमान",
    dailyForecast: "7-दिवसीय पूर्वानुमान",
    liveRadar: "लाइव रडार",
    smartRainPredictor: "स्मार्ट वर्षा पूर्वानुमान",
    weatherWarnings: "मौसम चेतावनी और परामर्श",
    airQuality: "वायु गुणवत्ता सूचकांक",
    multiModelConsensus: "मल्टी-मॉडल सर्वसम्मति",
    now: "अभी",
    today: "आज"
  },
  es: {
    dashboard: "Panel",
    news: "Noticias",
    searchPlaceholder: "Buscar ubicación...",
    currentConditions: "CONDICIONES ACTUALES",
    feelsLike: "Sensación térmica",
    high: "Máx",
    low: "Mín",
    humidity: "HUMEDAD",
    wind: "VIENTO",
    uvIndex: "ÍNDICE UV",
    pressure: "PRESIÓN",
    hourlyForecast: "PRONÓSTICO POR HORA",
    dailyForecast: "PRONÓSTICO DE 7 DÍAS",
    liveRadar: "RADAR EN VIVO",
    smartRainPredictor: "PREDICTOR DE LLUVIA",
    weatherWarnings: "ALERTAS METEOROLÓGICAS",
    airQuality: "CALIDAD DEL AIRE",
    multiModelConsensus: "CONSENSO MULTI-MODELO",
    now: "AHORA",
    today: "HOY"
  }
};

export function getTranslation(lang, key) {
  const langObj = translations[lang] || translations.en;
  return langObj[key] || translations.en[key] || key;
}
