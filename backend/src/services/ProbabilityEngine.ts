// Definizioni dei tipi per l'engine
interface PrizeConfig {
    id: number;
    initialStock: number;
    remainingStock: number;
    targetProbability: number;
}
  
interface EngineInput {
    totalTokens: number;
    usedTokens: number;
    prizeTypes: PrizeConfig[];
}
  
export class ProbabilityEngine {
    /**
     * Determina se l'utente ha vinto e quale premio.
     * Logica: Probabilità = (Stock Rimanente del premio) / (Token Totali Rimanenti)
     */
    determineOutcome(input: EngineInput): PrizeConfig | null {
        const { totalTokens, usedTokens, prizeTypes } = input;

        // 1. Se tutti i token sono stati usati, nessuna vincita possibile
        if (totalTokens <= usedTokens) {
            return null;
        }

        // 2. Calcola quanti token sono rimasti nel "sacchetto" virtuale
        const tokensRemaining = totalTokens - usedTokens;

        // 3. Filtra solo i premi che hanno ancora stock > 0
        const availablePrizes = prizeTypes.filter(p => p.remainingStock > 0);

        // Se non ci sono premi disponibili, l'utente perde automaticamente
        if (availablePrizes.length === 0) return null;

        // 4. Genera un numero casuale tra 0.0 e 1.0
        const randomValue = Math.random();
        
        let cumulativeProbability = 0;

        // 5. Cicla sui premi disponibili e accumula la probabilità
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