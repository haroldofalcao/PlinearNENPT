// Test script to verify volume constraint
import { ParenteralNutritionOptimizer } from './src/lib/optimizer.ts';

const mockFormulas = [
  {
    id: 'PN001',
    name: 'Formula A 1540mL',
    manufacturer: 'Test',
    volume_ml: 1540,
    kcal: 1000,
    protein_g_l: 40.0,
    nitrogen_g_l: 6.4,
    glucose_g_l: 140,
    fat_g_l: 30,
    emulsion_type: 'Soja',
    via: 'Central',
    osmolarity: 1200,
    base_cost: 50.00,
  },
  {
    id: 'PN002',
    name: 'Formula B 1540mL',
    manufacturer: 'Test',
    volume_ml: 1540,
    kcal: 500,
    protein_g_l: 20.0,
    nitrogen_g_l: 3.2,
    glucose_g_l: 100,
    fat_g_l: 20,
    emulsion_type: 'Soja',
    via: 'Central',
    osmolarity: 1000,
    base_cost: 30.00,
  },
];

const optimizer = new ParenteralNutritionOptimizer(mockFormulas);

console.log('==== Teste: volume_max = 3000, esperando que 3080mL seja REJEITADO ====');
const result = optimizer.optimize({
  kcal_min: 2000,
  kcal_max: 5000,
  protein_min: 60,
  protein_max: 200,
  volume_max: 3000,
  max_bags: 10,
});

console.log('Status:', result.status);
console.log('Mensagem:', result.message);
console.log('Volume total:', result.total_volume, 'mL');
console.log('Fórmulas selecionadas:');
result.selected_bags.forEach(bag => {
  console.log(`  - ${bag.name}: ${bag.quantity}x (${bag.volume_contribution}mL)`);
});

if (result.total_volume > 3000 && result.status === 'Optimal') {
  console.log('\n❌ ERRO: Volume excedeu o máximo mas foi aceito como Optimal!');
} else if (result.total_volume > 3000 && result.status === 'Infeasible') {
  console.log('\n✅ CORRETO: Volume excedeu o máximo e foi rejeitado como Infeasible');
} else {
  console.log('\n✅ Volume dentro do limite');
}
