export interface Weight {
  label: string;
  unit: number;
}

export interface Price {
  price: number;
  amount: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'ml'| 'unit';
  weights: Weight[];
  shops: { [shopId: string]: Price[]};
}
