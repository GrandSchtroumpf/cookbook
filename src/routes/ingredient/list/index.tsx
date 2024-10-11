import { component$ } from "@builder.io/qwik";
import { useGetAllStore } from "~/services/db";

export default component$(() => {
  const { list, loading } = useGetAllStore('ingredients');
  if (loading.value) return "Loading";
  return (
    <ul>
      {list.value!.map(ingredient => (
        <li key={ingredient.id}>{ingredient.name}</li>
      ))}
    </ul>
  )
})
