import { areaWebView } from './areaWebView';
import { buttons } from './buttons';
import { card } from './card';
import { common } from './common';
import { services } from './services';

export default {
  ...card,
  ...common,
  ...buttons,
  ...areaWebView,
  ...services,
};
