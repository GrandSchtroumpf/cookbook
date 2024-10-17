import { component$, Slot } from "@builder.io/qwik";
import { LinkItem, NavList } from "qwik-hueeye";

export default component$(() => {
  return (
    <>
      <header>
        <NavList aria-orientation="horizontal">
          <LinkItem href="/ingredient/list">Ingrédient</LinkItem>
          <LinkItem href="/ingredient/create">Crée ton ingrédient</LinkItem>
          <LinkItem href="/recipe/create">Crée ta recette</LinkItem>
          <LinkItem href="/recipe/list">Recettes</LinkItem>
          <LinkItem href="/menu/create">Crée ton menu</LinkItem>
        </NavList>
      </header>
      <main>
        <Slot />
      </main>
    </>
  );
});
