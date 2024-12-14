import type { QRL} from "@builder.io/qwik";
import { component$, $, useStore, unwrapStore, useSignal, useStyles$, useComputed$, useVisibleTask$ } from "@builder.io/qwik";
import { Form, FormField, GroupController, Input, Label, ListController, Autocomplete, MatIcon, RemoveControl, Textarea, AddControl, Field, Select, Option, resetForm } from "qwik-hueeye";
import { useGetAllStore, store } from "~/services/db";
import type { Recipe } from "~/services/recipe";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import type { Ingredient } from "~/services/ingredient";
import style from './index.css?inline';
import { ShoppingList } from "~/components/shopping-list";
import { createId } from "~/services/utils";

const units: Record<Ingredient['unit'], string> = {
  g: 'g',
  ml: 'ml',
  unit: 'unité',
}

export default component$(() => {
  useStyles$(style);
  const navigate = useNavigate();
  const initial = useSignal<Recipe>();
  const recipe = useStore<Recipe>({
    id: createId(),
    name: "",
    ingredients: [],
    steps: [],
    servings: 0,
    duration: 0,
    cooking: 0
  });

  const { url } = useLocation();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const id = track(() => url.searchParams.get('id'));
    if (!id) return;
    initial.value = await store('recipe').get(id);
    if (initial.value) resetForm(recipe, initial.value);
  });

  const { list: ingredientList } = useGetAllStore('ingredient');
  const ingredientRecord = Object.fromEntries(ingredientList.value.map(i => ([i.id, i])));

  const create = $(async () => {
    const result = unwrapStore(recipe);
    if (initial.value) {
      await store('recipe').put(result);
    } else {
      await store('recipe').add(result);
    }
    navigate('/recipe/list');
  });
  const selectIngredient = $((id: string) => recipe.ingredients.push({ id, amount: 0, label: "" }));

  return (
    <main>
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
            <Input type="number" name="servings" class="fill" required placeholder="4" min="0" />
          </FormField>
          <FormField>
            <Label>Temps de préparation</Label>
            <Input type="number" name="duration" class="fill" placeholder="4" min="0" step="any"/>
          </FormField>
          <FormField>
            <Label>Temps de cuissin</Label>
            <Input type="number" name="cooking" class="fill" placeholder="4" min="0" step="any"/>
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
                          <Input placeholder="1" type="number" name="amount" min="0" step="any" required />
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

        <section class="price-section">
          <hgroup>
            <h2>Prix de la recette</h2>
            <p>Estimer le prix pour un nombre de personne</p>
          </hgroup>
          {!!ingredientList.value.length && (
            <ShoppingList recipes={[recipe]} ingredients={ingredientList.value} />
          )}
        </section>

        <footer>
          <button type="submit" class="he-btn fill primary">
            Enregistrer
          </button>
        </footer>
      </Form>
    </main>
  );
});


interface Props {
  selected: string[];
  onSelect$: QRL<(id: string) => void>
}
export const SelectIngredient = component$<Props>(({ selected, onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list } = useGetAllStore('ingredient');

  const items = useComputed$(() => list.value.filter(({ id }) => !selected.includes(id)));

  const select = $(async (id: string) => {
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
    const id = await store('ingredient').add({ id: createId(), name: input.value, weights: [], shops: {}, unit: 'g' });
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
