import { StyleSheet } from 'react-native';

export const buttons = StyleSheet.create({
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  buttonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },

  logoutButton: {
    backgroundColor: '#ffffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  logoutText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
});
