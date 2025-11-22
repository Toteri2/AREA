import { useState } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';

function DatasetCard({ dataset }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
        {dataset.dataset?.dataset_id || 'Unknown'}
      </h3>
      {dataset.dataset?.metas?.default?.title && (
        <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
          {dataset.dataset.metas.default.title}
        </p>
      )}
      {dataset.dataset?.metas?.default?.description && (
        <p style={{
          margin: '0 0 8px 0',
          color: '#666',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        dangerouslySetInnerHTML={{ __html: dataset.dataset.metas.default.description.replace(/<[^>]*>/g, '') }}
        />
      )}
      <div style={{
        display: 'flex',
        gap: '16px',
        fontSize: '14px',
        color: '#888',
        alignItems: 'center'
      }}>
        {dataset.dataset?.metas?.default?.modified && (
          <span>Modified: {new Date(dataset.dataset.metas.default.modified).toLocaleDateString()}</span>
        )}
        {dataset.dataset?.features && dataset.dataset.features.length > 0 && (
          <span>Features: {dataset.dataset.features.join(', ')}</span>
        )}

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Details
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }} />
            <Dialog.Popup style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1001,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <Dialog.Title style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
                {dataset.dataset?.metas?.default?.title || dataset.dataset?.dataset_id}
              </Dialog.Title>
              <Dialog.Description style={{ marginBottom: '16px', color: '#666' }}>
                <strong>Dataset ID:</strong> {dataset.dataset?.dataset_id}<br/>
                <strong>Modified:</strong> {dataset.dataset?.metas?.default?.modified ? new Date(dataset.dataset.metas.default.modified).toLocaleString() : 'N/A'}<br/>
                <strong>Publisher:</strong> {dataset.dataset?.metas?.default?.publisher || 'N/A'}<br/>
                <strong>Records:</strong> {dataset.dataset?.metas?.default?.records_count || 'N/A'}
              </Dialog.Description>
              <Dialog.Close style={{
                padding: '8px 16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Close
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

export default DatasetCard;
