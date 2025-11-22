<template>
  <div :style="containerStyle">
    <h1 :style="headerStyle">
      Vue.js - French Economy Open Data
    </h1>

    <p v-if="loading" :style="loadingStyle">
      Loading datasets...
    </p>

    <p v-if="error" :style="errorStyle">
      Error: {{ error }}
    </p>

    <div v-if="!loading && !error">
      <p :style="countStyle">
        Found {{ datasets.length }} datasets
      </p>
      <DatasetCard
        v-for="(dataset, index) in datasets"
        :key="dataset.dataset?.dataset_id || index"
        :dataset="dataset"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import DatasetCard from './components/DatasetCard.vue';

export default {
  name: 'App',
  components: {
    DatasetCard
  },
  setup() {
    const datasets = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const containerStyle = {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    const headerStyle = {
      color: '#333',
      marginBottom: '24px'
    };

    const loadingStyle = {
      textAlign: 'center',
      color: '#666'
    };

    const errorStyle = {
      color: '#d32f2f',
      backgroundColor: '#ffebee',
      padding: '12px',
      borderRadius: '4px'
    };

    const countStyle = {
      color: '#666',
      marginBottom: '16px'
    };

    onMounted(async () => {
      try {
        const response = await fetch(
          'https://data.economie.gouv.fr/api/explore/v2.0/catalog/datasets'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch datasets');
        }

        const data = await response.json();
        datasets.value = data.datasets || [];
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {
      datasets,
      loading,
      error,
      containerStyle,
      headerStyle,
      loadingStyle,
      errorStyle,
      countStyle
    };
  }
};
</script>
