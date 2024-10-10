export interface Recipe {
  name: string;
  ingredients: {
    id: number,
    amount: number,
    label: string,
  }[];
}