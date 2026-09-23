/**
 * API Client for VarshaPurvanumanAI Frontend.
 * Consumes the Phase 9 FastAPI Backend.
 */

import {
  HealthCheckResponse,
  ModelInfoResponse,
  RegimePredictionRequest,
  RegimePredictionResponse,
  RainfallPredictionResponse,
  ProbabilityPredictionResponse,
  CombinedForecastResponse,
  DistrictListResponse,
  DistrictForecastResponse,
  VerificationSummaryResponse,
  VerificationProbabilityResponse,
  VerificationRegimesResponse,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

class ApiClient {
  private isDemoMode: boolean = false;

  setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  getDemoMode(): boolean {
    return this.isDemoMode;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.details) {
            errorDetails = Array.isArray(errData.details)
              ? errData.details.join(', ')
              : JSON.stringify(errData.details);
          } else if (errData.detail) {
            errorDetails = errData.detail;
          }
        } catch (_) {}
        throw new Error(errorDetails);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`API call failed [${endpoint}]:`, err);
      throw err;
    }
  }

  async checkHealth(): Promise<HealthCheckResponse> {
    return this.fetchJson<HealthCheckResponse>('/api/health');
  }

  async getModelInfo(): Promise<ModelInfoResponse> {
    return this.fetchJson<ModelInfoResponse>('/api/models');
  }

  async predictRegime(req: RegimePredictionRequest): Promise<RegimePredictionResponse> {
    return this.fetchJson<RegimePredictionResponse>('/api/regime/predict', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async predictRainfall(req: RegimePredictionRequest): Promise<RainfallPredictionResponse> {
    return this.fetchJson<RainfallPredictionResponse>('/api/rainfall/predict', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async predictProbability(req: RegimePredictionRequest): Promise<ProbabilityPredictionResponse> {
    return this.fetchJson<ProbabilityPredictionResponse>('/api/rainfall/probability', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async predictForecast(req: RegimePredictionRequest): Promise<CombinedForecastResponse> {
    return this.fetchJson<CombinedForecastResponse>('/api/forecast', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getDistricts(): Promise<DistrictListResponse> {
    return this.fetchJson<DistrictListResponse>('/api/districts');
  }

  async getDistrictForecast(districtId: string): Promise<DistrictForecastResponse> {
    return this.fetchJson<DistrictForecastResponse>(`/api/district/${districtId}/forecast`);
  }

  async getDistrictGeoJSON(): Promise<any> {
    return this.fetchJson<any>('/api/districts/geojson');
  }

  async getVerificationSummary(): Promise<VerificationSummaryResponse> {
    return this.fetchJson<VerificationSummaryResponse>('/api/verification/summary');
  }

  async getVerificationThresholds(): Promise<any> {
    return this.fetchJson<any>('/api/verification/thresholds');
  }

  async getVerificationRegimes(): Promise<VerificationRegimesResponse> {
    return this.fetchJson<VerificationRegimesResponse>('/api/verification/regimes');
  }

  async getVerificationProbability(): Promise<VerificationProbabilityResponse> {
    return this.fetchJson<VerificationProbabilityResponse>('/api/verification/probability');
  }
}

export const api = new ApiClient();
