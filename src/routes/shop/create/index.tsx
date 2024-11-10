import { $, component$, unwrapStore, useStore, useStyles$ } from "@builder.io/qwik";
import { Form, FormField, Label, Input } from "qwik-hueeye";
import { store } from "~/services/db";
import type { Shop } from "~/services/shop";
import styles from './index.css?inline';

type CreateShop = Omit<Shop, 'id'>;

export default component$(() => {
  useStyles$(styles);
  const shop = useStore<CreateShop>({
    name: '',
  });

  const create = $(() => store('shop').add(unwrapStore(shop)));

  return (
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
  )
})