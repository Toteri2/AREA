import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useCreateReactionMutation,
  useDeleteReactionMutation,
  useListReactionsQuery,
  useListUserWebhooksQuery,
} from '../shared/src/native';
import type { Webhook } from '../shared/src/types';

const REACTION_TYPES = [
  {
    value: 1,
    label: 'Email Notification',
    requiresConfig: ['to', 'subject', 'body'],
  },
  {
    value: 2,
    label: 'Slack Message',
    requiresConfig: ['webhookUrl', 'message'],
  },
  {
    value: 3,
    label: 'Discord Webhook',
    requiresConfig: ['webhookUrl', 'message'],
  },
  { value: 4, label: 'HTTP POST', requiresConfig: ['url', 'body'] },
];

export function Reactions() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedHookId, setSelectedHookId] = useState<number | ''>('');
  const [selectedReactionType, setSelectedReactionType] = useState<number | ''>(
    ''
  );
  const [configFields, setConfigFields] = useState<Record<string, string>>({
    to: '',
    subject: '',
    body: '',
  });

  const { data: webhooks = [], isLoading: isLoadingWebhooks } =
    useListUserWebhooksQuery();
  const { data: reactions = [], isLoading: isLoadingReactions } =
    useListReactionsQuery();
  const [createReaction, { isLoading: isCreatingReaction }] =
    useCreateReactionMutation();
  const [deleteReaction] = useDeleteReactionMutation();

  const handleCreateReaction = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedHookId || !selectedReactionType) {
      setErrorMessage('Please select a webhook and reaction type');
      return;
    }

    try {
      await createReaction({
        hookId: selectedHookId as number,
        reactionType: selectedReactionType as number,
        config: configFields,
      }).unwrap();

      setSuccessMessage('Reaction created successfully!');
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'Failed to create reaction';
      setErrorMessage(message);
      console.error('Failed to create reaction:', err);
    }
  };

  const handleDeleteReaction = async (id: number) => {
    Alert.alert(
      'Delete Reaction',
      'Are you sure you want to delete this reaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setErrorMessage('');
            setSuccessMessage('');

            try {
              await deleteReaction(id).unwrap();
              setSuccessMessage('Reaction deleted successfully!');
            } catch (err) {
              const apiError = err as { data?: { message: string } };
              const message =
                apiError.data?.message || 'Failed to delete reaction';
              setErrorMessage(message);
              console.error('Failed to delete reaction:', err);
            }
          },
        },
      ]
    );
  };

  const handleReactionTypeChange = (typeValue: number | '') => {
    setSelectedReactionType(typeValue);

    if (typeValue === '') {
      setConfigFields({});
      return;
    }

    const type = REACTION_TYPES.find((t) => t.value === typeValue);

    if (type) {
      const newConfig: Record<string, string> = {};
      type.requiresConfig.forEach((field) => {
        newConfig[field] = '';
      });
      setConfigFields(newConfig);
    }
  };

  const resetForm = () => {
    setSelectedHookId('');
    setSelectedReactionType('');
    setConfigFields({});
  };

  const getReactionTypeName = (typeValue: number) => {
    return (
      REACTION_TYPES.find((t) => t.value === typeValue)?.label || 'Unknown'
    );
  };

  const getWebhookDisplayName = (
    webhook: Pick<Webhook, 'id' | 'name' | 'config'>
  ) => {
    if (webhook.config?.url) {
      return `Webhook #${webhook.id} - ${webhook.config.url}`;
    }
    if (webhook.name) {
      return `Webhook #${webhook.id} - ${webhook.name}`;
    }
    return `Webhook #${webhook.id}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Reactions</Text>
          <Text style={styles.subtitle}>
            Configure automated reactions to webhook events
          </Text>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Text style={styles.buttonText}>
            {showCreateForm ? 'Cancel' : 'Create Reaction'}
          </Text>
        </TouchableOpacity>

        {showCreateForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Reaction</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Webhook</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedHookId}
                  onValueChange={(value) =>
                    setSelectedHookId(value === '' ? '' : Number(value))
                  }
                  enabled={!isLoadingWebhooks && webhooks.length > 0}
                  style={styles.picker}
                >
                  <Picker.Item
                    label={
                      isLoadingWebhooks
                        ? 'Loading webhooks...'
                        : webhooks.length > 0
                          ? '-- Select a webhook --'
                          : 'No webhooks available'
                    }
                    value=''
                  />
                  {webhooks.map((webhook) => (
                    <Picker.Item
                      key={webhook.id}
                      label={getWebhookDisplayName(webhook)}
                      value={webhook.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reaction Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedReactionType}
                  onValueChange={(value) =>
                    handleReactionTypeChange(value === '' ? '' : Number(value))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label='-- Select a reaction type --' value='' />
                  {REACTION_TYPES.map((type) => (
                    <Picker.Item
                      key={type.value}
                      label={type.label}
                      value={type.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedReactionType === 1 && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>To (Email)</Text>
                  <TextInput
                    style={styles.input}
                    value={configFields.to || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, to: text })
                    }
                    placeholder='user@example.com'
                    placeholderTextColor='#888'
                    keyboardType='email-address'
                    autoCapitalize='none'
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    value={configFields.subject || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, subject: text })
                    }
                    placeholder='New issue on {{repo}}'
                    placeholderTextColor='#888'
                  />
                  <Text style={styles.helperText}>
                    You can use placeholders like {'{{repo}}'}, {'{{event}}'}
                  </Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Body</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={configFields.body || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, body: text })
                    }
                    placeholder='New issue created!'
                    placeholderTextColor='#888'
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {(selectedReactionType === 2 || selectedReactionType === 3) && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Webhook URL</Text>
                  <TextInput
                    style={styles.input}
                    value={configFields.webhookUrl || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, webhookUrl: text })
                    }
                    placeholder='https://hooks.slack.com/services/...'
                    placeholderTextColor='#888'
                    autoCapitalize='none'
                    keyboardType='url'
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={configFields.message || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, message: text })
                    }
                    placeholder='New event received!'
                    placeholderTextColor='#888'
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {selectedReactionType === 4 && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>URL</Text>
                  <TextInput
                    style={styles.input}
                    value={configFields.url || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, url: text })
                    }
                    placeholder='https://api.example.com/endpoint'
                    placeholderTextColor='#888'
                    autoCapitalize='none'
                    keyboardType='url'
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Body (JSON)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={configFields.body || ''}
                    onChangeText={(text) =>
                      setConfigFields({ ...configFields, body: text })
                    }
                    placeholder='{"key": "value"}'
                    placeholderTextColor='#888'
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                isCreatingReaction && styles.buttonDisabled,
              ]}
              onPress={handleCreateReaction}
              disabled={isCreatingReaction}
            >
              {isCreatingReaction ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.buttonText}>Create Reaction</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setShowCreateForm(false);
                resetForm();
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Your Reactions</Text>

          {isLoadingReactions && reactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size='large' color='#e94560' />
              <Text style={styles.emptyText}>Loading reactions...</Text>
            </View>
          ) : reactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reactions configured</Text>
            </View>
          ) : (
            reactions.map((reaction) => (
              <View key={reaction.id} style={styles.reactionCard}>
                <View style={styles.reactionHeader}>
                  <Text style={styles.reactionTitle}>
                    Reaction #{reaction.id}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {getReactionTypeName(reaction.reactionType)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.webhookId}>
                  Webhook ID: {reaction.hookId}
                </Text>

                <View style={styles.configContainer}>
                  {Object.entries(reaction.config).map(([key, value]) => (
                    <View key={key} style={styles.configItem}>
                      <Text style={styles.configKey}>{key}:</Text>
                      <Text style={styles.configValue}>
                        {String(value).substring(0, 50)}
                        {String(value).length > 50 && '...'}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReaction(reaction.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
  },
  successText: {
    color: '#51cf66',
    textAlign: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(81, 207, 102, 0.1)',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
  },
  listSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  reactionCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#51cf66',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  webhookId: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  configContainer: {
    marginBottom: 12,
  },
  configItem: {
    marginBottom: 6,
  },
  configKey: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: '600',
  },
  configValue: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
});
