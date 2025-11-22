import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DatasetCardComponent } from './dataset-card/dataset-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatasetCardComponent],
  template: `
    <div [ngStyle]="containerStyle">
      <h1 [ngStyle]="headerStyle">
        Angular - French Economy Open Data
      </h1>

      <p *ngIf="loading" [ngStyle]="loadingStyle">
        Loading datasets...
      </p>

      <p *ngIf="error" [ngStyle]="errorStyle">
        Error: {{ error }}
      </p>

      <div *ngIf="!loading && !error">
        <p [ngStyle]="countStyle">
          Found {{ datasets.length }} datasets
        </p>
        <app-dataset-card
          *ngFor="let dataset of datasets; trackBy: trackByDatasetId"
          [dataset]="dataset"
        ></app-dataset-card>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  datasets: any[] = [];
  loading = true;
  error: string | null = null;

  containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  headerStyle = {
    color: '#333',
    marginBottom: '24px'
  };

  loadingStyle = {
    textAlign: 'center',
    color: '#666'
  };

  errorStyle = {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: '12px',
    borderRadius: '4px'
  };

  countStyle = {
    color: '#666',
    marginBottom: '16px'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>('https://data.economie.gouv.fr/api/explore/v2.0/catalog/datasets')
      .subscribe({
        next: (data) => {
          this.datasets = data.datasets || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        }
      });
  }

  trackByDatasetId(index: number, dataset: any): string {
    return dataset.dataset?.dataset_id || index.toString();
  }
}
