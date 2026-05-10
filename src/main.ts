import {provideZoneChangeDetection} from "@angular/core";

import {AppModule} from './app/app.module';
import {platformBrowser} from "@angular/platform-browser";

platformBrowser().bootstrapModule(AppModule, {applicationProviders: [provideZoneChangeDetection()],})
  .catch(err => console.error(err));
