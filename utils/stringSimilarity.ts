

// A classic implementation of Levenshtein distance
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalizes common transliteration variations for Darija.
 * This makes string comparison more forgiving.
 * @param str The string to normalize.
 * @returns The normalized string.
 */
function normalizeDarija(str: string): string {
    return str
        .toLowerCase()
        // Arabic chat alphabet number-to-letter conversion
        .replace(/7/g, 'h')   // 7 -> ح
        .replace(/9/g, 'q')   // 9 -> ق
        .replace(/3/g, 'a')   // 3 -> ع
        .replace(/5/g, 'kh')  // 5 -> خ
        .replace(/2/g, 'a')   // 2 -> ء/أ
        // Common article prefixes
        .replace(/^(l-|el-|al-)/, '')
        // Common transliteration variations
        .replace(/ou/g, 'u')
        .replace(/kh/g, 'h')
        .replace(/sh/g, 'ch')
        .replace(/iy/g, 'i')
        .replace(/aa/g, 'a')
        .replace(/e/g, 'i')
        // Remove punctuation, replace hyphens with spaces, and trim whitespace
        .replace(/[.,/#!$%^&*;:{}=_`~()?]/g, "")
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ').trim();
}


/**
 * Calculates the similarity between two strings, returning a value between 0 and 1.
 * It's case-insensitive, ignores common punctuation, and normalizes Darija transliterations.
 * @param a The first string.
 * @param b The second string.
 * @returns A number between 0 (not similar) and 1 (identical).
 */
export function calculateSimilarity(a: string, b: string): number {
    const cleanA = normalizeDarija(a);
    const cleanB = normalizeDarija(b);

    if (cleanA === cleanB) return 1;
    if (cleanA.length === 0 || cleanB.length === 0) return 0;

    const distance = levenshtein(cleanA, cleanB);
    const maxLength = Math.max(cleanA.length, cleanB.length);
    return 1 - distance / maxLength;
}