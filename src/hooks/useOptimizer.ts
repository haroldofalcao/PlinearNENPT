import { useState, useCallback, useMemo } from "react";
import { Formula, OptimizationConstraints, OptimizationResult } from "@/types/formula";
import { ParenteralNutritionOptimizer } from "@/lib/optimizer";

interface ValidationError {
  field: string;
  message: string;
}

export function useOptimizer(formulas: Formula[]) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Create optimizer instance with current formulas
  const optimizer = useMemo(() => new ParenteralNutritionOptimizer(formulas), [formulas]);

  const validateConstraints = useCallback((
    constraints: OptimizationConstraints
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (constraints.kcal_min < 0) {
      errors.push({ field: "kcal_min", message: "Calorias mínimas não podem ser negativas" });
    }
    if (constraints.kcal_max < constraints.kcal_min) {
      errors.push({ field: "kcal_max", message: "Calorias máximas devem ser maiores que mínimas" });
    }
    if (constraints.protein_min < 0) {
      errors.push({ field: "protein_min", message: "Proteína mínima não pode ser negativa" });
    }
    if (constraints.protein_max < constraints.protein_min) {
      errors.push({ field: "protein_max", message: "Proteína máxima deve ser maior que mínima" });
    }
    if (constraints.volume_max <= 0) {
      errors.push({ field: "volume_max", message: "Volume máximo deve ser positivo" });
    }
    if (constraints.max_bags && constraints.max_bags <= 0) {
      errors.push({ field: "max_bags", message: "Número máximo de bolsas deve ser positivo" });
    }

    return errors;
  }, []);

  const optimize = useCallback((
    constraints: OptimizationConstraints,
    selectedFormulas?: string[],
    customCosts?: Record<string, number>,
    emulsionFilter: string = "All",
    viaFilter: string = "All"
  ): OptimizationResult => {
    setIsOptimizing(true);
    setValidationErrors([]);

    try {
      // Validate constraints
      const errors = validateConstraints(constraints);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return {
          status: "Error",
          message: "Restrições inválidas: " + errors.map(e => e.message).join(", "),
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

      // Use the linear programming optimizer
      const result = optimizer.optimize(
        constraints,
        selectedFormulas,
        customCosts,
        emulsionFilter,
        viaFilter
      );

      // Add detailed error messages for infeasible solutions
      if (result.status === "Infeasible") {
        const unmetConstraints: string[] = [];
        if (!result.constraints_met.kcal_min) {
          unmetConstraints.push(`calorias insuficientes (${result.total_kcal.toFixed(0)}/${constraints.kcal_min})`);
        }
        if (!result.constraints_met.kcal_max) {
          unmetConstraints.push(`excesso de calorias (${result.total_kcal.toFixed(0)}/${constraints.kcal_max})`);
        }
        if (!result.constraints_met.protein_min) {
          unmetConstraints.push(`proteína insuficiente (${result.total_protein.toFixed(1)}g/${constraints.protein_min}g)`);
        }
        if (!result.constraints_met.protein_max) {
          unmetConstraints.push(`excesso de proteína (${result.total_protein.toFixed(1)}g/${constraints.protein_max}g)`);
        }
        if (!result.constraints_met.volume_max) {
          unmetConstraints.push(`excesso de volume (${result.total_volume.toFixed(0)}/${constraints.volume_max}mL)`);
        }

        if (unmetConstraints.length > 0) {
          result.message = "Não foi possível encontrar solução: " + unmetConstraints.join(", ");
        }
      }

      return result;
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizer, validateConstraints]);

  return {
    optimize,
    isOptimizing,
    validationErrors,
  };
}
