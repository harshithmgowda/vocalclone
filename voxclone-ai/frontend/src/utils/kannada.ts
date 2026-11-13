/**
 * Kannada phonetics and script transliteration utility
 * Converts native Kannada unicode characters into phonetic Latin script
 * for high-accuracy neural flow matching synthesis.
 */

const KANNADA_REGEX = /[\u0C80-\u0CFF]/;

export function isKannada(text: string): boolean {
  return KANNADA_REGEX.test(text);
}

export function kannadaToPhonetic(text: string): string {
  if (!isKannada(text)) return text;

  // Remove zero-width non-joiners
  const clean = text.replace(/[\u200C\u200D]/g, '');

  const vowels: Record<string, string> = {
    '\u0C85': 'a', '\u0C86': 'aa', '\u0C87': 'i', '\u0C88': 'ee',
    '\u0C89': 'u', '\u0C8A': 'oo', '\u0C8B': 'ru', '\u0C8E': 'e',
    '\u0C8F': 'ee', '\u0C90': 'ai', '\u0C92': 'o', '\u0C93': 'oo',
    '\u0C94': 'au'
  };

  const consonants: Record<string, string> = {
    '\u0C95': 'k', '\u0C96': 'kh', '\u0C97': 'g', '\u0C98': 'gh', '\u0C99': 'ng',
    '\u0C9A': 'ch', '\u0C9B': 'chh', '\u0C9C': 'j', '\u0C9D': 'jh', '\u0C9E': 'ny',
    '\u0C9F': 't', '\u0CA0': 'th', '\u0CA1': 'd', '\u0CA2': 'dh', '\u0CA3': 'n',
    '\u0CA4': 'th', '\u0CA5': 'thh', '\u0CA6': 'd', '\u0CA7': 'dh', '\u0CA8': 'n',
    '\u0CAA': 'p', '\u0CAB': 'ph', '\u0CAC': 'b', '\u0CAD': 'bh', '\u0CAE': 'm',
    '\u0CAF': 'y', '\u0CB0': 'r', '\u0CB1': 'r', '\u0CB2': 'l', '\u0CB3': 'l',
    '\u0CB5': 'v', '\u0CB6': 'sh', '\u0CB7': 'sh', '\u0CB8': 's', '\u0CB9': 'h'
  };

  const matras: Record<string, string> = {
    '\u0CBE': 'aa', '\u0CBF': 'i', '\u0CC0': 'ee', '\u0CC1': 'u',
    '\u0CC2': 'oo', '\u0CC3': 'ru', '\u0CC6': 'e', '\u0CC7': 'ee',
    '\u0CC8': 'ai', '\u0CCA': 'o', '\u0CCB': 'oo', '\u0CCC': 'au'
  };

  const virama = '\u0CCD';
  const anusvara = '\u0C82';
  const visarga = '\u0C83';

  const result: string[] = [];
  const n = clean.length;
  let i = 0;

  while (i < n) {
    const ch = clean[i];
    if (vowels[ch]) {
      result.push(vowels[ch]);
      i += 1;
    } else if (consonants[ch]) {
      const c = consonants[ch];
      if (i + 1 < n) {
        const next = clean[i + 1];
        if (next === virama) {
          result.push(c);
          i += 2;
        } else if (matras[next]) {
          result.push(c + matras[next]);
          i += 2;
        } else if (next === anusvara) {
          result.push(c + 'am');
          i += 2;
        } else if (next === visarga) {
          result.push(c + 'aha');
          i += 2;
        } else {
          result.push(c + 'a');
          i += 1;
        }
      } else {
        result.push(c + 'a');
        i += 1;
      }
    } else if (ch === anusvara) {
      result.push('m');
      i += 1;
    } else if (ch === visarga) {
      result.push('h');
      i += 1;
    } else {
      result.push(ch);
      i += 1;
    }
  }

  return result.join('');
}

export interface PresetItem {
  label: string;
  text: string;
  lang: 'en' | 'kn';
  phoneticPreview?: string;
}

export const KANNADA_PRESETS: PresetItem[] = [
  {
    label: 'ನಮಸ್ಕಾರ (Greeting)',
    text: 'ನಮಸ್ಕಾರ! ವೋಕ್ಸ್‌ಕ್ಲೋನ್ ಎಐಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮದೇ ಧ್ವನಿಯಲ್ಲಿ ಯಾವುದೇ ವಾಕ್ಯವನ್ನು ಮಾತನಾಡಿ.',
    lang: 'kn',
    phoneticPreview: 'namaskaara! vooks‌kloon eaige svaagatha. nimmadee dhvaniyalli yaavudee vaakyavannu maatanaadi.'
  },
  {
    label: 'ಸುದ್ದಿ ವಾಚನ (News)',
    text: 'ಇಂದಿನ ಪ್ರಮುಖ ಸುದ್ದಿ: ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮತ್ತು ನರಮಂಡಲ ತಂತ್ರಜ್ಞಾನದಲ್ಲಿ ಭಾರತೀಯ ಭಾಷೆಗಳಿಗೆ ಹೊಸ ಶಕ್ತಿ ಬಂದಿದೆ.',
    lang: 'kn',
    phoneticPreview: 'indina pramukha suddi: kruthaka buddhimatthe matthu naramandala thanthrajnaanadalli bhaaratheeya bhaashegalige hosa shakthi bandhide.'
  },
  {
    label: 'ಕನ್ನಡ ಸಾಹಿತ್ಯ (Literature)',
    text: 'ಕನ್ನಡ ನಮ್ಮ ಹೆಮ್ಮೆ, ನಮ್ಮ ಧ್ವನಿ. ಕಾವ್ಯದ ಇಂಪನ್ನು ಮತ್ತು ಸಹಜ ಭಾವನೆಗಳನ್ನು ನಿಮ್ಮ ಸ್ವಂತ ಧ್ವನಿಯಲ್ಲಿ ಆಲಿಸಿ.',
    lang: 'kn',
    phoneticPreview: 'kannada namma hemme, namma dhvani. kaavyada impannu matthu sahaja bhaavanegalannu nimma svantha dhvaniyalli aalisi.'
  },
  {
    label: 'ಸಂಭಾಷಣೆ (Conversational)',
    text: 'ಹೇಗಿದ್ದೀರಾ? ಇವತ್ತಿನ ಕೆಲಸಗಳೆಲ್ಲ ಮುಗೀತಾ? ಬನ್ನಿ ಸ್ವಲ್ಪ ಹೊತ್ತು ಆರಾಮಾಗಿ ಮಾತನಾಡೋಣ.',
    lang: 'kn',
    phoneticPreview: 'heegiddeeraa? ivatthina kelasagalella mugeethaa? banni svalpa hotthu aaraamaagi maatanaadona.'
  }
];

export const ENGLISH_PRESETS: PresetItem[] = [
  {
    label: 'Podcast Intro',
    text: 'Welcome back to the podcast. Today, we delve deep into the bleeding edge of neural interfaces and voice generation.',
    lang: 'en'
  },
  {
    label: 'Tutorial Narration',
    text: 'In this step-by-step walkthrough, we configure the local environment, test inference speed, and verify the model output.',
    lang: 'en'
  },
  {
    label: 'Sci-Fi Voiceover',
    text: 'Telemetry confirmed. Neural synthetic flow online. All secondary vector thrusters locked on deep space trajectory.',
    lang: 'en'
  },
  {
    label: 'Dynamic Audiobook',
    text: 'The evening shadow lengthened across the ancient library, whispering forgotten secrets to those patient enough to listen.',
    lang: 'en'
  }
];
