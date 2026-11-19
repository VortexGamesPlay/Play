import { applyAction, type GameAction } from '../actions';
import { createRng } from '../rng';
import { createInitialState } from '../state';
import { makeContext } from '../time';
import type { GameState } from '../types';

export const T0 = new Date(2026, 10, 19, 12, 0, 0).getTime();

export function newGame(): GameState {
  return createInitialState(T0);
}

export function run(state: GameState, action: GameAction, now = T0, seed = 42) {
  return applyAction(state, action, makeContext(now, createRng(seed)));
}
