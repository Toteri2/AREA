import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CreateWebhookDto, Repository } from '../shared/src';
import {
  useCreateWebhookMutation,
  useListRepositoriesQuery,
  useListWebhooksQuery,
} from '../shared/src/native';

export function GitHub() {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['push']);
  const [webhookSecret, setWebhookSecret] = useState('');

  const {
    data: repositories = [],
    isLoading: isLoadingRepos,
    error: reposError,
  } = useListRepositoriesQuery();

  const { data: webhooks = [] } = useListWebhooksQuery(
    {
      owner: selectedRepo?.owner.login || '',
      repo: selectedRepo?.name || '',
    },
    {
      skip: !selectedRepo,
    }
  );

  const [createWebhook, { isLoading: isCreatingWebhook }] =
    useCreateWebhookMutation();

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
    setShowCreateForm(false);
  };

  const handleCreateWebhook = async () => {
    if (!selectedRepo || !webhookUrl) return;

    try {
      const dto: CreateWebhookDto = {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        webhookUrl,
        events: webhookEvents,
        secret: webhookSecret || undefined,
      };
      await createWebhook(dto).unwrap();
      setShowCreateForm(false);
      setWebhookUrl('');
      setWebhookSecret('');
      setWebhookEvents(['push']);
    } catch (err) {
      console.error('Failed to create webhook:', err);
    }
  };

  const availableEvents = [
    'push',
    'pull_request',
    'issues',
    'create',
    'delete',
    'release',
  ];

  const toggleEvent = (event: string) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (isLoadingRepos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#e94560' />
        <Text style={styles.loadingText}>Loading repositories...</Text>
      </View>
    );
  }

  if (reposError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>GitHub Integration</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load repositories. Make sure your GitHub account is
            linked.
          </Text>
          <Text style={styles.errorHint}>
            Please link your GitHub account from your profile page.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>GitHub Integration</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Repositories</Text>
        <View style={styles.repoList}>
          {repositories.map((repo) => (
            <TouchableOpacity
              key={repo.id}
              style={[
                styles.repoItem,
                selectedRepo?.id === repo.id && styles.repoItemSelected,
              ]}
              onPress={() => handleSelectRepo(repo)}
            >
              <Text style={styles.repoName}>{repo.full_name}</Text>
              {repo.private && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Private</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedRepo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Webhooks for {selectedRepo.full_name}
          </Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateForm(!showCreateForm)}
          >
            <Text style={styles.createButtonText}>
              {showCreateForm ? 'Cancel' : 'Create Webhook'}
            </Text>
          </TouchableOpacity>

          {showCreateForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Create New Webhook</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Payload URL</Text>
                <TextInput
                  style={styles.input}
                  value={webhookUrl}
                  onChangeText={setWebhookUrl}
                  placeholder='https://example.com/webhook'
                  placeholderTextColor='#888'
                  autoCapitalize='none'
                  keyboardType='url'
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Secret (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={webhookSecret}
                  onChangeText={setWebhookSecret}
                  placeholder='Webhook secret'
                  placeholderTextColor='#888'
                  autoCapitalize='none'
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Events</Text>
                <View style={styles.eventsContainer}>
                  {availableEvents.map((event) => (
                    <TouchableOpacity
                      key={event}
                      style={[
                        styles.eventChip,
                        webhookEvents.includes(event) &&
                          styles.eventChipSelected,
                      ]}
                      onPress={() => toggleEvent(event)}
                    >
                      <Text
                        style={[
                          styles.eventChipText,
                          webhookEvents.includes(event) &&
                            styles.eventChipTextSelected,
                        ]}
                      >
                        {event}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isCreatingWebhook && styles.buttonDisabled,
                ]}
                onPress={handleCreateWebhook}
                disabled={isCreatingWebhook}
              >
                {isCreatingWebhook ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Text style={styles.submitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.webhookList}>
            {webhooks.length === 0 ? (
              <Text style={styles.noWebhooks}>No webhooks configured</Text>
            ) : (
              webhooks.map((webhook) => (
                <View key={webhook.id} style={styles.webhookItem}>
                  <View style={styles.webhookHeader}>
                    <Text style={styles.webhookUrl} numberOfLines={1}>
                      {webhook.config.url}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        webhook.active
                          ? styles.statusActive
                          : styles.statusInactive,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.webhookEvents}>
                    {webhook.events.map((event) => (
                      <View key={event} style={styles.eventTag}>
                        <Text style={styles.eventTagText}>{event}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 20,
    borderRadius: 12,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 8,
  },
  errorHint: {
    color: '#888',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  repoList: {
    gap: 8,
  },
  repoItem: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repoItemSelected: {
    borderWidth: 2,
    borderColor: '#e94560',
  },
  repoName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  badge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: '#888',
    fontSize: 12,
  },
  createButton: {
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#e0e0e0',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventChip: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  eventChipSelected: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  eventChipText: {
    color: '#888',
    fontSize: 14,
  },
  eventChipTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webhookList: {
    gap: 12,
  },
  noWebhooks: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  webhookItem: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 8,
  },
  webhookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  webhookUrl: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
  },
  webhookEvents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  eventTag: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventTagText: {
    color: '#888',
    fontSize: 12,
  },
});
