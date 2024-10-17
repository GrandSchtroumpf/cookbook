export interface Recipe {
  id: number;
  name: string;
  ingredients: {
    id: number,
    amount: number,
    label: string,
  }[];
}