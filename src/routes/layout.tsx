import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { LinkItem, NavList } from "qwik-hueeye";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export default component$(() => {
  return (
    <>
      <header>
        <NavList>
          <LinkItem href="/ingredient/list">Ingrédient</LinkItem>
          <LinkItem href="/ingredient/create">Crée ton ingrédient</LinkItem>
          <LinkItem href="/recipe/create">Crée ta recette</LinkItem>
        </NavList>
      </header>
      <main>
        <Slot />
      </main>
    </>
  );
});
