import { component$ } from "@builder.io/qwik";
import { useGetAllStore } from "~/services/db";

export default component$(() => {
  const {list, loading} = useGetAllStore("recipe");

  if (loading.value) return <p>... chargement</p>;

  return(
    <ul>
      {list.value.map((recipe) => <li key={recipe.id}>{recipe.name}</li>)}
    </ul>
  )
})