import type { QRL} from "@builder.io/qwik";
import { component$, $, useStore, unwrapStore, useStyles$, useSignal } from "@builder.io/qwik";
import { Autocomplete, Form, FormField, GroupController, Input, Label, ListController, MatIcon } from "qwik-hueeye";
import { useGetAllStore, store } from "~/services/db";
import type { Menu } from "~/services/menu";
import { toRecord } from "~/services/utils";
import styles from './index.css?inline';

type CreateMenu = Omit<Menu, "id">;

export default component$(() => {
  useStyles$(styles);
  const {list} = useGetAllStore("recipe");
  const recipeRecord = toRecord(list.value, 'id');
  const menu = useStore<CreateMenu>({
    name: "",
    servings: 0,
    groups: [],
  });

  const addRecipe = $((id: number) => {
    if (!menu.groups.length) {
      menu.groups.push({ name: '', recipeIds: [id] })
    } else {
      menu.groups[0].recipeIds.push(id);
    }
  })

  const handleSubmit = $(() => store('menu').add(unwrapStore(menu)));
  return (
    <>
    <Form id="create-menu" bind:value={menu} onSubmit$={handleSubmit}>
      <section>
        <FormField>
          <Label>Nom du menu</Label>
          <Input type="text" name="name" placeholder="Mariage de Jean & Marie" required/>
        </FormField>
        <FormField>
          <Label>Nombre de personnes</Label>
          <Input type="number" name="servings" placeholder="50" required/>
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

  const recordIngredients = toRecord(ingredientsDB.value, 'id');
  const recordRecipes = toRecord(recipesDB.value, 'id');


  const result: Record<number, number> = {};
  const recipeIds = menu.groups.map((group) => group.recipeIds).flat();
  for (const recipeId of recipeIds) {
    const recipe = recordRecipes[recipeId];
    const ingredients = recipe.ingredients;
    for (const ingredient of ingredients) {
      const multiplicator = menu.servings / recipe.servings;
      const getAmount = () => {
        if (!ingredient.label) return ingredient.amount;
        const weight = recordIngredients[ingredient.id].weights.find((w) => w.label === ingredient.label);
        if (!weight) throw new Error("Did not find weight label");
        return weight.unit * ingredient.amount;
      }
      result[ingredient.id] ||= 0;
      result[ingredient.id] += getAmount() * multiplicator;
    }
  }

  const list = Object.entries(result);

  return (
    <ul>
      {list.map(([id, amount]) => {
        const ingredient = recordIngredients[id];
        return (
          <li key={id}>{ingredient.name}: {formatNumber.format(amount)}{ingredient.unit}</li>
        )
      }
      )}
    </ul>
  )
});


interface Props {
  onSelect$: QRL<(id: number) => void>
}
export const SelectRecipe = component$<Props>(({ onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list } = useGetAllStore('recipe');

  const select = $(async (id: number) => {
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