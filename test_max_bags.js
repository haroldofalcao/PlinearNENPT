// Test script to verify max_bags constraint
import { ParenteralNutritionOptimizer } from './src/lib/optimizer.ts';

const mockFormulas = [
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
    {
        id: 'PN004',
        name: 'OliClinomel® Central 1000mL',
        manufacturer: 'Baxter',
        volume_ml: 1000,
        kcal: 800,
        protein_g_l: 20.0,
        nitrogen_g_l: 3.2,
        glucose_g_l: 100,
        fat_g_l: 30,
        emulsion_type: 'Oliva/TCL',
        via: 'Central',
        osmolarity: 1200,
        base_cost: 75.00,
    },
];

const optimizer = new ParenteralNutritionOptimizer(mockFormulas);

console.log('==== Teste 1: max_bags = 2 ====');
const result1 = optimizer.optimize({
    kcal_min: 1800,
    kcal_max: 2400,
    protein_min: 60,
    protein_max: 90,
    volume_max: 2500,
    max_bags: 2,
});

console.log('Status:', result1.status);
console.log('Número de fórmulas diferentes:', result1.num_bags);
console.log('Fórmulas selecionadas:');
result1.selected_bags.forEach(bag => {
    console.log(`  - ${bag.name}: ${bag.quantity.toFixed(3)} bolsas`);
});
console.log('Total calorias:', result1.total_kcal);
console.log('Total proteína:', result1.total_protein);
console.log('Total volume:', result1.total_volume);
console.log('Custo total:', result1.total_cost);

console.log('\n==== Teste 2: max_bags = 1 ====');
const result2 = optimizer.optimize({
    kcal_min: 1000,
    kcal_max: 1300,
    protein_min: 30,
    protein_max: 40,
    volume_max: 1500,
    max_bags: 1,
});

console.log('Status:', result2.status);
console.log('Número de fórmulas diferentes:', result2.num_bags);
console.log('Fórmulas selecionadas:');
result2.selected_bags.forEach(bag => {
    console.log(`  - ${bag.name}: ${bag.quantity.toFixed(3)} bolsas`);
});
console.log('Total calorias:', result2.total_kcal);
console.log('Total proteína:', result2.total_protein);
console.log('Total volume:', result2.total_volume);
console.log('Custo total:', result2.total_cost);

console.log('\n==== Teste 3: Sem max_bags ====');
const result3 = optimizer.optimize({
    kcal_min: 1800,
    kcal_max: 2400,
    protein_min: 60,
    protein_max: 90,
    volume_max: 2500,
});

console.log('Status:', result3.status);
console.log('Número de fórmulas diferentes:', result3.num_bags);
console.log('Fórmulas selecionadas:');
result3.selected_bags.forEach(bag => {
    console.log(`  - ${bag.name}: ${bag.quantity.toFixed(3)} bolsas`);
});
console.log('Total calorias:', result3.total_kcal);
console.log('Total proteína:', result3.total_protein);
console.log('Total volume:', result3.total_volume);
console.log('Custo total:', result3.total_cost);
