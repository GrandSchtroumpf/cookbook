import { component$ } from "@builder.io/qwik";
import { LinkItem, NavGrid } from "qwik-hueeye";
import { useGetAllStore } from "~/services/db";

export default component$(() => {
  const { list, loading } = useGetAllStore('ingredient');
  if (loading.value) return "Loading";
  return (
    <NavGrid>
      {list.value!.map(({ id, name }) => (
        <LinkItem key={id} href={'/ingredient/' + id}>
          {name}
        </LinkItem>
      ))}
    </NavGrid>
  )
})
