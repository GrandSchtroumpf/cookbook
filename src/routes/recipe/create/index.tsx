import type { QRL} from "@builder.io/qwik";
import { component$, $, useStore, unwrapProxy, useSignal } from "@builder.io/qwik";
import { Form, FormField, GroupController, Input, Label, ListController, Autocomplete } from "qwik-hueeye";
import { useGetAllStore, useIDB } from "~/services/db";
import type { Recipe } from "~/services/recipe";


export default component$(() => {
  const { add } = useIDB();
  const recipe = useStore<Recipe>({
    name: "",
    ingredients: [],
  });

  const { list: ingredientList } = useGetAllStore('ingredients');
  const ingredientRecord = Object.fromEntries(ingredientList.value.map(i => ([i.id, i])));

  const hanleSubmit = $(() => add("recipe", unwrapProxy(recipe)));
  const selectIngredient = $((id: number) => recipe.ingredients.push({id, amount: 0, label: ""}));

  return (
    <Form bind:value={recipe} onSubmit$={hanleSubmit}>
      <FormField>
        <Label>Nom de la recette</Label>
        <Input name="name" required class="fill" />
      </FormField>

      <SelectIngredient onSelect$={selectIngredient} />

      <ListController name="ingredients">
        <ul>
          {recipe.ingredients.map((ingredient, i) => (
            <li key={ingredient.id}>
              <GroupController name={i}>
               <p>{ingredientRecord[ingredient.id].name}</p>
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


interface Props {
  onSelect$: QRL<(id: number) => void>
}
export const SelectIngredient = component$<Props>(({ onSelect$ }) => {
  const panel = useSignal<HTMLDivElement>();
  const { list, loading } = useGetAllStore('ingredients');

  const select = $((id: number) => {
    panel.value?.hidePopover();
    onSelect$(id);
  })

  return (
    <Autocomplete.Root>
      <Autocomplete.Input/>
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