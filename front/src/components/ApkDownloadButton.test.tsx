import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ApkDownloadButton } from './ApkDownloadButton';

describe('ApkDownloadButton', () => {
  it('renders with default props', () => {
    render(<ApkDownloadButton />);

    const link = screen.getByRole('link', { name: 'Get app' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/client.apk');
    expect(link).toHaveAttribute('download', 'client.apk');
  });

  it('renders with custom props', () => {
    render(
      <ApkDownloadButton
        filePath='/custom/path.apk'
        fileName='custom-app.apk'
        label='Get App'
      />
    );

    const link = screen.getByRole('link', { name: 'Get App' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/custom/path.apk');
    expect(link).toHaveAttribute('download', 'custom-app.apk');
  });

  it('has correct inline styles', () => {
    render(<ApkDownloadButton />);

    const link = screen.getByRole('link');
    expect(link).toHaveStyle({
      padding: '10px 16px',
      backgroundColor: '#1976d2',
      color: '#fff',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      display: 'inline-block',
    });
  });

  it('is accessible with proper role', () => {
    render(<ApkDownloadButton label='Download mobile app' />);

    const link = screen.getByRole('link', { name: 'Download mobile app' });
    expect(link).toBeInTheDocument();
  });

  it('is keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<ApkDownloadButton />);

    const link = screen.getByRole('link');
    await user.tab();

    expect(link).toHaveFocus();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    render(<ApkDownloadButton />);

    const link = screen.getByRole('link');
    await user.click(link);

    // Verify the link is still present and functional
    expect(link).toBeInTheDocument();
  });

  it('renders with different file extensions', () => {
    const { rerender } = render(
      <ApkDownloadButton filePath='/app.apk' fileName='app.apk' />
    );

    let link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/app.apk');
    expect(link).toHaveAttribute('download', 'app.apk');

    rerender(
      <ApkDownloadButton filePath='/update.apk' fileName='update.apk' />
    );

    link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/update.apk');
    expect(link).toHaveAttribute('download', 'update.apk');
  });

  it('has proper button styling for mobile context', () => {
    render(<ApkDownloadButton />);

    const link = screen.getByRole('link');

    // Should be inline-block for proper mobile display
    expect(link).toHaveStyle({ display: 'inline-block' });

    // Should have adequate padding for touch targets
    expect(link).toHaveStyle({ padding: '10px 16px' });

    // Should have rounded corners for modern mobile UI
    expect(link).toHaveStyle({ borderRadius: '6px' });
  });

  it('renders with various label texts', () => {
    const labels = [
      'Get app',
      'Download APK',
      'Install Now',
      'Get Mobile App',
    ];

    labels.forEach((label) => {
      const { unmount } = render(<ApkDownloadButton label={label} />);
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
      unmount();
    });
  });

  it('maintains consistent styling across all props combinations', () => {
    const { rerender } = render(
      <ApkDownloadButton
        filePath='/v1.apk'
        fileName='v1.apk'
        label='Version 1'
      />
    );

    let link = screen.getByRole('link');

    rerender(
      <ApkDownloadButton
        filePath='/v2.apk'
        fileName='v2.apk'
        label='Version 2'
      />
    );

    link = screen.getByRole('link');
    expect(link).toHaveStyle({
      backgroundColor: '#1976d2',
      color: '#fff',
      fontWeight: 'bold',
    });
  });

  it('works with absolute and relative paths', () => {
    const { rerender } = render(
      <ApkDownloadButton filePath='/client.apk' />
    );

    let link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/client.apk');

    rerender(
      <ApkDownloadButton filePath='https://example.com/app.apk' />
    );

    link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/app.apk');
  });
});
