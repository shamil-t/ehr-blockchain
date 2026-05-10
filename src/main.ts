import {bootstrapApplication} from "@angular/platform-browser";
import {routes} from "./app/app.routes";
import {provideHttpClient} from "@angular/common/http";
import {AppComponent} from "./app/app.component";
import {provideRouter} from "@angular/router";

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()]
})
  .catch(err => console.error(err));
