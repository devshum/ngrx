import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Actions, Effect, ofType } from "@ngrx/effects";
import * as RecipeActions from './recipe.actions';
import { Recipe } from '../recipe.model';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';  

@Injectable()
export class RecipesEffects {
  @Effect()
  fetchRecipes = this.actions$.pipe(
    ofType(RecipeActions.FETCH_RECIPES),
    switchMap(() => {
      return this._http
      .get<Recipe[]>(
        'https://recipe-book-1b231-default-rtdb.europe-west1.firebasedatabase.app/recipes.json'
      )
    }),
    map(recipes => {
      return recipes.map(recipe => {
        return {
          ...recipe,
          ingredients: recipe.ingredients ? recipe.ingredients : []
        };
      });
    }),
    map(recipes => {
      return new RecipeActions.SetRecipes(recipes)
    })
  )

  @Effect({ dispatch: false })
  storeRecipes = this.actions$.pipe(
    ofType(RecipeActions.STORE_RECIPES),
    withLatestFrom(this.store.select('recipes')),
    switchMap(([actionData, recipesState]) => {
      return this._http
      .put(
        'https://recipe-book-1b231-default-rtdb.europe-west1.firebasedatabase.app/recipes.json',
         recipesState.recipes
      )
    })
  )

  constructor(
    private actions$: Actions,
    private _http: HttpClient,
    private store: Store<fromApp.AppState>
  ) {}
}