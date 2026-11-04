import { computed, inject, resource, Service, signal } from '@angular/core';
import { Files } from '../models/crafty';
import { GameMode, World } from '../models/world';
import { Crafty } from './crafty';
import { LevelSettings, readLevelSettings } from './level-dat';
import { getProperty, setProperty } from './server-properties';
import { WorldStore } from './world-store';

const WORLDS_FOLDER = 'worlds';

const GAME_MODES: readonly GameMode[] = ['survival', 'creative', 'adventure', 'spectator'];

/** Parses a `gamemode` value from server.properties; unknown values give undefined. */
function toGameMode(value: string | undefined): GameMode | undefined {
  return GAME_MODES.find((m) => m === value?.toLowerCase());
}

interface WorldInfo extends LevelSettings {
  name: string;
}

interface ServerData {
  worlds: WorldInfo[];
  activeLevel?: string;
  /** `gamemode` from server.properties, used for worlds set to the server default. */
  defaultMode?: GameMode;
}

@Service({ autoProvided: false })
export class CraftyWorldStore implements WorldStore {
  private crafty = inject(Crafty);

  private fileExists(name: string, files: Files) {
    return Object.keys(files).some((f) => f === name);
  }

  private readonly hasLevelDat = async (folder: string) => {
    const folderFiles = await this.crafty.listFiles(folder);
    return this.fileExists('level.dat', folderFiles.data);
  };

  /** Reads mode/difficulty from level.dat; unreadable files give empty settings. */
  private readonly readSettings = async (folder: string): Promise<LevelSettings> => {
    try {
      return await readLevelSettings(await this.crafty.downloadFile(`${folder}/level.dat`));
    } catch (error) {
      console.warn(`Could not read ${folder}/level.dat`, error);
      return { usesDefaultMode: false };
    }
  };

  /** Returns world info for a folder, or undefined if it has no level.dat. */
  private readonly loadWorld = async (name: string): Promise<WorldInfo | undefined> => {
    const folder = `${WORLDS_FOLDER}/${name}`;
    if (!(await this.hasLevelDat(folder))) {
      return undefined;
    }
    return { name, ...(await this.readSettings(folder)) };
  };

  private readonly serverData = resource({
    defaultValue: { worlds: [], activeLevel: undefined },
    loader: async (): Promise<ServerData> => {
      const worldFiles = await this.crafty.listFiles(WORLDS_FOLDER);
      const folders = Object.keys(worldFiles.data).filter(
        (f) => f !== 'root_path' && worldFiles.data[f].dir,
      );

      const [worlds, serverProps] = await Promise.all([
        Promise.all(folders.map(this.loadWorld)),
        this.crafty.readFile('server.properties'),
      ]);

      const props = serverProps.data.content;
      return {
        worlds: worlds.filter((w): w is WorldInfo => w !== undefined),
        activeLevel: getProperty(props, 'level-name'),
        defaultMode: toGameMode(getProperty(props, 'gamemode')),
      };
    },
  });

  readonly list = computed<World[]>(() => {
    if (!this.serverData.hasValue()) {
      return [];
    }
    const { worlds, activeLevel, defaultMode } = this.serverData.value();
    const running = this.crafty.isRunning();
    return worlds.map((w) => ({
      id: w.name,
      name: w.name,
      mode: w.usesDefaultMode ? defaultMode : w.mode,
      difficulty: w.difficulty,
      status:
        running && (activeLevel === w.name || activeLevel === `${WORLDS_FOLDER}/${w.name}`)
          ? 'started'
          : 'stopped',
    }));
  });

  readonly activeWorld = computed(() => this.list().find((w) => w.status === 'started'));
  readonly isLoading = this.serverData.isLoading;
  readonly errorMessage = computed(() => {
    if (this.serverData.error()) {
      return 'Failed to load data, see logs!';
    }
    return undefined;
  });
  readonly isBusy = signal(false);

  readonly isError = computed(() => {
    return this.errorMessage() !== undefined;
  });

  reload(): void {
    this.crafty.stats.reload();
    this.serverData.reload();
  }

  async startWorld(id: string): Promise<void> {
    try {
      this.isBusy.set(true);
      console.log('Start world clicked with id', id);

      const props = await this.crafty.readFile('server.properties');

      const newProps = setProperty(props.data.content, 'level-name', id);
      if (newProps === undefined) {
        console.error('Could not set new properties, no action');
        return;
      }

      const propsResult = await this.crafty.writeFile(
        'server.properties',
        newProps,
        props.data.attributes.modified_epoch,
      );
      try {
        await this.crafty.serverAction(this.crafty.isRunning() ? 'restart_server' : 'start_server');
      } catch {
        console.warn('Restart server failed, restoring level value');
        await this.crafty.writeFile(
          'server.properties',
          props.data.content!,
          propsResult.data.attributes.modified_epoch,
        );
      }

      this.reload();
    } catch (error) {
      console.error(error);
    } finally {
      this.isBusy.set(false);
    }
  }
}
