import type { QRL} from "@builder.io/qwik";
import { component$, $, useStore, unwrapStore, useSignal, useStyles$, useComputed$ } from "@builder.io/qwik";
import { Form, FormField, GroupController, Input, Label, ListController, Autocomplete, MatIcon, RemoveControl, Textarea, AddControl, Field, Select, Option } from "qwik-hueeye";
import { useGetAllStore, store } from "~/services/db";
import type { Recipe } from "~/services/recipe";
import { useNavigate } from "@builder.io/qwik-city";
import style from './index.css?inline';
import { Ingredient } from "~/services/ingredient";

type CreateRecipe = Omit<Recipe, "id">;

const units: Record<Ingredient['unit'], string> = {
  g: 'g',
  ml: 'ml',
  unit: 'unité',
}

export default component$(() => {
  useStyles$(style);
  const navigate = useNavigate();
  const recipe = useStore<CreateRecipe>({
    name: "",
    ingredients: [],
    steps: [],
    servings: 0,
    duration: 0,
    cooking: 0
  });

  const { list: ingredientList } = useGetAllStore('ingredient');
  const ingredientRecord = Object.fromEntries(ingredientList.value.map(i => ([i.id, i])));

  const create = $(async () => {
    await store('recipe').add(unwrapStore(recipe));
    navigate('/recipe/list');
  });
  const selectIngredient = $((id: number) => recipe.ingredients.push({ id, amount: 0, label: "" }));

  return (
    <Form class="create-recipe" bind:value={recipe} onSubmit$={create}>
      <section class="main-section">
        <FormField>
          <Label>Nom de la recette</Label>
          <Input name="name" required class="fill" placeholder="Ratatouille"/>
        </FormField>

        <FormField class="description">
          <Label>Description</Label>  
          <Textarea name="description" class="fill" placeholder="Recette à réaliser la veille"/>
        </FormField>
      </section>

      <section class="aside-section">
        <FormField>
          <Label>Nombre de personnes</Label>
          <Input type="number" name="servings" class="fill" required placeholder="4"/>
        </FormField>
        <FormField>
          <Label>Temps de préparation</Label>
          <Input type="number" name="duration" class="fill" required placeholder="4"/>
        </FormField>
        <FormField>
          <Label>Temps de cuissin</Label>
          <Input type="number" name="cooking" class="fill" placeholder="4"/>
        </FormField>
      </section>

      <section class="ingredient-section">
        <h2>Ajouter les ingrédients de la recette</h2>
        <FormField>
          <Label>Choisir un ingrédient</Label>
          <SelectIngredient selected={recipe.ingredients.map(({ id }) => id)} onSelect$={selectIngredient} />
        </FormField>

        <ListController name="ingredients">
          <ul class="ingredient-list">
            {recipe.ingredients.map((ingredient, i) => {
              const { name, weights, unit } = ingredientRecord[ingredient.id];
              return (
                <li key={ingredient.id}>
                  <GroupController name={i}>
                    <header>
                      <h4>{name}</h4>
                      <RemoveControl class="he-btn icon" index={i}>
                        <MatIcon name="delete" />
                      </RemoveControl>
                    </header>
                    <FormField>
                      <Label>Choisir une quantité</Label>
                      <Field class="fill">
                        <Input placeholder="1" type="number" name="amount" required />
                        {!weights.length ? (
                          <span class="he-field-suffix unit-suffix">
                            {units[unit]}
                          </span>
                        ) : (
                          <Select name="label" class="he-field-suffix unit-suffix">
                            <Option value="">{units[unit]}</Option>
                            {weights.map(({ label }) => (
                              <Option key={label} value={label}>{label}</Option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </FormField>
                  </GroupController>
                </li>
              )
            })}
          </ul>
        </ListController>
      </section>

      <section class="step-section">
        <ListController name="steps">
          <header>
            <h2>Etapes de la recette</h2>
            <AddControl class="he-btn primary" item="">
              Ajouter une étape
              <MatIcon name="add" />
            </AddControl>
          </header>
          <ol class="step-list">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <span class="index-indicator">{i + 1}</span>
                <Textarea placeholder="Couper les légumes..." name={i} rows={1} required />
                <RemoveControl class="he-btn icon" index={i}>
                  <MatIcon name="delete" />
                </RemoveControl>
              </li>
            ))}
          </ol>
          <AddControl class="he-btn primary" item="">
            Ajouter une étape
            <MatIcon name="add" />
          </AddControl>
        </ListController>
      </section>


      <footer>
        <button type="submit" class="he-btn fill primary">Créer la recette</button>
      </footer>
    </Form>
  );
});


interface Props {
  selected: number[];
  onSelect$: QRL<(id: number) => void>
}
export const SelectIngredient = component$<Props>(({ selected, onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list } = useGetAllStore('ingredient');

  const items = useComputed$(() => list.value.filter(({ id }) => !selected.includes(id)));

  const select = $(async (id: number) => {
    panel.value?.hidePopover();
    await onSelect$(id);
    ref.value!.value = '';
    ref.value!.focus();
  });
  
  const create = $(async () => {
    const input = ref.value!;
    const text = input.value.toLowerCase();
    if (!text) return;
    const existing = list.value.find((ingredient) => ingredient.name === text);
    if (existing) return select(existing.id);
    const id = await store('ingredient').add({ name: input.value, weights: [], shops: {}, unit: 'g' });
    select(id);
  });

  return (
    <Autocomplete.Root class="outline">
      <Autocomplete.Input  ref={ref} placeholder="Aubergine" />
      <button type="button" class="he-btn icon he-field-suffix" onClick$={create}>
        <MatIcon name="add" />
      </button>
      <Autocomplete.Panel ref={panel} >
        <Autocomplete.Listbox>
          {!items.value.length && <p>Cliquer sur "+" pour créer un ingrédient</p>}
          {items.value.map(({ id, name }) => (
            <Autocomplete.Option key={id} onClick$={() => select(id)}>
              {name}
            </Autocomplete.Option>
          ))}
        </Autocomplete.Listbox>
      </Autocomplete.Panel>
    </Autocomplete.Root>
  )
})