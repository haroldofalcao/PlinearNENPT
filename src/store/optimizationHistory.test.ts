import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'jotai';
import {
    optimizationHistoryAtom,
    addOptimizationToHistoryAtom,
    clearOptimizationHistoryAtom,
    deleteOptimizationEntryAtom,
    OptimizationHistoryEntry,
} from './optimizationHistory';
import { OptimizationConstraints, OptimizationResult } from '@/types/formula';

describe('Optimization History Store', () => {
    let store: ReturnType<typeof createStore>;

    const mockConstraints: OptimizationConstraints = {
        kcal_min: 1000,
        kcal_max: 2000,
        protein_min: 60,
        protein_max: 100,
        volume_max: 2000,
    };

    const mockOptimalResult: OptimizationResult = {
        status: 'Optimal',
        total_cost: 150.0,
        total_kcal: 1500,
        total_protein: 80,
        total_volume: 1500,
        total_nitrogen: 12,
        total_glucose: 200,
        total_fat: 60,
        selected_bags: [
            {
                formula_id: 'PN001',
                name: 'Test Formula',
                quantity: 1.5,
                unit_cost: 50.0,
                total_cost: 75.0,
                kcal_contribution: 750,
                protein_contribution: 40,
                volume_contribution: 750,
                emulsion_type: 'Soja',
                via: 'Central',
                manufacturer: 'Test Manufacturer',
            },
        ],
        constraints_met: {
            kcal_min: true,
            kcal_max: true,
            protein_min: true,
            protein_max: true,
            volume_max: true,
        },
        num_bags: 1,
    };

    beforeEach(() => {
        store = createStore();
        // Clear history before each test
        store.set(optimizationHistoryAtom, []);
    });

    describe('optimizationHistoryAtom', () => {
        it('deve inicializar com array vazio', () => {
            const history = store.get(optimizationHistoryAtom);
            expect(history).toEqual([]);
        });

        it('deve manter o estado do histórico', () => {
            const mockEntry: OptimizationHistoryEntry = {
                id: 'test-id',
                timestamp: Date.now(),
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001', 'PN002'],
            };

            store.set(optimizationHistoryAtom, [mockEntry]);
            const history = store.get(optimizationHistoryAtom);

            expect(history).toHaveLength(1);
            expect(history[0]).toEqual(mockEntry);
        });
    });

    describe('addOptimizationToHistoryAtom', () => {
        it('deve adicionar uma nova entrada ao histórico', () => {
            const newEntry = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001', 'PN002'],
            };

            store.set(addOptimizationToHistoryAtom, newEntry);
            const history = store.get(optimizationHistoryAtom);

            expect(history).toHaveLength(1);
            expect(history[0]).toHaveProperty('id');
            expect(history[0]).toHaveProperty('timestamp');
            expect(history[0].constraints).toEqual(mockConstraints);
            expect(history[0].result).toEqual(mockOptimalResult);
            expect(history[0].selectedFormulas).toEqual(['PN001', 'PN002']);
        });

        it('deve gerar IDs únicos para cada entrada', () => {
            const newEntry1 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            const newEntry2 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN002'],
            };

            store.set(addOptimizationToHistoryAtom, newEntry1);
            store.set(addOptimizationToHistoryAtom, newEntry2);

            const history = store.get(optimizationHistoryAtom);
            expect(history).toHaveLength(2);
            expect(history[0].id).not.toBe(history[1].id);
        });

        it('deve adicionar novas entradas no início do histórico', () => {
            const entry1 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            const entry2 = {
                constraints: { ...mockConstraints, kcal_min: 1200 },
                result: mockOptimalResult,
                selectedFormulas: ['PN002'],
            };

            store.set(addOptimizationToHistoryAtom, entry1);
            store.set(addOptimizationToHistoryAtom, entry2);

            const history = store.get(optimizationHistoryAtom);
            expect(history[0].constraints.kcal_min).toBe(1200);
            expect(history[1].constraints.kcal_min).toBe(1000);
        });

        it('deve limitar o histórico a 50 entradas', () => {
            // Adicionar 55 entradas
            for (let i = 0; i < 55; i++) {
                const entry = {
                    constraints: { ...mockConstraints, kcal_min: 1000 + i },
                    result: mockOptimalResult,
                    selectedFormulas: [`PN${i.toString().padStart(3, '0')}`],
                };
                store.set(addOptimizationToHistoryAtom, entry);
            }

            const history = store.get(optimizationHistoryAtom);
            expect(history).toHaveLength(50);
            // A primeira entrada deve ser a mais recente (kcal_min = 1054)
            expect(history[0].constraints.kcal_min).toBe(1054);
            // A última entrada deve ser da 5ª adicionada (kcal_min = 1005)
            expect(history[49].constraints.kcal_min).toBe(1005);
        });

        it('deve armazenar corretamente resultados com diferentes status', () => {
            const infeasibleResult: OptimizationResult = {
                ...mockOptimalResult,
                status: 'Infeasible',
                total_cost: null,
                message: 'Restrições não podem ser satisfeitas',
            };

            const entry = {
                constraints: mockConstraints,
                result: infeasibleResult,
                selectedFormulas: ['PN001'],
            };

            store.set(addOptimizationToHistoryAtom, entry);
            const history = store.get(optimizationHistoryAtom);

            expect(history[0].result.status).toBe('Infeasible');
            expect(history[0].result.total_cost).toBeNull();
            expect(history[0].result.message).toBe('Restrições não podem ser satisfeitas');
        });
    });

    describe('clearOptimizationHistoryAtom', () => {
        it('deve limpar todo o histórico', () => {
            // Adicionar algumas entradas
            for (let i = 0; i < 5; i++) {
                const entry = {
                    constraints: mockConstraints,
                    result: mockOptimalResult,
                    selectedFormulas: [`PN00${i}`],
                };
                store.set(addOptimizationToHistoryAtom, entry);
            }

            expect(store.get(optimizationHistoryAtom)).toHaveLength(5);

            // Limpar histórico
            store.set(clearOptimizationHistoryAtom);
            const history = store.get(optimizationHistoryAtom);

            expect(history).toEqual([]);
        });

        it('deve manter o histórico vazio após limpeza', () => {
            const entry = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            store.set(addOptimizationToHistoryAtom, entry);
            store.set(clearOptimizationHistoryAtom);

            const history = store.get(optimizationHistoryAtom);
            expect(history).toEqual([]);
        });
    });

    describe('deleteOptimizationEntryAtom', () => {
        it('deve remover uma entrada específica por ID', () => {
            const entry1 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            const entry2 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN002'],
            };

            store.set(addOptimizationToHistoryAtom, entry1);
            store.set(addOptimizationToHistoryAtom, entry2);

            const history = store.get(optimizationHistoryAtom);
            expect(history).toHaveLength(2);

            const idToDelete = history[0].id;
            store.set(deleteOptimizationEntryAtom, idToDelete);

            const updatedHistory = store.get(optimizationHistoryAtom);
            expect(updatedHistory).toHaveLength(1);
            expect(updatedHistory[0].id).not.toBe(idToDelete);
        });

        it('não deve afetar outras entradas ao deletar uma', () => {
            const entry1 = {
                constraints: { ...mockConstraints, kcal_min: 1000 },
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            const entry2 = {
                constraints: { ...mockConstraints, kcal_min: 1200 },
                result: mockOptimalResult,
                selectedFormulas: ['PN002'],
            };

            const entry3 = {
                constraints: { ...mockConstraints, kcal_min: 1400 },
                result: mockOptimalResult,
                selectedFormulas: ['PN003'],
            };

            store.set(addOptimizationToHistoryAtom, entry1);
            store.set(addOptimizationToHistoryAtom, entry2);
            store.set(addOptimizationToHistoryAtom, entry3);

            const history = store.get(optimizationHistoryAtom);
            const middleEntryId = history[1].id;

            store.set(deleteOptimizationEntryAtom, middleEntryId);

            const updatedHistory = store.get(optimizationHistoryAtom);
            expect(updatedHistory).toHaveLength(2);
            expect(updatedHistory[0].constraints.kcal_min).toBe(1400);
            expect(updatedHistory[1].constraints.kcal_min).toBe(1000);
        });

        it('deve lidar com tentativa de deletar ID inexistente', () => {
            const entry = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            store.set(addOptimizationToHistoryAtom, entry);
            const initialLength = store.get(optimizationHistoryAtom).length;

            store.set(deleteOptimizationEntryAtom, 'non-existent-id');

            const history = store.get(optimizationHistoryAtom);
            expect(history).toHaveLength(initialLength);
        });
    });

    describe('Timestamp e Ordenação', () => {
        it('deve manter entradas ordenadas por timestamp (mais recente primeiro)', async () => {
            const entry1 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN001'],
            };

            store.set(addOptimizationToHistoryAtom, entry1);

            // Pequeno delay para garantir timestamp diferente
            await new Promise(resolve => setTimeout(resolve, 10));

            const entry2 = {
                constraints: mockConstraints,
                result: mockOptimalResult,
                selectedFormulas: ['PN002'],
            };

            store.set(addOptimizationToHistoryAtom, entry2);

            const history = store.get(optimizationHistoryAtom);
            expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp);
        });
    });
});
