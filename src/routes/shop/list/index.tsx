import { component$, useStyles$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LinkItem, NavGrid } from "qwik-hueeye";
import { useGetAllStore } from "~/services/db";
import style from './index.css?inline';

export default component$(() => {
  useStyles$(style);
  const { list, loading } = useGetAllStore('shop');
  if (loading.value) return;
  return (
    <main id="shop-list-page">
      <header>
        <h1>Mes magasins préférés</h1>
        <Link class="he-btn primary fill" href="/shop/create">Ajouter un ingrédient</Link>
      </header>
      <NavGrid>
        {list.value!.map(({ id, name }) => (
          <LinkItem key={id} href="/shop/create" search={`?id=${id}`}>
            {name}
          </LinkItem>
        ))}
      </NavGrid>
    </main>
  )
})
