<template>
  <div :style="cardStyle">
    <h3 :style="titleStyle">
      {{ dataset.dataset?.dataset_id || 'Unknown' }}
    </h3>
    <p v-if="dataset.dataset?.metas?.default?.title" :style="subtitleStyle">
      {{ dataset.dataset.metas.default.title }}
    </p>
    <p v-if="dataset.dataset?.metas?.default?.description" :style="descriptionStyle">
      {{ stripHtml(dataset.dataset.metas.default.description) }}
    </p>
    <div :style="metaStyleWithButton">
      <span v-if="dataset.dataset?.metas?.default?.modified">
        Modified: {{ formatDate(dataset.dataset.metas.default.modified) }}
      </span>
      <span v-if="dataset.dataset?.features && dataset.dataset.features.length > 0">
        Features: {{ dataset.dataset.features.join(', ') }}
      </span>
      <button @click="showDialog = true" :style="buttonStyle">
        Details
      </button>
    </div>

    <Teleport to="body">
      <div v-if="showDialog" :style="backdropStyle" @click="showDialog = false">
        <div :style="dialogStyle" @click.stop>
          <h2 :style="dialogTitleStyle">
            {{ dataset.dataset?.metas?.default?.title || dataset.dataset?.dataset_id }}
          </h2>
          <div :style="dialogContentStyle">
            <p><strong>Dataset ID:</strong> {{ dataset.dataset?.dataset_id }}</p>
            <p><strong>Modified:</strong> {{ dataset.dataset?.metas?.default?.modified ? new Date(dataset.dataset.metas.default.modified).toLocaleString() : 'N/A' }}</p>
            <p><strong>Publisher:</strong> {{ dataset.dataset?.metas?.default?.publisher || 'N/A' }}</p>
            <p><strong>Records:</strong> {{ dataset.dataset?.metas?.default?.records_count || 'N/A' }}</p>
          </div>
          <button @click="showDialog = false" :style="closeButtonStyle">
            Close
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
export default {
  name: 'DatasetCard',
  props: {
    dataset: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showDialog: false,
      cardStyle: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      titleStyle: {
        margin: '0 0 8px 0',
        color: '#333'
      },
      subtitleStyle: {
        margin: '0 0 8px 0',
        fontWeight: '500'
      },
      descriptionStyle: {
        margin: '0 0 8px 0',
        color: '#666',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      metaStyleWithButton: {
        display: 'flex',
        gap: '16px',
        fontSize: '14px',
        color: '#888',
        alignItems: 'center'
      },
      buttonStyle: {
        marginLeft: 'auto',
        padding: '6px 12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
      },
      backdropStyle: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      dialogStyle: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      },
      dialogTitleStyle: {
        margin: '0 0 16px 0',
        fontSize: '20px',
        fontWeight: '600'
      },
      dialogContentStyle: {
        marginBottom: '16px',
        color: '#666'
      },
      closeButtonStyle: {
        padding: '8px 16px',
        backgroundColor: '#666',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }
    };
  },
  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },
    stripHtml(html) {
      return html.replace(/<[^>]*>/g, '');
    }
  }
};
</script>
