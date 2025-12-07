import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useCreateMicrosoftSubscriptionMutation,
  useDeleteMicrosoftSubscriptionMutation,
  useListMicrosoftWebhooksQuery,
} from '../shared/src/native';

function CreateSubscriptionForm({ onClose }: { onClose: () => void }) {
  const [resource, setResource] = useState('me/mailFolders/inbox/messages');
  const [changeType, setChangeType] = useState('created');
  const [createSubscription, { isLoading }] =
    useCreateMicrosoftSubscriptionMutation();

  const handleCreate = async () => {
    try {
      await createSubscription({ resource, changeType }).unwrap();
      Alert.alert('Success', 'Subscription created successfully!');
      onClose();
    } catch (_err) {
      Alert.alert('Error', 'Failed to create subscription.');
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>New Subscription</Text>
      <Text style={styles.label}>Resource</Text>
      <Picker
        selectedValue={resource}
        onValueChange={(itemValue) => setResource(itemValue)}
        style={styles.picker}
      >
        <Picker.Item
          label='Inbox Messages'
          value='me/mailFolders/inbox/messages'
        />
        <Picker.Item label='All Messages' value='me/messages' />
        <Picker.Item label='Calendar Events' value='me/events' />
        <Picker.Item label='Contacts' value='me/contacts' />
      </Picker>
      <Text style={styles.label}>Change Type</Text>
      <Picker
        selectedValue={changeType}
        onValueChange={(itemValue) => setChangeType(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label='Created' value='created' />
        <Picker.Item label='Updated' value='updated' />
        <Picker.Item label='Deleted' value='deleted' />
      </Picker>
      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function Microsoft() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    data: subscriptions,
    isLoading,
    isError,
  } = useListMicrosoftWebhooksQuery();
  const [deleteSubscription, { isLoading: isDeleting }] =
    useDeleteMicrosoftSubscriptionMutation();

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubscription({ id }).unwrap();
            } catch (_err) {
              Alert.alert('Error', 'Failed to delete subscription.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {!showCreateForm && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.buttonText}>Create Subscription</Text>
        </TouchableOpacity>
      )}
      {showCreateForm && (
        <CreateSubscriptionForm onClose={() => setShowCreateForm(false)} />
      )}

      {isLoading && <ActivityIndicator color='#e94560' />}
      {isError && (
        <Text style={styles.errorText}>
          Failed to load subscriptions. Is your Microsoft account linked?
        </Text>
      )}

      {subscriptions?.map((sub) => (
        <View key={sub.id} style={styles.card}>
          <Text style={styles.cardText}>Resource: {sub.resource}</Text>
          <Text style={styles.cardText}>Changes: {sub.changeType}</Text>
          <Text style={styles.cardText}>
            Expires: {new Date(sub.expirationDateTime).toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(sub.id)}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 10 },
  form: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: { color: '#fff', marginTop: 10 },
  picker: { backgroundColor: '#0f3460', color: '#fff', borderRadius: 8 },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#e94560',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#888',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#fff', fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center', margin: 10 },
  card: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardText: { color: '#fff', marginBottom: 5 },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
});
