import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Discord } from './Discord';

vi.mock('../shared/src/web', () => ({
  useListRepositoriesQuery: vi.fn(),
  useListWebhooksQuery: vi.fn(),
  useCreateWebhookMutation: vi.fn(),
}));

import {
  useCreateWebhookMutation,
  useListRepositoriesQuery,
  useListWebhooksQuery,
} from '../shared/src/web';

describe('Discord', () => {
  const mockCreateWebhook = vi.fn();

  const mockRepositories = [
    {
      id: 1,
      name: 'repo1',
      full_name: 'user1/repo1',
      owner: { login: 'user1' },
      description: 'Test repo 1',
      private: false,
    },
    {
      id: 2,
      name: 'repo2',
      full_name: 'user2/repo2',
      owner: { login: 'user2' },
      description: 'Test repo 2',
      private: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useListRepositoriesQuery as unknown as Mock).mockReturnValue({
      data: mockRepositories,
      isLoading: false,
      error: null,
    });

    (useListWebhooksQuery as unknown as Mock).mockReturnValue({
      data: [],
    });

    (useCreateWebhookMutation as unknown as Mock).mockReturnValue([
      mockCreateWebhook,
      { isLoading: false },
    ]);
  });

  it('shows loading state', () => {
    (useListRepositoriesQuery as unknown as Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<Discord />);

    expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
  });

  it('shows error when repositories fail to load', () => {
    (useListRepositoriesQuery as unknown as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'Failed to load' },
    });

    render(<Discord />);

    expect(
      screen.getByText(
        'Failed to load repositories. Make sure your Discord account is linked.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Please link your Discord account from your profile page.'
      )
    ).toBeInTheDocument();
  });

  it('renders discord integration page', () => {
    render(<Discord />);

    expect(screen.getByText('Discord Integration')).toBeInTheDocument();
    expect(screen.getByText('Your Repositories')).toBeInTheDocument();
  });

  it('displays repositories list', () => {
    render(<Discord />);

    expect(screen.getByText('user1/repo1')).toBeInTheDocument();
    expect(screen.getByText('user2/repo2')).toBeInTheDocument();
  });

  it('selects repository when clicked', () => {
    render(<Discord />);

    const repoButton = screen.getByText('user1/repo1').closest('button');
    expect(repoButton).not.toHaveClass('selected');

    fireEvent.click(repoButton!);

    expect(repoButton).toHaveClass('selected');
  });

  it('shows create webhook form when button is clicked', () => {
    render(<Discord />);

    const repoButton = screen.getByText('user1/repo1').closest('button');
    fireEvent.click(repoButton!);

    const createButton = screen.getByText('Create Webhook');
    fireEvent.click(createButton);

    expect(screen.getByLabelText('Payload URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Secret (optional)')).toBeInTheDocument();
  });

  it('creates webhook with form data', async () => {
    mockCreateWebhook.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(<Discord />);

    const repoButton = screen.getByText('user1/repo1').closest('button');
    fireEvent.click(repoButton!);

    fireEvent.click(screen.getByText('Create Webhook'));

    const urlInput = screen.getByLabelText('Payload URL');
    const secretInput = screen.getByLabelText('Secret (optional)');

    fireEvent.change(urlInput, {
      target: { value: 'https://discord.com/webhook/123' },
    });
    fireEvent.change(secretInput, { target: { value: 'my-secret' } });

    const submitButton = screen.getByRole('button', {
      name: 'Create',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateWebhook).toHaveBeenCalledWith({
        owner: 'user1',
        repo: 'repo1',
        webhookUrl: 'https://discord.com/webhook/123',
        events: ['push'],
        secret: 'my-secret',
      });
    });
  });

  it('shows error message when webhook creation fails', async () => {
    mockCreateWebhook.mockReturnValue({
      unwrap: vi
        .fn()
        .mockRejectedValue({ data: { message: 'Webhook creation failed' } }),
    });

    render(<Discord />);

    fireEvent.click(screen.getByText('user1/repo1').closest('button')!);
    fireEvent.click(screen.getByText('Create Webhook'));

    fireEvent.change(screen.getByLabelText('Payload URL'), {
      target: { value: 'https://discord.com/webhook/123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Webhook creation failed')).toBeInTheDocument();
    });
  });

  it('toggles event selection', () => {
    render(<Discord />);

    fireEvent.click(screen.getByText('user1/repo1').closest('button')!);
    fireEvent.click(screen.getByText('Create Webhook'));

    const pushCheckbox = screen.getByRole('checkbox', { name: /push/i });
    expect(pushCheckbox).toBeChecked();

    fireEvent.click(pushCheckbox);
    expect(pushCheckbox).not.toBeChecked();

    fireEvent.click(pushCheckbox);
    expect(pushCheckbox).toBeChecked();
  });

  it('closes form when repository selection changes', () => {
    render(<Discord />);

    fireEvent.click(screen.getByText('user1/repo1').closest('button')!);
    fireEvent.click(screen.getByText('Create Webhook'));

    expect(screen.getByLabelText('Payload URL')).toBeInTheDocument();

    fireEvent.click(screen.getByText('user2/repo2').closest('button')!);

    expect(
      screen.queryByLabelText('Payload URL')
    ).not.toBeInTheDocument();
  });

  it('disables create button when creating webhook', () => {
    (useCreateWebhookMutation as unknown as Mock).mockReturnValue([
      mockCreateWebhook,
      { isLoading: true },
    ]);

    render(<Discord />);

    fireEvent.click(screen.getByText('user1/repo1').closest('button')!);
    fireEvent.click(screen.getByText('Create Webhook'));

    const submitButton = screen.getByRole('button', {
      name: 'Creating...',
    });
    expect(submitButton).toBeDisabled();
  });
});
