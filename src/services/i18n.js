// Internationalization & Google Translate Integration for NexusWX
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ml', label: 'മലയാളം', short: 'മല' },
  { code: 'hi', label: 'हिन्दी', short: 'ഹി' },
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

/**
 * Programmatically trigger 100% full-page translation via Google Translate
 */
export function triggerGoogleTranslate(langCode) {
  try {
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode === 'en' ? '' : langCode;
      selectElem.dispatchEvent(new Event('change'));
    } else {
      // Fallback: Cookie based Google Translate trigger
      const target = langCode === 'en' ? '' : langCode;
      document.cookie = `googtrans=/en/${target}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${target}; path=/`;
    }
  } catch (err) {
    console.warn("Google Translate trigger warning:", err);
  }
}

/**
 * Auto-suggest language based on location region (e.g. Kerala -> Malayalam)
 */
export function suggestLanguageForLocation(locationObj) {
  if (!locationObj) return 'en';
  const locStr = `${locationObj.name || ''} ${locationObj.state || ''} ${locationObj.city || ''} ${locationObj.country || ''}`.toLowerCase();

  if (locStr.includes('kerala') || locStr.includes('kochi') || locStr.includes('thrissur') || locStr.includes('trivandrum') || locStr.includes('calicut') || locStr.includes('malappuram') || locStr.includes('kottayam') || locStr.includes('palakkad') || locStr.includes('kollam') || locStr.includes('alappuzha') || locStr.includes('kannur') || locStr.includes('kasaragod') || locStr.includes('wayanad') || locStr.includes('idukki') || locStr.includes('pathanamthitta') || locStr.includes('avitattathur') || locStr.includes('avittathur') || locStr.includes('irinjalakuda')) {
    return 'ml'; // Auto-suggest Malayalam for Kerala locations
  } else if (locStr.includes('spain') || locStr.includes('madrid') || locStr.includes('barcelona') || locStr.includes('mexico')) {
    return 'es';
  } else if (locStr.includes('delhi') || locStr.includes('mumbai') || locStr.includes('rajasthan') || locStr.includes('bihar') || locStr.includes('up')) {
    return 'hi';
  }
  return 'en';
}
