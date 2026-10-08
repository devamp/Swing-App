import { DEFAULT_FILTERS, DEFAULT_REGION } from './model';
import type { Filters, MapRegion, Mode, PlayResult } from './types';
export type ModeState = {
  filters: Filters;
  region: MapRegion;
  searchedRegion: MapRegion;
  area: string;
  results: PlayResult[];
  status: 'loading' | 'success' | 'error';
  selectedId: string | null;
  groupIds: string[] | null;
  groupLabel: string;
};
export function initialModeState(): ModeState {
  return {
    filters: { ...DEFAULT_FILTERS },
    region: { ...DEFAULT_REGION },
    searchedRegion: { ...DEFAULT_REGION },
    area: 'Tualatin, OR',
    results: [],
    status: 'loading',
    selectedId: null,
    groupIds: null,
    groupLabel: '',
  };
}
export type DiscoveryState = Record<Mode, ModeState>;
export type DiscoveryAction = { mode: Mode; patch: Partial<ModeState> };
export function discoveryReducer(state: DiscoveryState, action: DiscoveryAction): DiscoveryState {
  return { ...state, [action.mode]: { ...state[action.mode], ...action.patch } };
}
