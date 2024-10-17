import { component$, $, useStore, unwrapStore} from "@builder.io/qwik";
import { Combobox, Form, FormField, Input, Label, Option } from "qwik-hueeye";
import { useGetAllStore, add } from "~/services/db";
import type { Menu } from "~/services/menu";

type CreateMenu = Omit<Menu, "id">;

export default component$(() => {
  const {list} = useGetAllStore("recipe");
  const menu = useStore<CreateMenu>({
    name: "",
    recipeIds: [],
  })
  const handleSubmit = $(() => add("menu", unwrapStore(menu)));
  return (
    <Form bind:value={menu} onSubmit$={handleSubmit}>
      <FormField>
        <Label>Nom du menu</Label>
        <Input type="text" name="name" required/>
      </FormField>
      <FormField> 
        <Label>Composition du menu</Label>
        <Combobox name="recipeIds" multi>
          {list.value.map(({name, id}) => <Option key={id} value={id}>{name}</Option>)}
        </Combobox>
      </FormField>
      <button class="he-btn-fill primary" type="submit">Enregistrer</button>
    </Form>
  )
})