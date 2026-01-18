import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApkDownloadButton } from './ApkDownloadButton';

describe('ApkDownloadButton', () => {
  it('renders with default props', () => {
    render(<ApkDownloadButton />);

    const link = screen.getByRole('link', { name: 'Download app' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/app-release.apk');
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
});
