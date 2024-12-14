import type { QRL} from "@builder.io/qwik";
import { component$, $, useStore, unwrapStore, useStyles$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Autocomplete, Form, FormField, GroupController, Input, Label, ListController, MatIcon, resetForm } from "qwik-hueeye";
import { useGetAllStore, store } from "~/services/db";
import type { Menu } from "~/services/menu";
import { createId, toRecord } from "~/services/utils";
import { useLocation } from "@builder.io/qwik-city";
import { ShoppingList } from "~/components/shopping-list";
import styles from './index.css?inline';

export default component$(() => {
  useStyles$(styles);
  const { list } = useGetAllStore("recipe");
  const { list: ingredients } = useGetAllStore('ingredient');
  const recipeRecord = toRecord(list.value, 'id');
  const menu = useStore<Menu>({
    id: createId(),
    name: "",
    servings: 0,
    groups: [],
  });
  
  const { url } = useLocation();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const id = track(() => url.searchParams.get('id'));
    if (!id) return;
    const result = await store('menu').get(id);
    if (result) resetForm(menu, result);
  });

  const addRecipe = $((id: string) => {
    if (!menu.groups.length) {
      menu.groups.push({ name: '', recipeIds: [id] })
    } else {
      menu.groups[0].recipeIds.push(id);
    }
  })

  const handleSubmit = $(() => {
    const result = unwrapStore(menu);
    store('menu').add({ ...result, id: createId() })
  });
  return (
    <main id="create-menu">
      <Form bind:value={menu} onSubmit$={handleSubmit}>
        <section>
          <FormField>
            <Label>Nom du menu</Label>
            <Input type="text" name="name" placeholder="Mariage de Jean & Marie" required/>
          </FormField>
          <FormField>
            <Label>Nombre de personnes</Label>
            <Input type="number" name="servings" placeholder="50" min="0" required/>
          </FormField>
        </section>
        <section>
          <h2>Composition du menu</h2>
          <SelectRecipe onSelect$={addRecipe}/>
          <ListController name="groups">
            <ul class="group-list">
              {!!menu.groups.length && <li id="menu-group-description">Grouper les recettes par nom</li>}
              {menu.groups.map((group, i) => (
                <li key={i}>
                  <GroupController name={i}>
                    <Input name="name" placeholder="Diner" class="underline" aria-describedby="menu-group-description" />
                    <ul class="recipe-list">
                      {group.recipeIds.map((id, j) => (
                        <li key={id}>
                          <p>{recipeRecord[id].name}</p>
                          <button type="button" class="he-btn icon" onClick$={() => group.recipeIds.splice(j, 1)}>
                            <MatIcon name="delete" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </GroupController>
                </li> 
              ))}
            </ul>
          </ListController>
        </section>
        <footer>
          <button type="submit" class="he-btn fill primary">Enregistrer</button>
        </footer>
      </Form>

      <section class="shopping-list-section">
        <h2>Liste des courses de ce menu</h2>
        {/* <IngredientList menu={menu} /> */}
        <ShoppingList
          recipes={menu.groups.map((g) => g.recipeIds).flat().map((id) => recipeRecord[id])}
          ingredients={ingredients.value}
        />
      </section>
    </main>
  )
})

interface Props {
  onSelect$: QRL<(id: string) => void>
}
export const SelectRecipe = component$<Props>(({ onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list } = useGetAllStore('recipe');

  const select = $(async (id: string) => {
    panel.value?.hidePopover();
    await onSelect$(id);
    ref.value!.value = '';
    ref.value!.focus();
  });
  
  return (
    <Autocomplete.Root class="outline">
      <Autocomplete.Input  ref={ref} placeholder="Aubergine" />
      <Autocomplete.Panel ref={panel} >
        <Autocomplete.Listbox>
          {!list.value.length && <p>Vous n'avez pas encore créé de recette</p>}
          {list.value.map(({ id, name }) => (
            <Autocomplete.Option key={id} onClick$={() => select(id)}>
              {name}
            </Autocomplete.Option>
          ))}
        </Autocomplete.Listbox>
      </Autocomplete.Panel>
    </Autocomplete.Root>
  )
})