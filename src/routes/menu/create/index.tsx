import { component$, $, useStore, unwrapStore} from "@builder.io/qwik";
import { Combobox, Form, FormField, Input, Label, Option } from "qwik-hueeye";
import { useGetAllStore, store } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";
import type { Menu } from "~/services/menu";
import type { Recipe } from "~/services/recipe";

type CreateMenu = Omit<Menu, "id">;

export default component$(() => {
  const {list} = useGetAllStore("recipe");
  const menu = useStore<CreateMenu>({
    name: "",
    servings: 0,
    recipeIds: [],
  })
  const handleSubmit = $(() => store('menu').add(unwrapStore(menu)));
  return (
    <>
    <Form bind:value={menu} onSubmit$={handleSubmit}>
      <FormField>
        <Label>Nom du menu</Label>
        <Input type="text" name="name" required/>
      </FormField>
      <FormField>
        <Label>Nombre de personnes</Label>
        <Input type="number" name="servings" required/>
      </FormField>
      <FormField>
        <Label>Composition du menu</Label>
        <Combobox name="recipeIds" multi>
          {list.value.map(({name, id}) => <Option key={id} value={id}>{name}</Option>)}
        </Combobox>
      </FormField>
      <button class="he-btn-fill primary" type="submit">Enregistrer</button>
    </Form>

    <section>
      <h2>Liste des courses de ce menu</h2>
      <IngredientList menu ={menu}/>
    </section>
    </>
  )
})

const formatNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1});

const IngredientList = component$(({menu}: {menu : CreateMenu}) => {
  const {list: ingredientsDB} = useGetAllStore('ingredient');
  const {list: recipesDB} = useGetAllStore("recipe");

  const recordIngredients : Record<string, Ingredient>= {};
  for (const ingredient of ingredientsDB.value) {
    recordIngredients[ingredient.id] = ingredient;
  }

  const recordRecipes: Record<number, Recipe> = {};
  for (const recipe of recipesDB.value) {
    recordRecipes[recipe.id] = recipe;
  }

  const result: Record<number, number> = {};
  for (const recipeId of menu.recipeIds) {
    const recipe = recordRecipes[recipeId];
    const ingredients = recipe.ingredients;
    for (const ingredient of ingredients) {
      const multiplicator = menu.servings / recipe.servings;
      result[ingredient.id] ||= 0;
      result[ingredient.id] += ingredient.amount * multiplicator;
    }
  }

  const list = Object.entries(result);

  return (
    <ul>
      {list.map(([id, amount]) => <li key={id}>{recordIngredients[id].name} x{formatNumber.format(amount)}</li>)}
    </ul>
  )
});

