import { $, component$, useStore, unwrapProxy } from "@builder.io/qwik";
import { AddControl, Form, FormField, GroupController, Input, Label, ListController, MatIcon, RemoveControl } from 'qwik-hueeye';
import { useIDB } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";

type CreateIngredient = Omit<Ingredient, 'id'>;

export default component$(() => {
  const { add } = useIDB();
  const ingredient = useStore<CreateIngredient>({
    name: '',
    weights: [],
  });
  const create = $(() => {
    return add('ingredients', unwrapProxy(ingredient) as Ingredient);
  });
  return (
    <Form bind:value={ingredient} onSubmit$={create}>
      <FormField>
        <Label>Name</Label>
        <Input name="name" placeholder="Name" required class="fill"/>
      </FormField>
      <ListController name="weights">
        <AddControl class="he-btn primary" item={{ label: '', gram: 1 }}>
          Ajouter un type de poids
        </AddControl>
        <ul>
          {ingredient.weights.map((_, i) => (
            <GroupController key={JSON.stringify(_)} name={i}>
              <li>
                <Input name="label" required />
                <Input name="gram" type="number" required />
                <RemoveControl index={i} class="he-btn-icon">
                  <MatIcon name="close" />
                </RemoveControl>
              </li>
            </GroupController>
          ))}
        </ul>
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
