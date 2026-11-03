import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorldList } from './world-list/world-list';


@Component({
  imports: [RouterOutlet, WorldList],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Crafty World Picker');
  protected readonly serverName = signal('Test server');
  protected readonly serverId = signal(1);
  protected readonly serverStatus = signal('Running');

  protected refreshServer(): void {
    console.log('Refresh server clicked');
  }
}
