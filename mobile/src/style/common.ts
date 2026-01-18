import { StyleSheet } from 'react-native';

export const common = StyleSheet.create({
  // App & Header
  headerApp: {
    backgroundColor: '#1a1a2e',
  },
  contentApp: {
    backgroundColor: '#e9e9e9',
  },
  headerTitleApp: {
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Text
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  label: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#000000',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#000',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,

    elevation: 4,
  },

  link: {
    color: '#1a1a2e',
    fontWeight: '500',
  },

  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
  },
});
