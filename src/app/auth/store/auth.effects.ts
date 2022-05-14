import { AuthService } from './../auth.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofType, Effect } from '@ngrx/effects';
import { switchMap, catchError, map, tap, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import * as AuthActions from './auth.actions';
import { User } from '../user.model';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

const handleAuthentication = (
    email: string,
    userId: string,
    token: string,
    expiresIn: number
  ) => {
  const expirationDate = new Date(
    new Date().getTime() + expiresIn * 1000
  );

  const user = new User(email, userId, token, expirationDate);
  localStorage.setItem('userData', JSON.stringify(user));

  return new AuthActions.AuthenticateSuccess({
    email: email,
    userId: userId,
    token: token,
    expirationDate: expirationDate,
    redirect: true
  });
}

const handleError = errorRes => {
  let errorMessage = 'An unknown error occurred!';
  if (!errorRes.error || !errorRes.error.error) {
    return of(new AuthActions.AuthenticateFail(errorMessage));
  }
  switch (errorRes.error.error.message) {
    case 'EMAIL_EXISTS':
      errorMessage = 'This email exists already';
      break;
    case 'EMAIL_NOT_FOUND':
      errorMessage = 'This email does not exist.';
      break;
    case 'INVALID_PASSWORD':
      errorMessage = 'This password is not correct.';
      break;
  }
  return of(new AuthActions.AuthenticateFail(errorMessage));
}

@Injectable()
export class AuthEffects {

  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START),
    switchMap((signupAction: AuthActions.SignupStart) => {
      return this.http
      .post<AuthResponseData>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey,
        {
          email: signupAction.payload.email,
          password: signupAction.payload.password,
          returnSecureToken: true
        }
      )
      .pipe(
        tap(resData => {
          this.authService.setLogoutTimer(+resData.expiresIn * 1000)
        }),
        map(resData => {
          return handleAuthentication(
            resData.email, 
            resData.localId, 
            resData.idToken, 
            +resData.expiresIn
         )
        }),
        catchError((errorRes: any) => {
          return handleError(errorRes)
        })
      );
    })
  ) 

  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((loginAction: AuthActions.LoginStart) => {
      return this.http
        .post<AuthResponseData>(
          'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' + environment.firebaseAPIKey,
          {
            email: loginAction.payload.email,
            password: loginAction.payload.password,
            returnSecureToken: true
          }
        )
        .pipe(
          tap(resData => {
            this.authService.setLogoutTimer(+resData.expiresIn * 1000)
          }),
          map(resData => {
            return handleAuthentication(
              resData.email, 
              resData.localId, 
              resData.idToken, 
              +resData.expiresIn
           )
          }),
          catchError((errorRes: any) => {
            return handleError(errorRes)
          })
        );
    })
  );

  @Effect({ dispatch: false }) 
  authLogout = this.actions$.pipe(
    ofType(AuthActions.LOGOUT), tap(() => {
      this.authService.clearLogoutTimer();
      this.router.navigate(['/auth']);
      localStorage.removeItem('userData');
    })
  );

  @Effect()
  autoLogin = this.actions$.pipe(
    ofType(AuthActions.AUTO_LOGIN),
    map(() => {
      const userData: {
        email: string;
        id: string;
        _token: string;
        _tokenExpirationDate: string;
      } = JSON.parse(localStorage.getItem('userData'));

      if (userData) {
        const loadedUser = new User(
          userData.email,
          userData.id,
          userData._token,
          new Date(userData._tokenExpirationDate)
        );

         const expirationDuration =
            new Date(userData._tokenExpirationDate).getTime() -
            new Date().getTime();

        if (loadedUser.token) {
          this.authService.setLogoutTimer(expirationDuration)
          return new AuthActions.AuthenticateSuccess({
              email: loadedUser.email, 
              userId: loadedUser.id, 
              token: loadedUser.token,
              expirationDate: new Date(userData._tokenExpirationDate),
              redirect: false
            })
          
    
         
        }
      }
  
     
    }),
    filter(Boolean)
  )

  @Effect({ dispatch: false })
  authRedirect = this.actions$.pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS),
    tap((authSuccessAction: AuthActions.AuthenticateSuccess) => {
      if(authSuccessAction.payload.redirect) {
        this.router.navigate(['/']);
      }
    })
  );

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}
}
