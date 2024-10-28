import type { QRL} from "@builder.io/qwik";
import { component$, $, useStore, unwrapStore, useSignal, useStyles$ } from "@builder.io/qwik";
import { Form, FormField, GroupController, Input, Label, ListController, Autocomplete, MatIcon, RemoveControl } from "qwik-hueeye";
import { useGetAllStore, store } from "~/services/db";
import type { Recipe } from "~/services/recipe";
import style from './index.css?inline';
import { useNavigate } from "@builder.io/qwik-city";

type CreateRecipe = Omit<Recipe, "id">;

export default component$(() => {
  useStyles$(style);
  const navigate = useNavigate();
  const recipe = useStore<CreateRecipe>({
    name: "",
    ingredients: [],
    servings: 0,
  });

  const { list: ingredientList } = useGetAllStore('ingredient');
  const ingredientRecord = Object.fromEntries(ingredientList.value.map(i => ([i.id, i])));

  const create = $(async () => {
    await store('recipe').add(unwrapStore(recipe));
    navigate('/recipe/list');
  });
  const selectIngredient = $((id: number) => recipe.ingredients.push({ id, amount: 0, label: "" }));

  return (
    <Form class="form" bind:value={recipe} onSubmit$={create}>
      <FormField>
        <Label>Nom de la recette</Label>
        <Input name="name" required class="fill" placeholder="Ratatouille"/>
      </FormField>

      <FormField>
        <Label>Nombre de personnes</Label>
        <Input type="number" name="servings" class="fill" required placeholder="4"/>
      </FormField>

      <FormField>
        <Label>Choisir un ingrédient</Label>
        <SelectIngredient onSelect$={selectIngredient} />
      </FormField>

      <ListController name="ingredients">
        <ul class="ingredient-list">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={ingredient.id}>
              <GroupController name={i}>
                <header>
                  <h4>{ingredientRecord[ingredient.id]?.name}</h4>
                  <RemoveControl class="he-btn-icon" index={i}>
                    <MatIcon name="delete" />
                  </RemoveControl>
                </header>
                <FormField>
                  <Label>Choisir une quantité</Label>
                  <Input placeholder="1" type="number" class="fill" name="amount" required />
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


interface Props {
  onSelect$: QRL<(id: number) => void>
}
export const SelectIngredient = component$<Props>(({ onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list, loading } = useGetAllStore('ingredient');


  const select = $((id: number) => {
    panel.value?.hidePopover();
    onSelect$(id);
    ref.value!.value = '';
  });
  
  const create = $(async () => {
    const input = ref.value!;
    const text = input.value.toLowerCase();
    const existing = list.value.find((ingredient) => ingredient.name === text);
    if (existing) return select(existing.id);
    const id = await store('ingredient').add({ name: input.value, weights: [] });
    select(id);
  });

  return (
    <Autocomplete.Root>
      <Autocomplete.Input class="fill" ref={ref} placeholder="Aubergine" />
      <button type="button" class="he-btn-icon he-field-suffix round" onClick$={create}>
        <MatIcon name="add" />
      </button>
      <Autocomplete.Panel ref={panel} >
        <Autocomplete.Listbox>
          {loading.value ? (
            <Autocomplete.Option>Empty</Autocomplete.Option>
          ) : (
            list.value.map(({ id, name }) => (
              <Autocomplete.Option key={id} onClick$={() => select(id)}>
                {name}
              </Autocomplete.Option>
            ))
          )}
        </Autocomplete.Listbox>
      </Autocomplete.Panel>
    </Autocomplete.Root>
  )
})