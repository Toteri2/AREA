export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Dashboard: undefined
  Profile: undefined
  GitHub: undefined
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
