export interface CraftyResponse<T> {
  status: 'ok';
  data: T;
}
export interface ServerStats {
  running: boolean;
  online: number;
  max: number;
}

export interface Files {
  [key: string]: FileInfo;
}

export interface FileInfo {
  path: string;
  dir: boolean;
  modified: string;
}

export interface FileData {
  content: string;
  attributes: {
    mime: string;
    modified: string;
    size: string;
    modified_epoch: number;
  };
}
