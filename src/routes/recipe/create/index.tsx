import { component$, useSignal, useVisibleTask$, $, useStore, unwrapProxy } from "@builder.io/qwik";
import { AddControl, Form, FormField, GroupController, Input, Label, ListController, Option, Select } from "qwik-hueeye";
import { getDB } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";
import type { Recipe } from "~/services/recipe";

export default component$(() => {
  const recipe = useStore<Recipe>({
    name: "",
    ingredients: [],
  });

  const getIngredientList = $(async () => {
    const db = await getDB();
    return db.getAll("ingredients");
  });

  const ingredientList = useSignal<Ingredient[]>([]);

  useVisibleTask$(async () => {
    ingredientList.value = await getIngredientList();
  });

  const hanleSubmit = $(async () => {
    const db = await getDB();
    db.add("recipe", unwrapProxy(recipe));
  });

  return (
    <Form bind:value={recipe} onSubmit$={hanleSubmit}>
      <FormField>
        <Label>Nom de la recette</Label>
        <Input name="name" required class="fill" />
      </FormField>

      <ListController name="ingredients">
        <AddControl item={{ id: 0, label: "", amount: 0 }}>Ajouter un ingrédient</AddControl>
        <ul>
          {recipe.ingredients.map((ingredient, i) => (
            <li key={ingredient.id}>
              <GroupController name={i}>
                <FormField>
                  <Label>Choisir un ingredient</Label>
                  <Select name="id">
                    {ingredientList.value.map(({ id, name }) => (
                      <Option key={id} value={id}>{name}</Option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label>Choisir une quantité</Label>
                  <Input type="number" name="amount" />
                </FormField>
              </GroupController>
            </li>
          ))}
        </ul>
      </ListController>
      <button type="submit" class="he-btn primary">Créer la recette</button>
    </Form>
  );
});