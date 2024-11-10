export interface MenuGroup {
  name: string;
  recipeIds: number[];
}

export interface Menu {
  id: number,
  name: string,
  servings: number,
  groups: MenuGroup[],
}