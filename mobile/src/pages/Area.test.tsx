import { render } from '@testing-library/react-native';
import { Area } from './Area';

const mockAreaWebView = jest.fn(() => null);
jest.mock('../components/AreaWebView', () => ({
  AreaWebView: (props: any) => {
    mockAreaWebView(props);
    return null;
  },
}));

jest.mock('../style/index', () => ({
  __esModule: true,
  default: {
    container: {
      flex: 1,
    },
  },
}));

describe('Area Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('must render correctly', () => {
    const { toJSON } = render(<Area />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('must render component AreaWebView with good URL', () => {
    render(<Area />);

    expect(mockAreaWebView).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://front.mambokara.dev/mobile/area',
      })
    );
  });

  it('must render one time only AreaWebView', () => {
    render(<Area />);

    expect(mockAreaWebView).toHaveBeenCalledTimes(1);
  });
});
