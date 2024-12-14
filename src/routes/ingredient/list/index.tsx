import { component$, useStyles$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LinkItem, NavGrid } from "qwik-hueeye";
import { useGetAllStore } from "~/services/db";
import style from './index.css?inline';

export default component$(() => {
  useStyles$(style);
  const { list, loading } = useGetAllStore('ingredient');
  if (loading.value) return;
  return (
    <main id="ingredient-list-page">
      <header>
        <h1>Ma liste d'ingrédients</h1>
        <Link class="he-btn primary fill" href="/ingredient/create">Ajouter un ingrédient</Link>
      </header>
      <NavGrid>
        {list.value!.map(({ id, name }) => (
          <LinkItem key={id} href="/ingredient/create" search={`?id=${id}`}>
            {name}
          </LinkItem>
        ))}
      </NavGrid>
    </main>
  )
})
