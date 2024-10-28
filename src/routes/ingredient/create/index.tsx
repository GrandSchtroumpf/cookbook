import { $, component$, useStore, unwrapStore } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { AddControl, Form, FormField, GroupController, Input, Label, ListController, MatIcon, RemoveControl, useListControl } from 'qwik-hueeye';
import { store } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";

type CreateIngredient = Omit<Ingredient, 'id'>;

export default component$(() => {
  const navigate = useNavigate();
  const ingredient = useStore<CreateIngredient>({
    name: '',
    weights: [],
  });
  const create = $(async () => {
    await store('ingredient').add(unwrapStore(ingredient));
    navigate('/');
  });
  return (
    <Form bind:value={ingredient} onSubmit$={create}>
      <FormField>
        <Label>Name</Label>
        <Input name="name" placeholder="Name" required class="fill"/>
      </FormField>
      <ListController name="weights">
        <WeightTable />
      </ListController>
      <footer>
        <button type="reset" class="he-btn">Reset</button>
        <button type="submit" class="he-btn-fill primary">
          Ajouter l'ingredient
        </button>
      </footer>
    </Form>
  )
});

const WeightTable = component$(() => {
  const { list } = useListControl();
  if (!list.value.length) return (
    <AddControl class="he-btn primary" item={{ label: '', gram: 0 }}>
      Ajouter un type de poids
    </AddControl>
  );
  return (
    <table>
      <thead>
        <tr>
          <th id="head-label">Label</th>
          <th id="head-gram">Grammes</th>
          <th>
          <AddControl class="he-btn-icon tooltip primary" aria-description="Ajouter un poids" item={{ label: '', gram: 0 }}>
            <MatIcon name="add" />
          </AddControl>
          </th>
        </tr>
      </thead>
      <tbody>
        {list.value.map((_, i) => (
          <tr key={JSON.stringify(_)}>
            <GroupController name={i}>
              <td>
                <Input name="label" placeholder="Label" required aria-labelledby="head-label"/>
              </td>
              <td>
                <Input name="gram" placeholder="Gramme" type="number" min="0" required aria-labelledby="head-gram" />
              </td>
              <td>
                <RemoveControl index={i} class="he-btn-icon">
                  <MatIcon name="close" />
                </RemoveControl>
              </td>
            </GroupController>
          </tr>
        ))}
      </tbody>
    </table>
  )
})