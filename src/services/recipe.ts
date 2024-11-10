export interface Recipe {
  id: number;
  name: string;
  servings: number;
  duration: number;
  cooking: number;
  steps: string[];
  ingredients: {
    id: number,
    amount: number,
    label: string,
  }[];
}