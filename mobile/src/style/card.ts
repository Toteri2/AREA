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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 7,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
    textAlign: 'justify',
  },

  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#666',
  },
});
