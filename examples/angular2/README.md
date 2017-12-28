# Usage with Angular 2 & TypeScript

Create `error_handler.ts`:

```TypeScript
import { ErrorHandler } from '@angular/core';
import BlunderClient from 'blunder-js';

export class BlunderErrorHandler implements ErrorHandler {
  blunder: BlunderClient;

  constructor() {
    this.blunder = new BlunderClient({
      projectId: 1,
      projectKey: 'FIXME',
      component: 'Angular'
    });
  }

  handleError(error: any): void {
    this.blunder.notify(error);
  }
}
```

Add `ErrorHandler` provider to your `AppModule`:

```TypeScript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';

import { AppComponent } from './app.component';
import { BlunderErrorHandler } from './error_handler';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{provide: ErrorHandler, useClass: BlunderErrorHandler}],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
