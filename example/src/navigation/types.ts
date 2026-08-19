import type { KoboAsset } from '../services/apiClient';
import type { LoadedDraft } from '../services/draftStore';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  List: undefined;
  Drafts: undefined;
  Finalized: undefined;
  Sent: undefined;
  Viewer: { asset: KoboAsset; draft?: LoadedDraft };
};
