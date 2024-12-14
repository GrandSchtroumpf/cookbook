import { component$, useStyles$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { LinkItem, NavGrid } from "qwik-hueeye";
import HomepageImg from '~/assets/homepage.jpg?jsx';
import IngredientImg from '~/assets/ingredient.jpg?w=300&h=300&jsx';
import RecipeImg from '~/assets/recipe.jpg?w=300&h=300&jsx';
import ShopImg from '~/assets/shop.jpg?w=300&h=300&jsx';
import style from "./index.css?inline";


export default component$(() => {
  useStyles$(style);
  return (
    <>
      <section class="homepage">
        <HomepageImg loading="eager" />
        <h1>Mon livre de recettes</h1>
      </section>
      <NavGrid class="navlist">
        <LinkItem class="link" href="/ingredient/list">
          <IngredientImg loading="eager" />
          <p>Mes Ingrédients</p>
        </LinkItem>
        <LinkItem class="link" href="/recipe/list">
          <RecipeImg loading="eager" />
          <p>Mes Recettes</p>
        </LinkItem>
        <LinkItem class="link" href="/shop/list">
          <ShopImg loading="eager" />
          <p>Ma list de magasins</p>
        </LinkItem>
        <LinkItem class="link" href="/menu/list">Mes Menus</LinkItem>
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
