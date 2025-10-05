import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'jotai';
import {
    formulasAtom,
    selectedFormulasAtom
} from './formulas';
import { Formula } from '@/types/formula';

describe('Formulas Store', () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
        // Reset to initial state
        store.set(formulasAtom, []);
        store.set(selectedFormulasAtom, []);
    });

    describe('formulasAtom', () => {
        it('deve inicializar com array vazio quando não há dados no localStorage', () => {
            const formulas = store.get(formulasAtom);
            expect(Array.isArray(formulas)).toBe(true);
        });

        it('deve adicionar uma nova fórmula', () => {
            const newFormula: Formula = {
                id: 'TEST001',
                name: 'Test Formula',
                manufacturer: 'Test Manufacturer',
                volume_ml: 1000,
                kcal: 1000,
                protein_g_l: 30,
                nitrogen_g_l: 5,
                glucose_g_l: 150,
                fat_g_l: 40,
                emulsion_type: 'Soja',
                via: 'Central',
                base_cost: 50.00,
            };

            store.set(formulasAtom, [newFormula]);
            const formulas = store.get(formulasAtom);

            expect(formulas).toHaveLength(1);
            expect(formulas[0]).toEqual(newFormula);
        });

        it('deve atualizar uma fórmula existente', () => {
            const initialFormula: Formula = {
                id: 'TEST001',
                name: 'Test Formula',
                manufacturer: 'Test Manufacturer',
                volume_ml: 1000,
                kcal: 1000,
                protein_g_l: 30,
                nitrogen_g_l: 5,
                glucose_g_l: 150,
                fat_g_l: 40,
                emulsion_type: 'Soja',
                via: 'Central',
                base_cost: 50.00,
            };

            store.set(formulasAtom, [initialFormula]);

            const updatedFormula: Formula = {
                ...initialFormula,
                name: 'Updated Formula',
                base_cost: 75.00,
            };

            store.set(formulasAtom, [updatedFormula]);
            const formulas = store.get(formulasAtom);

            expect(formulas).toHaveLength(1);
            expect(formulas[0].name).toBe('Updated Formula');
            expect(formulas[0].base_cost).toBe(75.00);
        });

        it('deve remover uma fórmula', () => {
            const formula1: Formula = {
                id: 'TEST001',
                name: 'Test Formula 1',
                manufacturer: 'Test Manufacturer',
                volume_ml: 1000,
                kcal: 1000,
                protein_g_l: 30,
                nitrogen_g_l: 5,
                glucose_g_l: 150,
                fat_g_l: 40,
                emulsion_type: 'Soja',
                via: 'Central',
                base_cost: 50.00,
            };

            const formula2: Formula = {
                id: 'TEST002',
                name: 'Test Formula 2',
                manufacturer: 'Test Manufacturer',
                volume_ml: 1500,
                kcal: 1500,
                protein_g_l: 40,
                nitrogen_g_l: 6,
                glucose_g_l: 180,
                fat_g_l: 50,
                emulsion_type: 'SMOF',
                via: 'Central',
                base_cost: 80.00,
            };

            store.set(formulasAtom, [formula1, formula2]);
            store.set(formulasAtom, [formula2]);

            const formulas = store.get(formulasAtom);
            expect(formulas).toHaveLength(1);
            expect(formulas[0].id).toBe('TEST002');
        });

        it('deve adicionar múltiplas fórmulas', () => {
            const formulas: Formula[] = [
                {
                    id: 'TEST001',
                    name: 'Test Formula 1',
                    manufacturer: 'Test Manufacturer',
                    volume_ml: 1000,
                    kcal: 1000,
                    protein_g_l: 30,
                    nitrogen_g_l: 5,
                    glucose_g_l: 150,
                    fat_g_l: 40,
                    emulsion_type: 'Soja',
                    via: 'Central',
                    base_cost: 50.00,
                },
                {
                    id: 'TEST002',
                    name: 'Test Formula 2',
                    manufacturer: 'Test Manufacturer',
                    volume_ml: 1500,
                    kcal: 1500,
                    protein_g_l: 40,
                    nitrogen_g_l: 6,
                    glucose_g_l: 180,
                    fat_g_l: 50,
                    emulsion_type: 'SMOF',
                    via: 'Central',
                    base_cost: 80.00,
                },
            ];

            store.set(formulasAtom, formulas);
            const storedFormulas = store.get(formulasAtom);

            expect(storedFormulas).toHaveLength(2);
            expect(storedFormulas[0].id).toBe('TEST001');
            expect(storedFormulas[1].id).toBe('TEST002');
        });
    });

    describe('selectedFormulasAtom', () => {
        it('deve inicializar com array vazio', () => {
            const selected = store.get(selectedFormulasAtom);
            expect(selected).toEqual([]);
        });

        it('deve adicionar IDs de fórmulas selecionadas', () => {
            store.set(selectedFormulasAtom, ['PN001', 'PN002']);
            const selected = store.get(selectedFormulasAtom);

            expect(selected).toHaveLength(2);
            expect(selected).toContain('PN001');
            expect(selected).toContain('PN002');
        });

        it('deve remover IDs de fórmulas', () => {
            store.set(selectedFormulasAtom, ['PN001', 'PN002', 'PN003']);
            store.set(selectedFormulasAtom, ['PN001', 'PN003']);

            const selected = store.get(selectedFormulasAtom);
            expect(selected).toHaveLength(2);
            expect(selected).not.toContain('PN002');
        });

        it('deve limpar todas as seleções', () => {
            store.set(selectedFormulasAtom, ['PN001', 'PN002', 'PN003']);
            store.set(selectedFormulasAtom, []);

            const selected = store.get(selectedFormulasAtom);
            expect(selected).toEqual([]);
        });
    });
});
