import { component$, useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { Form, FormField, Input, Label } from "qwik-hueeye";
import { useGetStore } from "~/services/db";

export default component$(() => {
  const { id } = useLocation().params;
  const { result } = useGetStore('ingredient', +id);
  const ingredient = useStore(result.value);
  // useTask$(({ track }) => {
  //   track(() => result);
    
  // })
  return (
    <Form bind:value={ingredient}>
      <FormField>
        <Label>Nom de l'ingrédient</Label>
        <Input name="name" />
      </FormField>
      <FormField>
        <Label>Nom de l'ingrédient</Label>
        <Input name="name" />
      </FormField>
    </Form>
  )
})