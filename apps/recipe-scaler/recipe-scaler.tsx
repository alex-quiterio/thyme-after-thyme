import React, { useState } from 'react';
import { Scale, Plus, Trash2 } from 'lucide-react';

export default function RecipeScaler() {
  const [ingredients, setIngredients] = useState([
    { name: 'Flour', amount: 200, unit: 'g' },
    { name: 'Butter', amount: 100, unit: 'g' },
    { name: 'Water/Milk', amount: 70, unit: 'ml' }
  ]);
  
  const [targetIndex, setTargetIndex] = useState(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [scaledIngredients, setScaledIngredients] = useState(null);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'g' }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    if (targetIndex === index) {
      setTargetIndex(null);
      setScaledIngredients(null);
    }
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
    setScaledIngredients(null);
  };

  const calculateScaled = () => {
    if (targetIndex === null || !targetAmount || !ingredients[targetIndex].amount) {
      return;
    }

    const baseAmount = parseFloat(ingredients[targetIndex].amount);
    const newAmount = parseFloat(targetAmount);
    const scaleFactor = newAmount / baseAmount;

    const scaled = ingredients.map((ing, idx) => ({
      ...ing,
      scaledAmount: idx === targetIndex ? newAmount : parseFloat(ing.amount) * scaleFactor
    }));

    setScaledIngredients(scaled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Scale className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-800">Recipe Proportion Calculator</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Original Recipe</h2>
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-3 mb-3 items-start">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                    className="w-28 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                  </select>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addIngredient}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Ingredient
              </button>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Scale Recipe</h2>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I have this much of:
                  </label>
                  <select
                    value={targetIndex ?? ''}
                    onChange={(e) => {
                      setTargetIndex(e.target.value === '' ? null : parseInt(e.target.value));
                      setScaledIngredients(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map((ing, idx) => (
                      <option key={idx} value={idx}>
                        {ing.name || `Ingredient ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount:
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={targetAmount}
                    onChange={(e) => {
                      setTargetAmount(e.target.value);
                      setScaledIngredients(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={calculateScaled}
                  disabled={targetIndex === null || !targetAmount}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Calculate
                </button>
              </div>
            </div>

            {scaledIngredients && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Scaled Recipe</h2>
                <div className="bg-orange-50 rounded-lg p-6">
                  {scaledIngredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">{ing.name}</span>
                      <span className="text-lg text-orange-600 font-semibold">
                        {ing.scaledAmount.toFixed(2)} {ing.unit}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-orange-200 text-sm text-gray-600">
                    Scale factor: {(scaledIngredients[targetIndex].scaledAmount / ingredients[targetIndex].amount).toFixed(2)}x
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}