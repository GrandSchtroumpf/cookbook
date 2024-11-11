import type { QRL } from "@builder.io/qwik";
import { $, component$, useStore, unwrapStore, useStyles$, useSignal, useComputed$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { AddControl, Autocomplete, Form, FormField, GroupController, Input, Label, ListController, MatIcon, Option, RemoveControl, Select, useListControl } from 'qwik-hueeye';
import { store, useGetAllStore } from "~/services/db";
import type { Ingredient } from "~/services/ingredient";
import style from './index.css?inline';

type CreateIngredient = Omit<Ingredient, 'id'>;

const units = {
  g: 'Gramme',
  ml: 'Millilitre',
  unit: 'Unité'
}

export default component$(() => {
  useStyles$(style);
  const navigate = useNavigate();
  const ingredient = useStore<CreateIngredient>({
    name: '',
    unit: 'g',
    weights: [],
    shops: {},
  });
  const { list: shops } = useGetAllStore('shop');

  const shopName = useComputed$(() => Object.fromEntries(shops.value.map((s) => [s.id, s.name])));

  const create = $(async () => {
    await store('ingredient').add(unwrapStore(ingredient));
    navigate('/');
  });

  const selectShop = $((shopId: number) => ingredient.shops[shopId] = [{ price: 0, amount: 0 }]);

  return (
    <Form id="create-ingredient" bind:value={ingredient} onSubmit$={create}>
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
          Ajouter l'ingredient
        </button>
      </footer>
    </Form>
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
                <Input name="unit" placeholder="10" type="number" min="0" required aria-labelledby="head-unit" />
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
  onSelect$: QRL<(id: number) => void>
}
const ShopAutocomplete = component$<Props>(({ selected, onSelect$ }) => {
  const ref = useSignal<HTMLInputElement>();
  const panel = useSignal<HTMLDivElement>();
  const { list } = useGetAllStore('shop');

  const items = useComputed$(() => list.value.filter(({ id }) => !selected.includes(id.toString())));

  const select = $(async (id: number) => {
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
    const id = await store('shop').add({ name: input.value });
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
                <Input name="price" placeholder="10" type="number" min="0" required aria-labelledby="head-price" />
              </td>
              <td>
                <Input name="amount" placeholder="10" type="number" min="0" required aria-labelledby="head-amount" />
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