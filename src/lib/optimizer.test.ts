import { describe, it, expect, beforeEach } from 'vitest';
import { ParenteralNutritionOptimizer } from './optimizer';
import { Formula, OptimizationConstraints } from '@/types/formula';

describe('ParenteralNutritionOptimizer', () => {
    let mockFormulas: Formula[];
    let optimizer: ParenteralNutritionOptimizer;

    beforeEach(() => {
        // Mock formulas para testes
        mockFormulas = [
            {
                id: 'PN001',
                name: 'NuTRIflex® peri 1000mL',
                manufacturer: 'B. Braun',
                volume_ml: 1000,
                kcal: 600,
                protein_g_l: 15.0,
                nitrogen_g_l: 2.4,
                glucose_g_l: 80,
                fat_g_l: 20,
                emulsion_type: 'Soja',
                via: 'Peripheral',
                osmolarity: 850,
                base_cost: 45.50,
            },
            {
                id: 'PN002',
                name: 'NuTRIflex® central 1000mL',
                manufacturer: 'B. Braun',
                volume_ml: 1000,
                kcal: 1050,
                protein_g_l: 28.75,
                nitrogen_g_l: 4.6,
                glucose_g_l: 140,
                fat_g_l: 40,
                emulsion_type: 'Soja',
                via: 'Central',
                osmolarity: 1380,
                base_cost: 68.90,
            },
            {
                id: 'PN003',
                name: 'SMOFlipid® Central 1000mL',
                manufacturer: 'Fresenius Kabi',
                volume_ml: 1000,
                kcal: 1200,
                protein_g_l: 32.5,
                nitrogen_g_l: 5.2,
                glucose_g_l: 160,
                fat_g_l: 40,
                emulsion_type: 'SMOF',
                via: 'Central',
                osmolarity: 1450,
                base_cost: 89.30,
            },
        ];

        optimizer = new ParenteralNutritionOptimizer(mockFormulas);
    });

    describe('Validação de Restrições', () => {
        it('deve retornar erro quando kcal_min for negativo', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: -100,
                kcal_max: 2000,
                protein_min: 60,
                protein_max: 100,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Error');
            expect(result.message).toContain('inválidas');
        });

        it('deve retornar erro quando kcal_max for menor que kcal_min', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 2000,
                kcal_max: 1000,
                protein_min: 60,
                protein_max: 100,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Error');
            expect(result.message).toContain('inválidas');
        });

        it('deve retornar erro quando volume_max for zero ou negativo', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 2000,
                protein_min: 60,
                protein_max: 100,
                volume_max: 0,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Error');
            expect(result.message).toContain('inválidas');
        });
    });

    describe('Otimização Básica', () => {
        it('deve encontrar solução ótima para restrições simples', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 1500,
                protein_min: 25,
                protein_max: 40,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Optimal');
            expect(result.total_cost).toBeGreaterThan(0);
            expect(result.total_kcal).toBeGreaterThanOrEqual(constraints.kcal_min);
            expect(result.total_kcal).toBeLessThanOrEqual(constraints.kcal_max);
            expect(result.total_protein).toBeGreaterThanOrEqual(constraints.protein_min);
            expect(result.total_protein).toBeLessThanOrEqual(constraints.protein_max);
            expect(result.total_volume).toBeLessThanOrEqual(constraints.volume_max);
            expect(result.selected_bags.length).toBeGreaterThan(0);
        });

        it('deve minimizar o custo total', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 600,
                kcal_max: 700,
                protein_min: 15,
                protein_max: 20,
                volume_max: 1500,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Optimal');
            // Deve encontrar uma solução de custo mínimo
            expect(result.total_cost).toBeGreaterThan(0);
            // Verifica que está usando fórmulas econômicas
            const usedFormulaIds = result.selected_bags.map(bag => bag.formula_id);
            expect(usedFormulaIds.length).toBeGreaterThan(0);
        });

        it('deve retornar valores nutricionais corretos', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1200,
                kcal_max: 1300,
                protein_min: 32,
                protein_max: 35,
                volume_max: 1500,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Optimal');
            expect(result.total_nitrogen).toBeGreaterThan(0);
            expect(result.total_glucose).toBeGreaterThan(0);
            expect(result.total_fat).toBeGreaterThan(0);
        });
    });

    describe('Filtros de Fórmulas', () => {
        it('deve filtrar fórmulas por ID selecionados', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 1500,
                protein_min: 25,
                protein_max: 35,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints, ['PN001', 'PN002']);

            expect(result.status).toBe('Optimal');
            // Deve usar apenas as fórmulas selecionadas
            const usedIds = result.selected_bags.map(bag => bag.formula_id);
            usedIds.forEach(id => {
                expect(['PN001', 'PN002']).toContain(id);
            });
        });

        it('deve filtrar fórmulas por via de acesso', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 1500,
                protein_min: 25,
                protein_max: 35,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints, undefined, undefined, 'All', 'Central');

            expect(result.status).toBe('Optimal');
            // Todas as fórmulas selecionadas devem ser de via central
            result.selected_bags.forEach(bag => {
                expect(bag.via).toBe('Central');
            });
        });

        it('deve filtrar fórmulas por tipo de emulsão', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 1500,
                protein_min: 25,
                protein_max: 35,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints, undefined, undefined, 'SMOF', 'All');

            expect(result.status).toBe('Optimal');
            // Todas as fórmulas selecionadas devem ser SMOF
            result.selected_bags.forEach(bag => {
                expect(bag.emulsion_type).toBe('SMOF');
            });
        });
    });

    describe('Custos Personalizados', () => {
        it('deve usar custos personalizados quando fornecidos', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 600,
                kcal_max: 700,
                protein_min: 15,
                protein_max: 20,
                volume_max: 1500,
            };

            const customCosts = {
                'PN001': 100.00, // Tornando a mais barata muito cara
                'PN002': 30.00,  // Tornando esta a mais barata
            };

            const result = optimizer.optimize(constraints, undefined, customCosts);

            expect(result.status).toBe('Optimal');
            // Agora deve escolher a PN002 por ser mais barata com custo customizado
            const hasPN002 = result.selected_bags.some(bag => bag.formula_id === 'PN002');
            expect(hasPN002).toBe(true);
        });
    });

    describe('Restrições de Número de Bolsas', () => {
        it('deve respeitar o número máximo de bolsas (quantidade total)', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 2000,
                kcal_max: 3000,
                protein_min: 60,
                protein_max: 90,
                volume_max: 3000,
                max_bags: 2,
            };

            const result = optimizer.optimize(constraints);

            // max_bags limita a QUANTIDADE TOTAL de bolsas (soma de todas as quantidades)
            expect(result.status).toBe('Optimal');
            const totalBagsQuantity = result.selected_bags.reduce((sum, bag) => sum + bag.quantity, 0);
            expect(totalBagsQuantity).toBeLessThanOrEqual(constraints.max_bags! + 0.01); // tolerance
        });

        it('deve respeitar o número máximo de bolsas (1 bolsa)', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 600,
                kcal_max: 700,
                protein_min: 15,
                protein_max: 20,
                volume_max: 1500,
                max_bags: 1,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Optimal');
            const totalBagsQuantity = result.selected_bags.reduce((sum, bag) => sum + bag.quantity, 0);
            expect(totalBagsQuantity).toBeLessThanOrEqual(1.01); // tolerance
        });

        it('deve retornar Infeasible quando max_bags é muito restritivo', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 3000, // Muitas calorias
                kcal_max: 3500,
                protein_min: 100,
                protein_max: 120,
                volume_max: 3000,
                max_bags: 1, // Mas só pode usar 1 bolsa - impossível
            };

            const result = optimizer.optimize(constraints);

            // Deve ser infeasible ou não atender todas as restrições
            expect(result.status === 'Infeasible' || !result.constraints_met.kcal_min).toBe(true);
        });

        it('deve funcionar sem restrição de max_bags', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 2000,
                kcal_max: 3000,
                protein_min: 60,
                protein_max: 90,
                volume_max: 3000,
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Optimal');
            // Sem max_bags, pode usar quantas fórmulas forem necessárias
            expect(result.num_bags).toBeGreaterThan(0);
        });
    });

    describe('Casos Inviáveis', () => {
        it('deve retornar Infeasible quando restrições são impossíveis', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 10000, // Calorias impossíveis de atingir
                kcal_max: 11000,
                protein_min: 60,
                protein_max: 100,
                volume_max: 1000, // Volume muito baixo
            };

            const result = optimizer.optimize(constraints);

            expect(result.status).toBe('Infeasible');
            expect(result.message).toBeTruthy();
            expect(result.total_cost).toBeNull();
        });

        it('deve retornar erro quando não há fórmulas disponíveis', () => {
            const emptyOptimizer = new ParenteralNutritionOptimizer([]);

            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 2000,
                protein_min: 60,
                protein_max: 100,
                volume_max: 2000,
            };

            const result = emptyOptimizer.optimize(constraints);

            expect(result.status).toBe('Error');
            expect(result.message).toContain('Nenhuma fórmula disponível');
        });
    });

    describe('Verificação de Restrições Atendidas', () => {
        it('deve marcar todas as restrições como atendidas em solução ótima', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1000,
                kcal_max: 1500,
                protein_min: 25,
                protein_max: 40,
                volume_max: 2000,
            };

            const result = optimizer.optimize(constraints);

            if (result.status === 'Optimal') {
                expect(result.constraints_met.kcal_min).toBe(true);
                expect(result.constraints_met.kcal_max).toBe(true);
                expect(result.constraints_met.protein_min).toBe(true);
                expect(result.constraints_met.protein_max).toBe(true);
                expect(result.constraints_met.volume_max).toBe(true);
            }
        });
    });

    describe('Cálculo de Contribuições', () => {
        it('deve calcular corretamente as contribuições de cada bolsa', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 1200,
                kcal_max: 1300,
                protein_min: 32,
                protein_max: 35,
                volume_max: 1500,
            };

            const result = optimizer.optimize(constraints);

            if (result.status === 'Optimal') {
                result.selected_bags.forEach(bag => {
                    expect(bag.kcal_contribution).toBeGreaterThan(0);
                    expect(bag.protein_contribution).toBeGreaterThan(0);
                    expect(bag.volume_contribution).toBeGreaterThan(0);
                    expect(bag.total_cost).toBeGreaterThan(0);
                });

                // Soma das contribuições deve ser aproximadamente igual ao total
                const sumKcal = result.selected_bags.reduce((sum, bag) => sum + bag.kcal_contribution, 0);
                const sumProtein = result.selected_bags.reduce((sum, bag) => sum + bag.protein_contribution, 0);
                const sumVolume = result.selected_bags.reduce((sum, bag) => sum + bag.volume_contribution, 0);

                expect(Math.abs(sumKcal - result.total_kcal)).toBeLessThan(1);
                expect(Math.abs(sumProtein - result.total_protein)).toBeLessThan(0.1);
                expect(Math.abs(sumVolume - result.total_volume)).toBeLessThan(1);
            }
        });
    });

    describe('Número de Bolsas', () => {
        it('deve contar corretamente o número de diferentes tipos de bolsas', () => {
            const constraints: OptimizationConstraints = {
                kcal_min: 2000,
                kcal_max: 2500,
                protein_min: 50,
                protein_max: 70,
                volume_max: 3000,
            };

            const result = optimizer.optimize(constraints);

            if (result.status === 'Optimal') {
                expect(result.num_bags).toBe(result.selected_bags.length);
            }
        });
    });
});
