import * as migration_20261118_205317_initial from './20261118_205317_initial';

export const migrations = [
  {
    up: migration_20261118_205317_initial.up,
    down: migration_20261118_205317_initial.down,
    name: '20261118_205317_initial'
  },
];
