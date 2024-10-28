import { component$, Slot, useStylesScoped$ } from "@builder.io/qwik";
import { LinkItem, NavList } from "qwik-hueeye";
import style from './layout.css?inline';

export default component$(() => {
  useStylesScoped$(style);
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
      <main class="main">
        <Slot />
      </main>
    </>
  );
});
