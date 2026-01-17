import { StyleSheet } from 'react-native';

export const card = StyleSheet.create({
  cardsContainer: {
    gap: 16,
  },

  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1a1a2e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});
