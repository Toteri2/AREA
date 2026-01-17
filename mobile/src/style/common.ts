import { StyleSheet } from 'react-native';

export const common = StyleSheet.create({
  headerApp: {
    backgroundColor: '#1a1a2e',
  },
  contentApp: {
    backgroundColor: '#F5F5F5',
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

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1a1a2e',
//   },

// });

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1a1a2e',
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   card: {
//     backgroundColor: '#16213e',
//     borderRadius: 12,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   errorText: {
//     color: '#ff6b6b',
//     textAlign: 'center',
//     marginBottom: 16,
//     padding: 10,
//     backgroundColor: 'rgba(255, 107, 107, 0.1)',
//     borderRadius: 8,
//   },
//   formGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     color: '#e0e0e0',
//     marginBottom: 8,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   input: {
//     backgroundColor: '#0f3460',
//     borderRadius: 8,
//     padding: 14,
//     color: '#fff',
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#1a1a2e',
//   },
//   button: {
//     backgroundColor: '#e94560',
//     borderRadius: 8,
//     padding: 16,
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 20,
//   },
//   linkText: {
//     color: '#888',
//   },
//   link: {
//     color: '#e94560',
//     fontWeight: '500',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#ccc',
//   },
//   dividerText: {
//     marginHorizontal: 10,
//     fontSize: 14,
//     color: '#666',
//   },
// });

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1a1a2e',
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   card: {
//     backgroundColor: '#16213e',
//     borderRadius: 12,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   errorText: {
//     color: '#ff6b6b',
//     textAlign: 'center',
//     marginBottom: 16,
//     padding: 10,
//     backgroundColor: 'rgba(255, 107, 107, 0.1)',
//     borderRadius: 8,
//   },
//   formGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     color: '#e0e0e0',
//     marginBottom: 8,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   input: {
//     backgroundColor: '#0f3460',
//     borderRadius: 8,
//     padding: 14,
//     color: '#fff',
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#1a1a2e',
//   },
//   eyeButton: {
//     position: 'absolute',
//     right: 12,
//     top: '50%',
//     transform: [{ translateY: -10 }],
//     padding: 4,
//   },
//   button: {
//     backgroundColor: '#e94560',
//     borderRadius: 8,
//     padding: 16,
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 20,
//   },
//   linkText: {
//     color: '#888',
//   },
//   link: {
//     color: '#e94560',
//     fontWeight: '500',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#ccc',
//   },
//   dividerText: {
//     marginHorizontal: 10,
//     fontSize: 14,
//     color: '#666',
//   },
// });

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#1a1a2e' },
//   content: { padding: 20 },
//   title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
//   card: { backgroundColor: '#16213e', borderRadius: 12, padding: 20 },

//   actionsSection: { paddingTop: 8 },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 16,
//   },
//   baseUrlSection: { marginBottom: 24 },
//   input: {
//     backgroundColor: '#1a1a2e',
//     borderColor: '#0f3460',
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     color: '#fff',
//     marginBottom: 10,
//   },
//   button: {
//     backgroundColor: '#24292e',
//     borderRadius: 8,
//     padding: 16,
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   linkedContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#16213e',
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 10,
//   },
//   linkedText: { color: '#28a745', fontSize: 16, fontWeight: '600' },
//   changeButton: {
//     backgroundColor: '#0f3460',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   changeButtonText: { color: '#fff', fontSize: 14 },
// });

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1a1a2e',
//   },
//   content: {
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 24,
//   },
//   welcomeCard: {
//     backgroundColor: '#16213e',
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 24,
//   },
//   welcomeTitle: {
//     fontSize: 22,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   welcomeEmail: {
//     fontSize: 14,
//     color: '#888',
//   },
//   cardsContainer: {
//     gap: 16,
//   },
//   card: {
//     backgroundColor: '#16213e',
//     borderRadius: 12,
//     padding: 20,
//     borderLeftWidth: 4,
//     borderLeftColor: '#e94560',
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   cardDescription: {
//     fontSize: 14,
//     color: '#888',
//   },
//   logoutButton: {
//     backgroundColor: '#0f3460',
//     borderRadius: 8,
//     padding: 16,
//     alignItems: 'center',
//     marginTop: 32,
//     borderWidth: 1,
//     borderColor: '#e94560',
//   },
//   logoutText: {
//     color: '#e94560',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });
