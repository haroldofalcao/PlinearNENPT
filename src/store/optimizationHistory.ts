import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { OptimizationResult, OptimizationConstraints } from "@/types/formula";

export interface OptimizationHistoryEntry {
  id: string;
  timestamp: number;
  constraints: OptimizationConstraints & { num_days?: number };
  result: OptimizationResult;
  selectedFormulas: string[];
}

// Persist history in localStorage
export const optimizationHistoryAtom = atomWithStorage<OptimizationHistoryEntry[]>(
  "pn-optimization-history",
  []
);

// Add a new entry to history
export const addOptimizationToHistoryAtom = atom(
  null,
  (get, set, entry: Omit<OptimizationHistoryEntry, "id" | "timestamp">) => {
    const history = get(optimizationHistoryAtom);
    const newEntry: OptimizationHistoryEntry = {
      ...entry,
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    // Keep only last 50 entries
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    set(optimizationHistoryAtom, updatedHistory);
  }
);

// Clear all history
export const clearOptimizationHistoryAtom = atom(
  null,
  (_get, set) => {
    set(optimizationHistoryAtom, []);
  }
);

// Delete a specific entry
export const deleteOptimizationEntryAtom = atom(
  null,
  (get, set, id: string) => {
    const history = get(optimizationHistoryAtom);
    set(optimizationHistoryAtom, history.filter(entry => entry.id !== id));
  }
);
