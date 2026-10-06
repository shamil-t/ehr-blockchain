// / <reference types="@angular/localize" />

import {bootstrapApplication} from "@angular/platform-browser";
import {routes} from "./app/app.route";
import {provideHttpClient, withXhr} from "@angular/common/http";
import {AppComponent} from "./app/app.component";
import {provideRouter} from "@angular/router";

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient(withXhr())]
})
  .catch(err => console.error(err));
