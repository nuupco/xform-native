import type { KoboAsset } from '../services/apiClient';
import type { LoadedDraft } from '../screens/FormViewerScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  List: undefined;
  Drafts: undefined;
  Finalized: undefined;
  Sent: undefined;
  Viewer: { asset: KoboAsset; draft?: LoadedDraft };
};
