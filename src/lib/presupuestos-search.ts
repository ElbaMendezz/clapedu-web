/**
 * Utility functions for flexible, typo-tolerant and diacritic-insensitive search
 * specifically tuned for Colombian / Bucaramanga neighborhoods, terms, and Spanish phonetics.
 */

// Normalizes text by removing accents/diacritics, lowercase and non-alphanumeric chars
export const normalizeSearchStr = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (á->a, é->e, í->i, ó->o, ú->u, ñ->n)
    .replace(/[^a-z0-9\s]/g, ' ')   // strip punctuation/dots like A.H. -> A H
    .replace(/\s+/g, ' ')
    .trim();
};

// Spanish phonetic and colloquial simplifications (c/s/z, b/v, rr/r, ll/y, etc.)
export const phoneticSimplify = (str: string): string => {
  let s = normalizeSearchStr(str);
  if (!s) return '';

  // Remove common filler words that people often prepend
  s = s.replace(/\b(barrio|comuna|asentamiento|asentamientos|sector|etapa|el|la|los|las|de|del|ah|a h|san|santa)\b/g, ' ');

  // Roman numerals / numbers
  s = s.replace(/\bii\b/g, '2')
       .replace(/\biii\b/g, '3')
       .replace(/\bi\b/g, '1')
       .replace(/\bprimera\b/g, '1')
       .replace(/\bsegunda\b/g, '2');

  // Phonetic Spanish equivalents
  s = s.replace(/v/g, 'b');                                  // v/b interchange
  s = s.replace(/z/g, 's');                                  // z -> s
  s = s.replace(/c(?=[eiy])/g, 's');                         // ce, ci, cy -> se, si, sy
  s = s.replace(/k/g, 'c');                                  // k -> c
  s = s.replace(/qu(?=[ei])/g, 'c');                         // que, qui -> ce, ci
  s = s.replace(/rr/g, 'r');                                 // rr -> r (e.g. morrorrico -> mororico)
  s = s.replace(/ll/g, 'y');                                 // ll -> y (e.g. playita -> plaillita)
  s = s.replace(/h/g, '');                                   // silent h in Spanish
  s = s.replace(/\s+/g, ' ').trim();

  return s;
};

// Simple edit distance check (allows 1 typo for words of length >= 4)
export const isCloseMatch = (wordA: string, wordB: string): boolean => {
  if (wordA === wordB) return true;
  if (Math.abs(wordA.length - wordB.length) > 1) return false;
  if (wordA.length < 4 && wordB.length < 4) return false;

  let edits = 0;
  let i = 0;
  let j = 0;

  while (i < wordA.length && j < wordB.length) {
    if (wordA[i] === wordB[j]) {
      i++;
      j++;
    } else {
      edits++;
      if (edits > 1) return false;

      if (wordA.length > wordB.length) {
        i++;
      } else if (wordB.length > wordA.length) {
        j++;
      } else {
        i++;
        j++;
      }
    }
  }

  edits += (wordA.length - i) + (wordB.length - j);
  return edits <= 1;
};

/**
 * Checks whether a target text matches a user query with maximum leniency:
 * - Accents ignored (Gaitán matches gaitan)
 * - Punctuation ignored (A.H. La Roca matches la roca or roca)
 * - Filler words ignored ("barrio gaitan" matches "Gaitán")
 * - Phonetics tolerated (mororico matches Morrorrico, probensa matches Provenza, claberiano matches Claveriano)
 * - Partial token matching (if user types "villas claveriano", it matches "A.H. Villas del Claveriano")
 * - 1-letter typo tolerance for words with >= 4 letters
 */
export const isLenientMatch = (targetText: string, queryText: string): boolean => {
  if (!queryText || !queryText.trim()) return true;
  if (!targetText) return false;

  const normTarget = normalizeSearchStr(targetText);
  const normQuery = normalizeSearchStr(queryText);

  // 1. Direct normalized substring match
  if (normTarget.includes(normQuery)) return true;

  // 2. Token inclusion check (every word in query is in target)
  const queryTokens = normQuery.split(' ').filter((w) => w.length >= 2);
  const targetTokens = normTarget.split(' ');

  if (queryTokens.length > 0 && queryTokens.every((qt) => normTarget.includes(qt))) {
    return true;
  }

  // 3. Phonetic matching
  const phonTarget = phoneticSimplify(targetText);
  const phonQuery = phoneticSimplify(queryText);

  if (phonQuery && phonTarget.includes(phonQuery)) {
    return true;
  }

  const phonQueryTokens = phonQuery.split(' ').filter((w) => w.length >= 2);
  if (phonQueryTokens.length > 0 && phonQueryTokens.every((pqt) => phonTarget.includes(pqt))) {
    return true;
  }

  // 4. Token-by-token fuzzy tolerance (1 typo allowed for words >= 4 letters)
  if (normQuery.length >= 4) {
    for (const qt of queryTokens) {
      if (qt.length >= 4) {
        for (const tt of targetTokens) {
          if (tt.length >= 4 && isCloseMatch(qt, tt)) {
            return true;
          }
        }
      }
    }
  }

  // Also test with phonetic tokens
  if (phonQuery.length >= 4) {
    const phonTargetTokens = phonTarget.split(' ');
    for (const pqt of phonQueryTokens) {
      if (pqt.length >= 4) {
        for (const ptt of phonTargetTokens) {
          if (ptt.length >= 4 && isCloseMatch(pqt, ptt)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};
