import { component$, useComputed$, useSignal, useStore, useStyles$ } from "@builder.io/qwik";
import { Field, Input } from "qwik-hueeye";
import { useGetAllStore } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";
import type { Recipe } from "~/services/recipe";
import { eur } from "~/utils";
import style from './index.css?inline';

interface Props {
  recipes: Omit<Recipe, 'id'>[];
  ingredients: Ingredient[];
}

interface IngredientPrice {
  id: string;
  name: string;
  amount: number;
  shopPrices: Record<string, number>;
}

const findBestPrices = (recipes: Omit<Recipe, 'id'>[], ingredients: Ingredient[], servings: number) => {
  const map = new Map(ingredients.map((i) => [i.id, i]));
  const result: Record<string, IngredientPrice> = {};
  for (const recipe of recipes) {
    const ratio = (servings || 0) / recipe.servings;
    for (const ingredient of recipe.ingredients) {
      const { id, name, weights } = map.get(ingredient.id)!;
      const ingredientId = id.toString();
      result[ingredientId] ||= { id: ingredientId, name, amount: 0, shopPrices: {} };
      const amount = (() => {
        if (!ingredient.label) return ingredient.amount;
        const weight = weights.find(w => w.label === ingredient.label);
        if (!weight) throw new Error(`Label ${ingredient.label} doesn't exist on ${name}`);
        return weight.unit * ingredient.amount;
      })();
      result[ingredientId].amount += amount * ratio;
    }
  }
  for (const ingredientPrice of Object.values(result)) {
    const amount = ingredientPrice.amount;
    const { shops } = map.get(ingredientPrice.id)!;
    const prices: { [shopId: string]: number } = {};
    for (const [shopId, shopPrices] of Object.entries(shops)) {
      const calculatedPrice = shopPrices.map((p) => Math.ceil(amount / p.amount) * p.price);
      prices[shopId] = Math.min(...calculatedPrice);
    }
    result[ingredientPrice.id].shopPrices = prices;
  }
  return Object.values(result);
}

export const ShoppingList = component$<Props>(({ recipes, ingredients: allIngredients }) => {
  useStyles$(style);
  const { list: allShops } = useGetAllStore('shop');
  const servings = useSignal(0);
  const mySelectedShop = useStore<Record<string, string>>({});
  const ingredients = useComputed$(() => {
    const ingredientIds = recipes.map((r) => r.ingredients.map((i) => i.id)).flat();
    const ingredients = allIngredients.filter(v => ingredientIds.includes(v.id));
    return findBestPrices(recipes, ingredients, servings.value);
  });
  const recipeShops = useComputed$(() => {
    if (!allShops.value.length) return [];
    const shopMap = new Map(allShops.value.map((s) => [s.id, s]))
    const shopIds = ingredients.value.map((i) => Object.keys(i.shopPrices)).flat();
    return Array.from(new Set(shopIds)).map(id => shopMap.get(id)!);
  });
  const selectedShops = useComputed$(() => {
    const shops: Record<string, string> = {};
    for (const ingredient of ingredients.value) {
      const id = ingredient.id;
      if (typeof mySelectedShop[id] === 'string') {
        shops[id] = mySelectedShop[id];
      } else {
        // Smaller price
        shops[id] = Object.entries(ingredient.shopPrices).sort((a, b) => a[1] - b[1])[0][0];
      }
    }
    return shops;
  });
  const total = useComputed$(() => {
    return ingredients.value.reduce((acc, ingredient) => {
      const shopId = selectedShops.value[ingredient.id];
      return acc + ingredient.shopPrices[shopId];
    }, 0);
  });
  const perRecipe = useComputed$(() => {
    if (!servings.value || recipes.length !== 1) return 0;
    return total.value / recipes[0].servings;
  });
  const perServing = useComputed$(() => {
    if (!servings.value) return 0;
    return total.value / servings.value;
  });
  return (
    <>
      <header class="price-header">
        <Field class="outline servings">
          <label class="he-field-prefix" for="estimated-serving">Nombre de personnes: </label>
          <Input id="estimated-serving" type="number" min="0" placeholder="6" bind:value={servings} />
        </Field>
        <div class="total">
          <h3>Total: <output>{eur(total.value)}</output></h3>
          <p hidden={!perRecipe.value}>Prix par recette: <output>{eur(perRecipe.value)}</output></p>
          <p hidden={!perServing.value}>Prix par personne: <output>{eur(perServing.value)}</output></p>
        </div>
      </header>
      <table class="price-table">
        <thead>
          <tr>
            <th>Ingrédients</th>
            {recipeShops.value.map(({ id, name }) => (
              <th key={id}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredients.value.map(({ id, name, shopPrices }) => (
            <tr key={name}>
              <th>{name}</th>
              {recipeShops.value.map(({ id: shopId }) => (
                <td key={shopId}>
                  {shopPrices[shopId] && (
                    <button
                      type="button"
                      role="radio"
                      onClick$={() => mySelectedShop[id] = shopId.toString()}
                      aria-checked={selectedShops.value[id] === shopId.toString()}
                    >
                      {eur(shopPrices[shopId])}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
});