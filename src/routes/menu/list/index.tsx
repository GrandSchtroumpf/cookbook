import { component$, useStyles$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LinkItem, NavGrid } from "qwik-hueeye";
import { useGetAllStore } from "~/services/db";
import style from './index.css?inline';

export default component$(() => {
  useStyles$(style);
  const { list, loading } = useGetAllStore('menu');
  if (loading.value) return;
  return (
    <main id="menu-list-page">
      <header>
        <h1>Mes Menus</h1>
        <Link class="he-btn primary fill" href="/menu/create">Ajouter un ingrédient</Link>
      </header>
      <NavGrid>
        {list.value!.map(({ id, name }) => (
          <LinkItem key={id} href="/menu/create" search={`?id=${id}`}>
            {name}
          </LinkItem>
        ))}
      </NavGrid>
    </main>
  )
})
