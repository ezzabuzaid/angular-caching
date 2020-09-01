import { Component } from '@angular/core';
import { ExampleService } from './example.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Caching';

  constructor(
    private exampleService: ExampleService
  ) { }

}
