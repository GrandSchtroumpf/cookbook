export interface Recipe {
  id: string;
  name: string;
  servings: number;
  duration: number;
  cooking: number;
  steps: string[];
  ingredients: {
    id: string,
    amount: number,
    label: string,
  }[];
}