export interface Weight {
  label: string;
  gram: number;
}

export interface Price {
  price: number;
  weight: number;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: 'g' | 'ml';
  weights: Weight[];
  shops: { [shopId: number]: Price[]};
}
