import { StyleSheet } from 'react-native';

export const card = StyleSheet.create({
  cardsContainer: {
    gap: 16,
  },

  welcomeCard: {
    backgroundColor: '#ffffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: 8,
  },

  card: {
    backgroundColor: '#ffffffff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#98b9ffff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#5c5c5cff',
  },
});
