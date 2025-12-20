import { FEMALE_NAMES } from '../data/femaleNames';
import { MALE_NAMES } from '../data/maleNames';

export interface GenderResult {
  gender: 'F' | 'M' | 'U';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Rileva il genere dal nome proprio.
 *
 * Logica:
 * 1. Cerca prima nelle liste esplicite (alta confidenza)
 * 2. Usa euristiche basate sui suffissi italiani (media confidenza)
 * 3. Ritorna 'U' (unknown) se non determinabile (bassa confidenza)
 *
 * @param firstName - Il nome proprio da analizzare
 * @returns Oggetto con genere ('F', 'M', 'U') e livello di confidenza
 */
export function detectGender(firstName: string): GenderResult {
  if (!firstName || typeof firstName !== 'string') {
    return { gender: 'U', confidence: 'low' };
  }

  // Normalizza: minuscolo, rimuovi spazi, rimuovi accenti
  const normalized = firstName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z]/g, ''); // Rimuove caratteri non alfabetici

  if (!normalized) {
    return { gender: 'U', confidence: 'low' };
  }

  // Check liste esplicite (alta confidenza)
  if (FEMALE_NAMES.has(normalized)) {
    return { gender: 'F', confidence: 'high' };
  }

  if (MALE_NAMES.has(normalized)) {
    return { gender: 'M', confidence: 'high' };
  }

  // Euristiche per nomi non in lista (italiano)

  // Nomi che finiscono in -a sono tipicamente femminili
  // ECCEZIONE: nomi che finiscono in -ia possono essere ambigui (Nicola, Luca -> maschili)
  // Ma Andrea e' maschile ed e' gia' nella lista
  if (normalized.endsWith('a') && normalized.length > 2) {
    // Esclusioni specifiche per nomi maschili che finiscono in -a
    const maleEndingInA = ['luca', 'andrea', 'nicola', 'mattia', 'elia', 'isaia', 'geremia', 'giona', 'osea', 'battista'];
    if (!maleEndingInA.includes(normalized)) {
      return { gender: 'F', confidence: 'medium' };
    }
  }

  // Nomi che finiscono in -o sono tipicamente maschili
  if (normalized.endsWith('o')) {
    return { gender: 'M', confidence: 'medium' };
  }

  // Nomi che finiscono in -e possono essere entrambi (Simone M, Irene F)
  // Non facciamo assunzioni

  // Suffissi femminili comuni
  if (
    normalized.endsWith('ella') ||
    normalized.endsWith('etta') ||
    normalized.endsWith('ina') ||
    normalized.endsWith('essa') ||
    normalized.endsWith('ilde') ||
    normalized.endsWith('etta')
  ) {
    return { gender: 'F', confidence: 'medium' };
  }

  // Suffissi maschili comuni
  if (
    normalized.endsWith('ino') ||
    normalized.endsWith('ello') ||
    normalized.endsWith('etto') ||
    normalized.endsWith('one') ||
    normalized.endsWith('ardo') ||
    normalized.endsWith('aldo')
  ) {
    return { gender: 'M', confidence: 'medium' };
  }

  // Non determinabile
  return { gender: 'U', confidence: 'low' };
}
