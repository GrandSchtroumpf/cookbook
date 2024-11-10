import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { LinkItem, NavGrid } from "qwik-hueeye";
import style from "./index.css?inline";

export default component$(() => {
  useStylesScoped$(style);
  return (
    <>
      <section>
        <h1>Mon livre de recettes</h1>
      </section>
      <NavGrid class="section">
        <LinkItem class="link" href="/ingredient/list">Mes Ingrédients</LinkItem>
        <LinkItem class="link" href="/recipe/list">Mes Recettes</LinkItem>
      </NavGrid>
    </>
  );
});

export const head: DocumentHead = {
  title: "Mon livre de recettes",
  meta: [
    {
      name: "description",
      content: "Livre de recettes and menus pour traiteur",
    },
  ],
};
