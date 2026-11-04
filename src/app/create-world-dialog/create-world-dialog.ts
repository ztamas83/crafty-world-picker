import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { GAME_DIFFICULTIES, GAME_MODES, NewWorld } from '../models/world.model';
import { WorldStore } from '../services/world-store';

const DEFAULT_WORLD: NewWorld = { name: '', mode: 'creative', difficulty: 'easy' };
const NAME_MAX_LENGTH = 40;
/** Used as a folder name under worlds/, so no slashes, dots or other special characters. */
const NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

@Component({
  imports: [FormField, FormRoot],
  selector: 'app-create-world-dialog',
  styleUrl: './create-world-dialog.scss',
  templateUrl: './create-world-dialog.html',
})
export class CreateWorldDialog {
  protected readonly GAME_MODES = GAME_MODES;
  protected readonly GAME_DIFFICULTIES = GAME_DIFFICULTIES;

  private readonly store = inject(WorldStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.worldForm().reset({ ...DEFAULT_WORLD });
    this.dialog().nativeElement.showModal();
  }

  protected close(reason: string): void {
    this.dialog().nativeElement.close(reason);
  }

  private nameIsTaken(name: string): boolean {
    const wanted = name.trim().toLowerCase();
    return this.store.list().some((w) => w.name.toLowerCase() === wanted);
  }

  private readonly newWorld = signal<NewWorld>({ ...DEFAULT_WORLD });

  // Declared last: the schema and the submit action use `store` and `close` above.
  protected readonly worldForm = form(
    this.newWorld,
    (w) => {
      required(w.name, { message: 'Name is required.' });
      maxLength(w.name, NAME_MAX_LENGTH, {
        message: `Name can be at most ${NAME_MAX_LENGTH} characters.`,
      });
      pattern(w.name, NAME_PATTERN, {
        message: 'Use only letters, numbers, spaces, - and _.',
      });
      validate(w.name, ({ value }) =>
        this.nameIsTaken(value())
          ? { kind: 'taken', message: 'A world with this name already exists.' }
          : undefined,
      );
    },
    {
      submission: {
        action: async (f) => {
          try {
            await this.store.createWorld(f().value());
          } catch (error) {
            console.error('Creating world failed', error);
            return {
              kind: 'server',
              message: 'Could not create the world. Check the server and try again.',
            };
          }
          this.close('created');
          return undefined;
        },
      },
    },
  );

  /** Show field errors only after the user has left the field (or tried to submit). */
  protected readonly showNameErrors = computed(
    () => this.worldForm.name().touched() && this.worldForm.name().invalid(),
  );
}
