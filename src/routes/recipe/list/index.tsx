import { component$, useStyles$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LinkItem, NavGrid } from "qwik-hueeye";
import { useGetAllStore } from "~/services/db";
import style from './index.css?inline';

export default component$(() => {
  useStyles$(style);
  const { list, loading } = useGetAllStore('recipe');
  if (loading.value) return;
  return (
    <main id="recipe-list-page">
      <header>
        <h1>Mes recettes</h1>
        <Link class="he-btn primary fill" href="/recipe/create">Ajouter une Recette</Link>
      </header>
      <NavGrid>
        {list.value!.map(({ id, name }) => (
          <LinkItem key={id} href="/recipe/create" search={`?id=${id}`}>
            {name}
          </LinkItem>
        ))}
      </NavGrid>
    </main>
  )
})
