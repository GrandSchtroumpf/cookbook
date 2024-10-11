import { component$ } from "@builder.io/qwik";
import { useGetAllStore } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";

export default component$(() => {
  const { result: list } = useGetAllStore('ingredients');
  if (!list.value?.length) return "Loading";
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