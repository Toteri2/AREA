import { render } from '@testing-library/react-native';
import { WebView } from 'react-native-webview';
import { AreaWebView } from '../components/AreaWebView';

jest.mock('react-native-webview', () => ({
  WebView: jest.fn(() => null),
}));

describe('AreaWebView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('must render with URL', () => {
    const testUrl = 'https://example.com';
    const { toJSON } = render(<AreaWebView url={testUrl} />);

    expect(toJSON()).toMatchSnapshot();
  });

  it('must give the good URL at WebView', () => {
    const testUrl = 'https://front.mambokara.dev/mobile/area';
    render(<AreaWebView url={testUrl} />);

    expect(WebView).toHaveBeenCalledWith(
      expect.objectContaining({
        source: { uri: testUrl },
      }),
      expect.anything()
    );
  });
});
