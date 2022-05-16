import { Store } from '@ngrx/store';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';

import * as fromApp from '../../store/app.reducer';
import * as RecipeActions from '../../recipes/store/recipe.actions';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css']
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe;
  id: number;

  constructor(private recipeService: RecipeService,
              private route: ActivatedRoute,
              private router: Router,
              private store: Store<fromApp.AppState>) {
  }

  ngOnInit() {
    // this.route.params.subscribe(
    //     (params: Params) => {
    //       this.id = +params['id'];
          
    //       this.store.select('recipes').pipe(
    //         map(recipesState => recipesState.recipes.find((_, i) => i === this.id))
    //       ).subscribe(recipe => this.recipe = recipe)
    //     }
    //   );

    this.route.params.pipe(
      map((params: Params) => +params['id']),
      switchMap(id => {
        this.id = id;
        return this.store.select('recipes')
      }),
      map(recipesState => recipesState.recipes.find((_, i) => i === this.id))
    ).subscribe(recipe => this.recipe = recipe)
  }

  onAddToShoppingList() {
    this.recipeService.addIngredientsToShoppingList(this.recipe.ingredients);
  }

  onEditRecipe() {
    this.router.navigate(['edit'], {relativeTo: this.route});
    // this.router.navigate(['../', this.id, 'edit'], {relativeTo: this.route});
  }

  onDeleteRecipe() {
    // this.recipeService.deleteRecipe(this.id);
    this.store.dispatch(new RecipeActions.DeleteRecipe(this.id))
    this.router.navigate(['/recipes']);
  }

}
