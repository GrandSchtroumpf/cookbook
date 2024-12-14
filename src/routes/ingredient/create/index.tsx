import type { QRL } from "@builder.io/qwik";
import { $, component$, useStore, unwrapStore, useStyles$, useSignal, useComputed$, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { AddControl, Autocomplete, Form, FormField, GroupController, Input, Label, ListController, MatIcon, Option, RemoveControl, Select, resetForm, useListControl } from 'qwik-hueeye';
import { store, useGetAllStore } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";
import { createId } from "~/services/utils";
import style from './index.css?inline';

const units = {
  g: 'Gramme',
  ml: 'Millilitre',
  unit: 'Unité'
}

export default component$(() => {
  useStyles$(style);
  const initial = useSignal<Ingredient>();
  const navigate = useNavigate();
  const ingredient = useStore<Ingredient>({
    id: createId(),
    name: '',
    unit: 'g',
    weights: [],
    shops: {},
  });

  const { url } = useLocation();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const id = track(() => url.searchParams.get('id'));
    if (!id) return;
    initial.value = await store('ingredient').get(id);
    if (initial.value) resetForm(ingredient, initial.value);
  });

  const { list: shops } = useGetAllStore('shop');

  const shopName = useComputed$(() => Object.fromEntries(shops.value.map((s) => [s.id, s.name])));

  const upsert = $(async () => {
    if (initial.value) {
      const oldWeights = initial.value.weights.filter((oldWeight) => {
        return !ingredient.weights.some(({ label }) => label === oldWeight.label)
      });
      if (oldWeights.length) {
        // TODO: find recipe with this ingredient. 
        // const recipies = await store('recipe').getAll();
        // for (const recipe of recipies) {
        // }
      }
      await store('ingredient').put(unwrapStore(ingredient));
    } else {
      await store('ingredient').add(unwrapStore(ingredient));
    }
    navigate('/ingredient/list');
  });

  const selectShop = $((shopId: string) => ingredient.shops[shopId] = [{ price: 0, amount: 0 }]);

  return (
    <main>
      <Form id="create-ingredient" bind:value={ingredient} onSubmit$={upsert}>
        <section>
          <FormField>
            <Label>Name</Label>
            <Input name="name" placeholder="Name" required class="fill"/>
          </FormField>
        </section>

        <section>
          <h2>Type de quantité</h2>
          <FormField>
            <Label>Reference de poids</Label>
            <Select name="unit">
              <Option value="g">Gramme (g)</Option>
              <Option value="ml">Millilitre (ml)</Option>
              <Option value="unit">Unité</Option>
            </Select>
          </FormField>
          <ListController name="weights">
            <WeightTable unit={ingredient.unit} />
          </ListController>
        </section>

        <section class="shop-list">
          <h2>Prix par magasin</h2>
          <ShopAutocomplete  selected={Object.keys(ingredient)} onSelect$={selectShop} />
          <GroupController name="shops">
            {Object.keys(ingredient.shops).map((key) => (
              <ListController key={key} name={key}>
                <article>
                  <header>
                    <h3>{shopName.value[key]}</h3>
                    <button class="he-btn" onClick$={() => (delete ingredient.shops[+key])}>
                      Retirer le magasin
                    </button>
                  </header>
                  <PriceTable unit={ingredient.unit} />
                </article>
              </ListController>
            ))}
          </GroupController>
        </section>
        <footer>
          <button type="reset" class="he-btn">Reset</button>
          <button type="submit" class="he-btn fill primary">
            Enregistrer
          </button>
        </footer>
      </Form>
    </main>
  )
});

interface WeightTableProps {
  unit: Ingredient['unit'];
}
const WeightTable = component$<WeightTableProps>(({ unit }) => {
  const { list } = useListControl();
  if (!list.value.length) return (
    <AddControl class="he-btn primary" item={{ label: '', unit: 0 }}>
      Ajouter un type de poids
    </AddControl>
  );
  return (
    <table>
      <thead>
        <tr>
          <th id="head-label">Label</th>
          <th id="head-unit">{units[unit]}</th>
          <th>
          <AddControl class="he-btn icon tooltip primary" aria-description="Ajouter un poids" item={{ label: '', unit: 0 }}>
            <MatIcon name="add" />
          </AddControl>
          </th>
        </tr>
      </thead>
      <tbody>
        {list.value.map((_, i) => (
          <tr key={i}>
            <GroupController name={i}>
              <td>
                <Input name="label" placeholder="Cuillière à café" required aria-labelledby="head-label"/>
              </td>
              <td>
                <Input name="unit" placeholder="10" type="number" min="0" step="any" required aria-labelledby="head-unit" />
              </td>
              <td>
                <RemoveControl index={i} class="he-btn icon">
                  <MatIcon name="close" />
                </RemoveControl>
              </td>
            </GroupController>
          </tr>
        ))}
      </tbody>
    </table>
  )
})

interface Props {
  selected: string[];
  onSelect$: QRL<(id: string) => void>
}
const ShopAutocomplete = component$<Props>(({ selected, onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list } = useGetAllStore('shop');

  const items = useComputed$(() => list.value.filter(({ id }) => !selected.includes(id.toString())));

  const select = $(async (id: string) => {
    panel.value?.hidePopover();
    await onSelect$(id);
    ref.value!.value = '';
    ref.value!.focus();
  });
  
  const create = $(async () => {
    const input = ref.value!;
    const text = input.value.toLowerCase();
    if (!text) return;
    const existing = list.value.find((ingredient) => ingredient.name === text);
    if (existing) return select(existing.id);
    const id = await store('shop').add({ id: createId(), name: input.value });
    select(id);
  });

  return (
    <Autocomplete.Root>
      <Autocomplete.Input ref={ref} class="underline" placeholder="Magasin" aria-labelledby="head-shopId" />
      <button type="button" class="he-btn icon he-field-suffix" onClick$={create}>
        <MatIcon name="add" />
      </button>
      <Autocomplete.Panel ref={panel}>
        <Autocomplete.Listbox>
          {!items.value.length && <Autocomplete.Option>Il n'y pas encore de magasin</Autocomplete.Option>}
          {items.value.map(({ id, name }) => (
            <Autocomplete.Option key={id} onClick$={() => select(id)}>{name}</Autocomplete.Option>
          ))}
        </Autocomplete.Listbox>
      </Autocomplete.Panel>
    </Autocomplete.Root>
  )
});

interface PriceTableProps {
  unit: Ingredient['unit'];
}
const PriceTable = component$<PriceTableProps>(({ unit }) => {
  const { list } = useListControl();

  if (!list.value.length) return (
    <AddControl class="he-btn primary" item={{ shopId: '', price: 0, amount: 0 }}>
      Ajouter un prix
    </AddControl>
  );
  return (
    <table>
      <thead>
        <tr>
          <th id="head-price">Prix (€)</th>
          <th id="head-amount">Quantité ({ unit })</th>
          <th>
          <AddControl class="he-btn icon tooltip primary" aria-description="Ajouter un prix" item={{ shopId: '', price: 0, amount: 0 }}>
            <MatIcon name="add" />
          </AddControl>
          </th>
        </tr>
      </thead>
      <tbody>
        {list.value.map((_, i) => (
          <tr key={i}>
            <GroupController name={i}>
              <td>
                <Input name="price" placeholder="10" type="number" min="0" step="any" required aria-labelledby="head-price" />
              </td>
              <td>
                <Input name="amount" placeholder="10" type="number" min="0" step="any" required aria-labelledby="head-amount" />
              </td>
              <td>
                <RemoveControl index={i} class="he-btn icon">
                  <MatIcon name="close" />
                </RemoveControl>
              </td>
            </GroupController>
          </tr>
        ))}
      </tbody>
    </table>
  )
})