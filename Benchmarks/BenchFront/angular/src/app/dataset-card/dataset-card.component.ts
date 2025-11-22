import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dataset-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngStyle]="cardStyle">
      <h3 [ngStyle]="titleStyle">
        {{ dataset.dataset?.dataset_id || 'Unknown' }}
      </h3>
      <p *ngIf="dataset.dataset?.metas?.default?.title" [ngStyle]="subtitleStyle">
        {{ dataset.dataset.metas.default.title }}
      </p>
      <p *ngIf="dataset.dataset?.metas?.default?.description" [ngStyle]="descriptionStyle">
        {{ stripHtml(dataset.dataset.metas.default.description) }}
      </p>
      <div [ngStyle]="metaStyleWithButton">
        <span *ngIf="dataset.dataset?.metas?.default?.modified">
          Modified: {{ formatDate(dataset.dataset.metas.default.modified) }}
        </span>
        <span *ngIf="dataset.dataset?.features && dataset.dataset.features.length > 0">
          Features: {{ dataset.dataset.features.join(', ') }}
        </span>
        <button (click)="showDialog = true" [ngStyle]="buttonStyle">
          Details
        </button>
      </div>
    </div>

    <div *ngIf="showDialog" [ngStyle]="backdropStyle" (click)="showDialog = false">
      <div [ngStyle]="dialogStyle" (click)="$event.stopPropagation()">
        <h2 [ngStyle]="dialogTitleStyle">
          {{ dataset.dataset?.metas?.default?.title || dataset.dataset?.dataset_id }}
        </h2>
        <div [ngStyle]="dialogContentStyle">
          <p><strong>Dataset ID:</strong> {{ dataset.dataset?.dataset_id }}</p>
          <p><strong>Modified:</strong> {{ dataset.dataset?.metas?.default?.modified ? formatDateTime(dataset.dataset.metas.default.modified) : 'N/A' }}</p>
          <p><strong>Publisher:</strong> {{ dataset.dataset?.metas?.default?.publisher || 'N/A' }}</p>
          <p><strong>Records:</strong> {{ dataset.dataset?.metas?.default?.records_count || 'N/A' }}</p>
        </div>
        <button (click)="showDialog = false" [ngStyle]="closeButtonStyle">
          Close
        </button>
      </div>
    </div>
  `
})
export class DatasetCardComponent {
  @Input() dataset: any;
  showDialog = false;

  cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  titleStyle = {
    margin: '0 0 8px 0',
    color: '#333'
  };

  subtitleStyle = {
    margin: '0 0 8px 0',
    fontWeight: '500'
  };

  descriptionStyle = {
    margin: '0 0 8px 0',
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5'
  };

  metaStyleWithButton = {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#888',
    alignItems: 'center'
  };

  buttonStyle = {
    marginLeft: 'auto',
    padding: '6px 12px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  backdropStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  dialogStyle = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  dialogTitleStyle = {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: '600'
  };

  dialogContentStyle = {
    marginBottom: '16px',
    color: '#666'
  };

  closeButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
