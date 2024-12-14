export interface MenuGroup {
  name: string;
  recipeIds: string[];
}

export interface Menu {
  id: string;
  name: string;
  servings: number;
  groups: MenuGroup[];
}