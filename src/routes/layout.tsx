import { component$, Slot, useStyles$ } from "@builder.io/qwik";
import { LinkItem, MatIcon, NavList } from "qwik-hueeye";
import style from './layout.css?inline';
import { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  useStyles$(style);
  return (
    <>
      <header>
        <NavList aria-orientation="horizontal">
          <LinkItem href="/" aria-label="Home Page">
            <MatIcon name="home_app_logo" />
          </LinkItem>
          <LinkItem href="/shop/list">Mes magasins</LinkItem>
          <LinkItem href="/ingredient/list">Mes ingrédients</LinkItem>
          <LinkItem href="/recipe/list">Mes recettes</LinkItem>
          <LinkItem href="/menu/list">Mes menus</LinkItem>
        </NavList>
      </header>
      <Slot />
    </>
  );
});

export const head: DocumentHead = {
  title: "Mon livre de recettes",
  meta: [
    {
      name: "description",
      content: "Livre de recettes & menus pour traiteur",
    },
    {
      name: 'og:local',
      content: 'fr-FR'
    },
    {
      name: "og:url",
      content: 'https://cookbook-seven-chi.vercel.app/'
    },
    {
      name: "og:description",
      content: 'Livre de recettes & menus pour traiteur'
    },
    {
      name: "og:image",
      content: '/og-img.jpg'
    },
    {
      name: "og:image:width",
      content: '300'
    },
    {
      name: "og:image:height",
      content: '300'
    }
  ],
};
