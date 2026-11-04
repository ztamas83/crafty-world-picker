export interface CraftyResponse<T> {
  status: 'ok';
  data: T;
}
export interface ServerStats {
  running: boolean;
  online: number;
  max: number;
}
