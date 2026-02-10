import React, { useState, useEffect } from 'react';
import DatasetCard from './DatasetCard';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '24px' }}>
        React - French Economy Open Data
      </h1>

      {loading && (
        <p style={{ textAlign: 'center', color: '#666' }}>Loading datasets...</p>
      )}

      {error && (
        <p style={{
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          padding: '12px',
          borderRadius: '4px'
        }}>
          Error: {error}
        </p>
      )}

      {!loading && !error && (
        <div>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Found {datasets.length} datasets
          </p>
          {datasets.map((dataset, index) => (
            <DatasetCard key={dataset.dataset?.dataset_id || index} dataset={dataset} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
