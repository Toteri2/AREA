import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { GoogleAuthButton } from './GoogleAuthButton';

jest.mock('../shared/src/native', () => ({
  useGoogleAuthUrlQuery: jest.fn(),
}));

jest.mock('../assets/google.svg', () => 'GoogleIcon');

const mockUseGoogleAuthUrlQuery = require('../shared/src/native')
  .useGoogleAuthUrlQuery as jest.Mock;

describe('GoogleAuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render button with default text', () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    render(<GoogleAuthButton />);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('should render custom button text', () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    render(<GoogleAuthButton buttonText='Sign in with Google' />);
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
  });

  it('should show loading indicator when loading', () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { UNSAFE_getByType } = render(<GoogleAuthButton />);
    expect(
      UNSAFE_getByType(require('react-native').ActivityIndicator)
    ).toBeTruthy();
  });

  it('should open Google auth URL when pressed', async () => {
    const mockUrl = 'https://google.com/auth';
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: { url: mockUrl },
      isLoading: false,
    });

    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined);

    const { getByText } = render(<GoogleAuthButton />);
    const button = getByText('Continue with Google');
    fireEvent.press(button);

    expect(openURLSpy).toHaveBeenCalledWith(mockUrl);
  });

  it('should call onError when URL opening fails', async () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Failed'));
    const onError = jest.fn();

    const { getByText } = render(<GoogleAuthButton onError={onError} />);
    fireEvent.press(getByText('Continue with Google'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onError).toHaveBeenCalledWith(
      'Failed to open Google authentication URL.'
    );
  });

  it('should call onError when no URL is available', async () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    const onError = jest.fn();
    const { UNSAFE_getByType } = render(<GoogleAuthButton onError={onError} />);
    const button = UNSAFE_getByType(require('react-native').TouchableOpacity);

    fireEvent.press(button);

    // Call should happen synchronously
    expect(onError).toHaveBeenCalledWith(
      'Failed to initiate Google authentication.'
    );
  });

  it('should be disabled when loading', () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { UNSAFE_getByType } = render(<GoogleAuthButton />);
    const button = UNSAFE_getByType(require('react-native').TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it('should be disabled when no data', () => {
    mockUseGoogleAuthUrlQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { UNSAFE_getByType } = render(<GoogleAuthButton />);
    const button = UNSAFE_getByType(require('react-native').TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });
});
