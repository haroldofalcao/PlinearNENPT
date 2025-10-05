// @ts-ignore
import solver from "javascript-lp-solver";
import { Formula, OptimizationConstraints, OptimizationResult, SelectedBag } from "@/types/formula";

/**
 * Parenteral Nutrition Optimization Engine
 * =============================================================
 * 
 * This module implements a linear programming optimization algorithm using
 * javascript-lp-solver to find the optimal combination of parenteral
 * nutrition formulas that minimizes cost while meeting all nutritional constraints.
 */
export class ParenteralNutritionOptimizer {
  private formulas: Formula[];
  private modelVariables: Record<string, any> = {};

  constructor(formulas: Formula[]) {
    this.formulas = formulas;
  }

  /**
   * Get available formulas based on filters.
   */
  private getAvailableFormulas(
    selectedIds?: string[],
    emulsionFilter: string = "All",
    viaFilter: string = "All"
  ): Formula[] {
    let filteredFormulas = [...this.formulas];

    if (selectedIds && selectedIds.length > 0) {
      filteredFormulas = filteredFormulas.filter((f) => selectedIds.includes(f.id));
    }

    if (emulsionFilter !== "All") {
      filteredFormulas = filteredFormulas.filter((f) => f.emulsion_type === emulsionFilter);
    }

    if (viaFilter !== "All") {
      filteredFormulas = filteredFormulas.filter((f) => f.via === viaFilter);
    }

    return filteredFormulas;
  }

  /**
   * Validate constraints
   */
  private validateConstraints(constraints: OptimizationConstraints): boolean {
    if (constraints.kcal_min < 0 || constraints.kcal_max < 0 || constraints.kcal_min > constraints.kcal_max) {
      return false;
    }
    if (constraints.protein_min < 0 || constraints.protein_max < 0 || constraints.protein_min > constraints.protein_max) {
      return false;
    }
    if (constraints.volume_max <= 0) {
      return false;
    }
    return true;
  }

  /**
   * Optimize parenteral nutrition formula combination using linear programming.
   */
  optimize(
    constraints: OptimizationConstraints,
    selectedFormulas?: string[],
    customCosts?: Record<string, number>,
    emulsionFilter: string = "All",
    viaFilter: string = "All"
  ): OptimizationResult {
    // Validate constraints
    if (!this.validateConstraints(constraints)) {
      return this.errorResult("Restrições inválidas fornecidas");
    }

    // Get available formulas
    const availableFormulas = this.getAvailableFormulas(selectedFormulas, emulsionFilter, viaFilter);

    if (availableFormulas.length === 0) {
      return this.errorResult("Nenhuma fórmula disponível com os filtros atuais");
    }

    // Build model constraints
    const modelConstraints: any = {};

    if (constraints.kcal_min > 0 || constraints.kcal_max > 0) {
      modelConstraints.kcal = { min: constraints.kcal_min, max: constraints.kcal_max };
    }
    if (constraints.protein_min > 0 || constraints.protein_max > 0) {
      modelConstraints.protein = { min: constraints.protein_min, max: constraints.protein_max };
    }
    if (constraints.volume_max > 0) {
      modelConstraints.volume = { max: constraints.volume_max };
    }

    // max_bags constraint: limits the TOTAL QUANTITY of bags (sum of all quantities)
    if (constraints.max_bags && constraints.max_bags > 0) {
      modelConstraints.total_bags = { max: constraints.max_bags };
    }

    // Build model variables
    this.modelVariables = {};
    for (const formula of availableFormulas) {
      const currentCost = customCosts?.[formula.id] ?? formula.base_cost;

      this.modelVariables[formula.id] = {
        cost: currentCost,
        kcal: formula.kcal,
        protein: (formula.protein_g_l * formula.volume_ml) / 1000,
        volume: formula.volume_ml,
        nitrogen: (formula.nitrogen_g_l * formula.volume_ml) / 1000,
        glucose: (formula.glucose_g_l * formula.volume_ml) / 1000,
        fat: (formula.fat_g_l * formula.volume_ml) / 1000,
        total_bags: 1, // Each unit of this formula counts as 1 bag
      };
    }

    // Build LP model
    const model: any = {
      optimize: "cost",
      opType: "min",
      constraints: modelConstraints,
      variables: this.modelVariables,
    };

    // Force all formula quantities to be integers (whole bags only)
    // This is important because you can't use fractional bags in practice
    model.ints = Object.keys(this.modelVariables);

    try {
      // Solve the model
      const result = solver.Solve(model);

      if (!result.feasible) {
        return this.infeasibleResult();
      }

      return this.extractResults(result, availableFormulas, constraints);
    } catch (error) {
      console.error(`Erro na otimização: ${error}`);
      return this.errorResult(`Erro na otimização: ${error}`);
    }
  }

  /**
   * Extract results from solver output
   */
  private extractResults(
    result: any,
    availableFormulas: Formula[],
    constraints: OptimizationConstraints
  ): OptimizationResult {
    const selectedBags: SelectedBag[] = [];
    let totalKcal = 0;
    let totalProtein = 0;
    let totalVolume = 0;
    let totalNitrogen = 0;
    let totalGlucose = 0;
    let totalFat = 0;
    let totalBagsQuantity = 0;

    for (const formula of availableFormulas) {
      const quantity = result[formula.id];

      if (quantity && quantity > 0.001) {
        const variables = this.modelVariables[formula.id];

        // Round to integer since we're using integer programming
        const intQuantity = Math.round(quantity);

        // Only include if quantity is at least 1
        if (intQuantity >= 1) {
          selectedBags.push({
            formula_id: formula.id,
            name: formula.name,
            quantity: intQuantity,
            unit_cost: variables.cost,
            total_cost: parseFloat((intQuantity * variables.cost).toFixed(2)),
            kcal_contribution: parseFloat((intQuantity * variables.kcal).toFixed(1)),
            protein_contribution: parseFloat((intQuantity * variables.protein).toFixed(2)),
            volume_contribution: parseFloat((intQuantity * variables.volume).toFixed(1)),
            emulsion_type: formula.emulsion_type,
            via: formula.via,
            manufacturer: formula.manufacturer,
          });

          totalKcal += intQuantity * variables.kcal;
          totalProtein += intQuantity * variables.protein;
          totalVolume += intQuantity * variables.volume;
          totalNitrogen += intQuantity * variables.nitrogen;
          totalGlucose += intQuantity * variables.glucose;
          totalFat += intQuantity * variables.fat;
          totalBagsQuantity += intQuantity;
        }
      }
    }

    const constraintsMet = this.checkConstraintsSatisfaction(
      totalKcal,
      totalProtein,
      totalVolume,
      constraints
    );

    // Validate max_bags constraint (total quantity of bags)
    const tolerance = 0.01;
    const maxBagsMet = !constraints.max_bags || totalBagsQuantity <= constraints.max_bags + tolerance;

    return {
      status: maxBagsMet ? "Optimal" : "Infeasible",
      message: maxBagsMet ? undefined : `Quantidade total de bolsas (${totalBagsQuantity.toFixed(2)}) excede o máximo permitido (${constraints.max_bags})`,
      total_cost: parseFloat(result.result.toFixed(2)),
      total_kcal: parseFloat(totalKcal.toFixed(1)),
      total_protein: parseFloat(totalProtein.toFixed(2)),
      total_volume: parseFloat(totalVolume.toFixed(1)),
      total_nitrogen: parseFloat(totalNitrogen.toFixed(2)),
      total_glucose: parseFloat(totalGlucose.toFixed(2)),
      total_fat: parseFloat(totalFat.toFixed(2)),
      selected_bags: selectedBags.sort((a, b) => b.total_cost - a.total_cost),
      constraints_met: constraintsMet,
      num_bags: selectedBags.length,
    };
  }

  /**
   * Check if constraints are satisfied
   */
  private checkConstraintsSatisfaction(
    totalKcal: number,
    totalProtein: number,
    totalVolume: number,
    constraints: OptimizationConstraints
  ): OptimizationResult["constraints_met"] {
    const tolerance = 0.1;
    return {
      kcal_min: totalKcal >= (constraints.kcal_min || 0) - tolerance,
      kcal_max: totalKcal <= (constraints.kcal_max || Infinity) + tolerance,
      protein_min: totalProtein >= (constraints.protein_min || 0) - tolerance,
      protein_max: totalProtein <= (constraints.protein_max || Infinity) + tolerance,
      volume_max: totalVolume <= (constraints.volume_max || Infinity) + tolerance,
    };
  }

  /**
   * Return error result
   */
  private errorResult(message: string): OptimizationResult {
    return {
      status: "Error",
      message,
      total_cost: null,
      total_kcal: 0,
      total_protein: 0,
      total_volume: 0,
      total_nitrogen: 0,
      total_glucose: 0,
      total_fat: 0,
      selected_bags: [],
      constraints_met: {
        kcal_min: false,
        kcal_max: false,
        protein_min: false,
        protein_max: false,
        volume_max: false,
      },
      num_bags: 0,
    };
  }

  /**
   * Return infeasible result
   */
  private infeasibleResult(): OptimizationResult {
    return {
      status: "Infeasible",
      message: "Problema inviável - restrições não podem ser satisfeitas",
      total_cost: null,
      total_kcal: 0,
      total_protein: 0,
      total_volume: 0,
      total_nitrogen: 0,
      total_glucose: 0,
      total_fat: 0,
      selected_bags: [],
      constraints_met: {
        kcal_min: false,
        kcal_max: false,
        protein_min: false,
        protein_max: false,
        volume_max: false,
      },
      num_bags: 0,
    };
  }
}
