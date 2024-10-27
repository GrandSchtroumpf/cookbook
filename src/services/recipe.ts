export interface Recipe {
  id: number;
  name: string;
  servings: number;
  ingredients: {
    id: number,
    amount: number,
    label: string,
  }[];
}