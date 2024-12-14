import { $, component$, unwrapStore, useSignal, useStore, useStyles$, useVisibleTask$ } from "@builder.io/qwik";
import { Form, FormField, Label, Input, resetForm } from "qwik-hueeye";
import { store } from "~/services/db";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { createId } from "~/services/utils";
import type { Shop } from "~/services/shop";
import styles from './index.css?inline';

export default component$(() => {
  useStyles$(styles);
  const nav = useNavigate();
  const initial = useSignal<Shop>();
  const shop = useStore<Shop>({
    id: createId(),
    name: '',
  });

  const { url } = useLocation();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const id = track(() => url.searchParams.get('id'));
    if (!id) return;
    initial.value = await store('shop').get(id);
    if (initial.value) resetForm(shop, initial.value);
  });

  const create = $(async () => {
    await store('shop').add(unwrapStore(shop));
    nav('/shop/list');
  });

  return (
    <main>
      <Form id="create-shop" bind:value={shop} onSubmit$={create}>
        <FormField>
          <Label>Nom du magasin</Label>
          <Input name="name" placeholder="Myrtille & Olive" required />
        </FormField>
        <footer>
          <button type="reset" class="he-btn">Annuler</button>
          <button type="submit" class="he-btn fill primary">Enregistrer</button>
        </footer>
      </Form>
    </main>
  )
})