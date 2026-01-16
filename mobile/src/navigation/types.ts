export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Reactions: undefined;
  Dashboard: undefined;
  Profile: undefined;
  GitHub: undefined;
  Area: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
