export class ProbabilityEngine {
  /**
   * Calcola la probabilità di vincita dinamica.
   * Formula: P = Stock Rimanente / Token Rimanenti
   */
  static compute(plannedTokens: number, usedTokens: number, remainingStock: number): number {
    // Se non c'è stock, probabilità zero immediata
    if (remainingStock <= 0) return 0;

    // Calcola i token rimanenti. 
    // Math.max(..., 1) serve a evitare divisioni per zero se i token usati superano quelli pianificati.
    const tokensLeft = Math.max(plannedTokens - usedTokens, 1);
    
    // Probabilità dinamica semplice
    let p = remainingStock / tokensLeft;

    // Assicura che il risultato sia sempre tra 0.0 e 1.0
    return Math.min(Math.max(p, 0), 1);
  }
}