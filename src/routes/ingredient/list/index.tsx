import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { getDB } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";

export default component$(() => {
  const list = useSignal<Ingredient[]>([]);
  useVisibleTask$(async () => {
    const db = await getDB();
    list.value = await db.getAll('ingredients');
  });
  if (!list.value.length) return "Loading";
  return <List list={list.value}/>;
})

interface Props {
  list: Ingredient[];
}
const List = component$<Props>(({ list }) => {
  return (
    <ul>
      {list.map(ingredient => (
        <li key={ingredient.id}>{ingredient.name}</li>
      ))}
    </ul>
  )
})