import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigModal } from './ConfigModal';
import type { ActionNodeData, ReactionNodeData } from '../../shared/src/types';

vi.mock('./forms/GithubConfigForm', () => ({
  GithubConfigForm: () => <div>GitHub Config Form</div>,
}));

vi.mock('./forms/MicrosoftConfigForm', () => ({
  MicrosoftConfigForm: () => <div>Microsoft Config Form</div>,
}));

vi.mock('./forms/GmailConfigForm', () => ({
  GmailConfigForm: () => <div>Gmail Config Form</div>,
}));

vi.mock('./forms/DiscordConfigForm', () => ({
  DiscordConfigForm: () => <div>Discord Config Form</div>,
}));

vi.mock('./forms/TwitchConfigForm', () => ({
  TwitchConfigForm: () => <div>Twitch Config Form</div>,
}));

vi.mock('./forms/ReactionConfigForm', () => ({
  ReactionConfigForm: () => <div>Reaction Config Form</div>,
}));

describe('ConfigModal', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnDelete = vi.fn();

  const mockAvailableServices = [
    {
      name: 'github',
      actions: [
        { name: 'pull_request', description: 'Pull Request' },
      ],
      reactions: [],
    },
    {
      name: 'gmail',
      actions: [
        { name: 'new_email', description: 'New Email' },
      ],
      reactions: [
        { name: 'send_email', description: 'Send Email' },
      ],
    },
    {
      name: 'microsoft',
      actions: [
        { name: 'new_email', description: 'New Email' },
      ],
      reactions: [
        { name: 'send_email', description: 'Send Email' },
      ],
    },
    {
      name: 'discord',
      actions: [
        { name: 'new_message', description: 'New Message' },
      ],
      reactions: [
        { name: 'send_message', description: 'Send Message' },
      ],
    },
    {
      name: 'twitch',
      actions: [
        { name: 'stream_started', description: 'Stream Started' },
      ],
      reactions: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders action config modal with correct title', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Configure github Action')).toBeInTheDocument();
  });

  it('renders reaction config modal with correct title', () => {
    const reactionData: ReactionNodeData = {
      label: 'Test Reaction',
      reactionType: 'microsoft.send_email',
      reactionName: 'send_email',
      serviceName: 'microsoft',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='reaction'
        nodeData={reactionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Configure Email (Outlook)')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with updated config when Save button is clicked', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      ...actionData,
      isConfigured: true,
    });
  });

  it('calls onDelete when Delete button is clicked', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('closes modal on Escape key', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    const { container } = render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const overlay = container.querySelector('.config-modal-overlay');
    if (overlay) {
      fireEvent.keyDown(overlay, { key: 'Escape' });
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when clicking overlay', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    const { container } = render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const overlay = container.querySelector('.config-modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close modal when clicking inside modal content', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('renders GithubConfigForm for github action', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'github',
      eventType: 'pull_request',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('GitHub Config Form')).toBeInTheDocument();
  });

  it('renders MicrosoftConfigForm for microsoft action', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'microsoft',
      eventType: 'new_email',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Microsoft Config Form')).toBeInTheDocument();
  });

  it('renders GmailConfigForm for gmail action', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'gmail',
      eventType: 'new_email',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Gmail Config Form')).toBeInTheDocument();
  });

  it('renders DiscordConfigForm for discord action', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'discord',
      eventType: 'new_message',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Discord Config Form')).toBeInTheDocument();
  });

  it('renders TwitchConfigForm for twitch action', () => {
    const actionData: ActionNodeData = {
      label: 'Test Action',
      service: 'twitch',
      eventType: 'stream_started',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='action'
        nodeData={actionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Twitch Config Form')).toBeInTheDocument();
  });

  it('renders ReactionConfigForm for discord reaction', () => {
    const reactionData: ReactionNodeData = {
      label: 'Test Reaction',
      reactionType: 'discord.send_message',
      reactionName: 'send_message',
      serviceName: 'discord',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='reaction'
        nodeData={reactionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Reaction Config Form')).toBeInTheDocument();
  });

  it('renders ReactionConfigForm for gmail reaction', () => {
    const reactionData: ReactionNodeData = {
      label: 'Test Reaction',
      reactionType: 'gmail.send_email',
      reactionName: 'send_email',
      serviceName: 'gmail',
      config: {},
      isConfigured: false,
    };

    render(
      <ConfigModal
        nodeType='reaction'
        nodeData={reactionData}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
        availableServices={mockAvailableServices}
      />
    );

    expect(screen.getByText('Reaction Config Form')).toBeInTheDocument();
  });
});
