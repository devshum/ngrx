import { Recipe } from "../recipe.model";

export const SET_RECIPES = '[Recipes] Set Recipes';

export class SetRecipes {
  readonly type = SET_RECIPES;
  constructor(public payload: Recipe[]) {}
}

export type RecipeActions = SetRecipes;