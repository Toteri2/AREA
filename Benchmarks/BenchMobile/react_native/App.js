import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);

  useEffect(() => {
    fetch('https://data.economie.gouv.fr/api/explore/v2.0/catalog/datasets')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch datasets');
        }
        return response.json();
      })
      .then(data => {
        setDatasets(data.datasets || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const renderDatasetCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.dataset?.dataset_id || 'Unknown'}</Text>
      {item.dataset?.metas?.default?.title && (
        <Text style={styles.cardSubtitle}>{item.dataset.metas.default.title}</Text>
      )}
      {item.dataset?.metas?.default?.description && (
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.dataset.metas.default.description.replace(/<[^>]*>/g, '')}
        </Text>
      )}
      <View style={styles.cardFooter}>
        {item.dataset?.metas?.default?.modified && (
          <Text style={styles.cardMeta}>
            Modified: {new Date(item.dataset.metas.default.modified).toLocaleDateString()}
          </Text>
        )}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setSelectedDataset(item)}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>React Native - French Economy Open Data</Text>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading datasets...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {!loading && !error && (
        <>
          <Text style={styles.countText}>Found {datasets.length} datasets</Text>
          <FlatList
            data={datasets}
            renderItem={renderDatasetCard}
            keyExtractor={(item, index) => item.dataset?.dataset_id || index.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}

      <Modal
        visible={selectedDataset !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDataset(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {selectedDataset?.dataset?.metas?.default?.title || selectedDataset?.dataset?.dataset_id}
              </Text>
              <View style={styles.modalDetails}>
                <Text style={styles.modalDetailText}>
                  <Text style={styles.modalDetailLabel}>Dataset ID:</Text>{' '}
                  {selectedDataset?.dataset?.dataset_id}
                </Text>
                <Text style={styles.modalDetailText}>
                  <Text style={styles.modalDetailLabel}>Modified:</Text>{' '}
                  {selectedDataset?.dataset?.metas?.default?.modified
                    ? new Date(selectedDataset.dataset.metas.default.modified).toLocaleString()
                    : 'N/A'}
                </Text>
                <Text style={styles.modalDetailText}>
                  <Text style={styles.modalDetailLabel}>Publisher:</Text>{' '}
                  {selectedDataset?.dataset?.metas?.default?.publisher || 'N/A'}
                </Text>
                <Text style={styles.modalDetailText}>
                  <Text style={styles.modalDetailLabel}>Records:</Text>{' '}
                  {selectedDataset?.dataset?.metas?.default?.records_count || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedDataset(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    margin: 20,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#d32f2f',
  },
  countText: {
    padding: 16,
    color: '#666',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardMeta: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  detailsButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  modalDetails: {
    marginBottom: 16,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
