import { detectGender } from '../utils/genderDetection';

// Definizioni dei tipi per l'engine v2.0
export interface PrizeConfig {
  id: number;
  name: string;
  initialStock: number;
  remainingStock: number;
  genderRestriction?: string | null; // 'F' = solo donne, 'M' = solo uomini, null = tutti
}

export interface CustomerStats {
  firstName: string;
  totalPlays: number;
  totalWins: number;
  detectedGender?: string | null; // 'F', 'M', 'U'
}

export interface EngineInput {
  totalTokens: number;
  usedTokens: number;
  prizeTypes: PrizeConfig[];
  customer: CustomerStats;
  prizesAssignedTotal: number;
}

export interface EngineOutput {
  winner: boolean;
  prize: PrizeConfig | null;
  factors: {
    fatigue: number;
    pacing: number;
    finalModifier: number;
  };
}

/**
 * Calcola il fattore di penalizzazione per giocatori frequenti.
 *
 * REGOLE GIOCATE:
 * - Sotto 5 giocate: nessuna penalita
 * - Dalla 6a giocata: -10%
 * - Ogni giocata successiva: ulteriore -2%
 * - Cap massimo: -50%
 *
 * REGOLE VITTORIE:
 * - 1 vittoria: -20%
 * - 2 vittorie: -40%
 * - 3+ vittorie: -60% (cap)
 *
 * Le penalita si combinano moltiplicativamente.
 * Floor minimo: 10% della probabilita originale.
 */
function calculateFatigueFactor(totalPlays: number, totalWins: number): number {
  let factor = 1.0;

  // === PENALITA PER GIOCATE FREQUENTI ===
  if (totalPlays >= 6) {
    const extraPlays = totalPlays - 5;
    // Prima extra play = -10%, ogni successiva +2%
    const playPenalty = 0.1 + (extraPlays - 1) * 0.02;
    factor *= 1 - Math.min(playPenalty, 0.5); // Cap -50%
  }

  // === PENALITA PER VITTORIE PRECEDENTI ===
  if (totalWins >= 1) {
    const winPenalty = Math.min(totalWins * 0.2, 0.6); // Cap -60%
    factor *= 1 - winPenalty;
  }

  // Floor: minimo 10% di probabilita residua
  return Math.max(factor, 0.1);
}

/**
 * Calcola il fattore di pacing per distribuzione uniforme dei premi.
 *
 * Confronta il ritmo di distribuzione attuale con quello ideale:
 * - Se stiamo distribuendo troppo velocemente: rallenta
 * - Se stiamo distribuendo troppo lentamente: accelera
 *
 * SOGLIE:
 * - ratio > 1.3: troppo veloce, -40%
 * - ratio > 1.15: un po' troppo veloce, -20%
 * - ratio < 0.7: troppo lento, +40%
 * - ratio < 0.85: un po' troppo lento, +20%
 * - altrimenti: ritmo ideale, nessuna modifica
 */
function calculatePacingFactor(
  usedTokens: number,
  totalTokens: number,
  prizesAssigned: number,
  totalInitialPrizes: number
): number {
  if (usedTokens === 0 || totalTokens === 0 || totalInitialPrizes === 0) {
    return 1.0;
  }

  // Percentuale di avanzamento
  const tokenProgress = usedTokens / totalTokens;
  const prizeProgress = prizesAssigned / totalInitialPrizes;

  // Evita divisione per zero
  if (tokenProgress === 0) return 1.0;

  // Rapporto: quanto velocemente stiamo distribuendo vs ideale
  const ratio = prizeProgress / tokenProgress;

  if (ratio > 1.3) {
    // Troppo veloce: rallenta molto (-40%)
    return 0.6;
  } else if (ratio > 1.15) {
    // Un po' troppo veloce: rallenta (-20%)
    return 0.8;
  } else if (ratio < 0.7) {
    // Troppo lento: accelera molto (+40%)
    return 1.4;
  } else if (ratio < 0.85) {
    // Un po' troppo lento: accelera (+20%)
    return 1.2;
  }

  return 1.0; // Ritmo ideale
}

export class ProbabilityEngine {
  /**
   * Determina se l'utente ha vinto e quale premio.
   *
   * Logica v2.0:
   * 1. Rileva genere (se non gia' salvato)
   * 2. Filtra premi disponibili e compatibili con genere
   * 3. Calcola fatigue factor (penalita giocatori frequenti)
   * 4. Calcola pacing factor (distribuzione uniforme)
   * 5. Applica modificatori alla probabilita base
   * 6. Esegue estrazione casuale
   */
  determineOutcome(input: EngineInput): EngineOutput {
    const { customer, prizeTypes, totalTokens, usedTokens, prizesAssignedTotal } = input;

    // Risultato default (perdita)
    const lossResult: EngineOutput = {
      winner: false,
      prize: null,
      factors: { fatigue: 1, pacing: 1, finalModifier: 1 },
    };

    // Verifica token rimasti
    const tokensRemaining = totalTokens - usedTokens;
    if (tokensRemaining <= 0) {
      return lossResult;
    }

    // 1. RILEVAMENTO GENERE
    const gender = customer.detectedGender || detectGender(customer.firstName).gender;

    // 2. FILTRA PREMI DISPONIBILI E COMPATIBILI CON GENERE
    const eligiblePrizes = prizeTypes.filter((prize) => {
      // Escludi se stock esaurito
      if (prize.remainingStock <= 0) return false;

      // Escludi se restrizione genere non soddisfatta
      if (prize.genderRestriction === 'F' && gender !== 'F') return false;
      if (prize.genderRestriction === 'M' && gender !== 'M') return false;

      return true;
    });

    // Se nessun premio disponibile, perdita certa
    if (eligiblePrizes.length === 0) {
      return lossResult;
    }

    // 3. CALCOLO FATIGUE FACTOR
    const fatigue = calculateFatigueFactor(customer.totalPlays, customer.totalWins);

    // 4. CALCOLO PACING FACTOR
    const totalInitialPrizes = prizeTypes.reduce((sum, p) => sum + p.initialStock, 0);
    const pacing = calculatePacingFactor(
      usedTokens,
      totalTokens,
      prizesAssignedTotal,
      totalInitialPrizes
    );

    // 5. MODIFICATORE GLOBALE
    const globalModifier = fatigue * pacing;

    // 6. CALCOLO PROBABILITA CUMULATIVE
    let cumulative = 0;
    const probabilities: Array<{ prize: PrizeConfig; threshold: number }> = [];

    for (const prize of eligiblePrizes) {
      const baseProbability = prize.remainingStock / tokensRemaining;
      const adjustedProbability = baseProbability * globalModifier;
      cumulative += adjustedProbability;
      probabilities.push({ prize, threshold: cumulative });
    }

    // 7. ESTRAZIONE CASUALE
    const random = Math.random();

    for (const { prize, threshold } of probabilities) {
      if (random < threshold) {
        return {
          winner: true,
          prize,
          factors: { fatigue, pacing, finalModifier: globalModifier },
        };
      }
    }

    // Nessuna vincita
    return {
      winner: false,
      prize: null,
      factors: { fatigue, pacing, finalModifier: globalModifier },
    };
  }
}

// Singleton export
export const probabilityEngine = new ProbabilityEngine();
