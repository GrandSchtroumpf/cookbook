import { component$, Slot, useStyles$ } from "@builder.io/qwik";
import { LinkItem, MatIcon, NavList } from "qwik-hueeye";
import style from './layout.css?inline';

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
