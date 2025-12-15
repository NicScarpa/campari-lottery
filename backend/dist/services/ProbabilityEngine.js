"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbabilityEngine = void 0;
class ProbabilityEngine {
    /**
     * Determina se l'utente ha vinto e quale premio.
     * Logica: Probabilità = (Stock Rimanente del premio) / (Token Totali Rimanenti)
     */
    determineOutcome(input) {
        const { totalTokens, usedTokens, prizeTypes } = input;
        // 1. Calcola quanti token sono rimasti nel "sacchetto" virtuale
        // Usiamo Math.max(1, ...) per evitare divisioni per zero alla fine
        const tokensRemaining = Math.max(1, totalTokens - usedTokens);
        // 2. Filtra solo i premi che hanno ancora stock > 0
        const availablePrizes = prizeTypes.filter(p => p.remainingStock > 0);
        // Se non ci sono premi disponibili, l'utente perde automaticamente
        if (availablePrizes.length === 0)
            return null;
        // 3. Genera un numero casuale tra 0.0 e 1.0
        const randomValue = Math.random();
        let cumulativeProbability = 0;
        // 4. Cicla sui premi disponibili e accumula la probabilità
        for (const prize of availablePrizes) {
            // La probabilità di estrarre QUESTO specifico premio ora
            const prizeProbability = prize.remainingStock / tokensRemaining;
            cumulativeProbability += prizeProbability;
            // Se il numero random cade in questo intervallo, abbiamo un vincitore
            if (randomValue < cumulativeProbability) {
                return prize;
            }
        }
        // Se il ciclo finisce senza ritornare, significa che randomValue > somma probabilità
        // (Quindi è uscito un biglietto perdente o un "buco" vuoto)
        return null;
    }
}
exports.ProbabilityEngine = ProbabilityEngine;
