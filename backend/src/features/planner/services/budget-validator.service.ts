import { logger } from "../../../lib/logger";

// ============================================
// CFO LOGIC - Budget Validation Guard
// Prevents wasting AI compute on impossible requests
// ============================================

export interface BudgetValidationInput {
  totalBudget: number;
  currency: string;
  tripDays: number;
  travelers: {
    adults: number;
    children: number;
  };
}

export interface BudgetValidationResult {
  isValid: boolean;
  reason?: string;
  dailyBudgetPerPerson?: number;
  recommendedMinimum?: number;
}

export class BudgetValidatorService {
  // Minimum daily budget per person (USD equivalent)
  private readonly MIN_DAILY_BUDGET_USD = 20;
  private readonly MIN_DAILY_BUDGET_CHILD_USD = 10;

  /**
   * The "CFO Guard" - Validates budget before queueing AI job
   * @param input Budget details
   * @returns Validation result
   */
  validate(input: BudgetValidationInput): BudgetValidationResult {
    const { totalBudget, currency, tripDays, travelers } = input;

    // 1. Calculate total travelers
    const totalTravelers = travelers.adults + travelers.children;
    
    if (totalTravelers === 0) {
      return {
        isValid: false,
        reason: "At least 1 traveler is required",
      };
    }

    // 2. Calculate budget per person per day
    const totalPersonDays = (travelers.adults + travelers.children * 0.5) * tripDays;
    const budgetPerPersonDay = totalBudget / totalPersonDays;

    // 3. Convert to USD if needed (simplified - in prod, use exchange rate API)
    const budgetInUSD = this.convertToUSD(budgetPerPersonDay, currency);

    // 4. Validate minimum threshold
    const minimumRequired = this.calculateMinimumBudget(tripDays, travelers);

    if (budgetInUSD < this.MIN_DAILY_BUDGET_USD) {
      logger.warn(
        {
          totalBudget,
          currency,
          tripDays,
          travelers,
          budgetPerPersonDay: budgetInUSD,
          minimum: this.MIN_DAILY_BUDGET_USD,
        },
        "Budget validation failed: Below minimum threshold"
      );

      return {
        isValid: false,
        reason: `Budget is too low. Minimum $${this.MIN_DAILY_BUDGET_USD}/day per person required.`,
        dailyBudgetPerPerson: budgetInUSD,
        recommendedMinimum: minimumRequired,
      };
    }

    // 5. Warning for low but acceptable budgets
    if (budgetInUSD < 50) {
      logger.info(
        { budgetPerPersonDay: budgetInUSD },
        "Budget is low but acceptable - will prioritize budget options"
      );
    }

    return {
      isValid: true,
      dailyBudgetPerPerson: budgetInUSD,
    };
  }

  /**
   * Calculate recommended minimum budget
   */
  private calculateMinimumBudget(
    tripDays: number,
    travelers: { adults: number; children: number }
  ): number {
    const adultsBudget = travelers.adults * this.MIN_DAILY_BUDGET_USD * tripDays;
    const childrenBudget = travelers.children * this.MIN_DAILY_BUDGET_CHILD_USD * tripDays;
    return adultsBudget + childrenBudget;
  }

  /**
   * Convert budget to USD (simplified)
   * TODO: In production, integrate with currency exchange API
   */
  private convertToUSD(amount: number, currency: string): number {
    // Simplified conversion rates (hardcoded for demo)
    const rates: Record<string, number> = {
      USD: 1.0,
      EUR: 1.1,
      GBP: 1.27,
      JPY: 0.0067,
      AUD: 0.66,
      CAD: 0.73,
      INR: 0.012,
    };

    const rate = rates[currency.toUpperCase()] || 1.0;
    return amount * rate;
  }

  /**
   * Validate trip duration
   */
  validateDuration(startDate: Date, endDate: Date): {
    isValid: boolean;
    reason?: string;
    days?: number;
  } {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return {
        isValid: false,
        reason: "Trip must be at least 1 day long",
      };
    }

    if (diffDays > 90) {
      return {
        isValid: false,
        reason: "Trip cannot exceed 90 days (pagination not yet implemented)",
      };
    }

    return {
      isValid: true,
      days: diffDays,
    };
  }
}

// Singleton instance
export const budgetValidatorService = new BudgetValidatorService();
