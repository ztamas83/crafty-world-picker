import { Pipe, PipeTransform } from '@angular/core';
import { World } from './models/world';

@Pipe({
  name: 'worldSummary',
})
export class WorldSummaryPipe implements PipeTransform {
  transform(w: World | undefined): string {
    if (w === undefined) { return ""; }
    return `${w.name} · ${w.mode} · ${w.difficulty}`;
  }
}
