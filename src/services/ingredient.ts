export interface Weight {
  label: string;
  gram: number;
}
export interface Ingredient {
  id: number;
  name: string;
  weights: Weight[];
}
