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
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  UpdateProfileRequest,
  LoginResponse,
  UserProfile,
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  async getDistricts(useProcessed: boolean = true): Promise<DistrictListResponse> {
    const query = useProcessed ? '?use_processed=true' : '';
    return this.fetchJson<DistrictListResponse>(`/api/districts${query}`);
  }

  async getDistrictForecast(districtId: string, useProcessed: boolean = true): Promise<DistrictForecastResponse> {
    const query = useProcessed ? '?use_processed=true' : '';
    return this.fetchJson<DistrictForecastResponse>(`/api/district/${districtId}/forecast${query}`);
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

  async login(req: LoginRequest): Promise<LoginResponse> {
    const res = await this.fetchJson<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    this.setToken(res.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }
    return res;
  }

  async register(req: RegisterRequest): Promise<LoginResponse> {
    const res = await this.fetchJson<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    this.setToken(res.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }
    return res;
  }

  async googleLogin(req: GoogleLoginRequest): Promise<LoginResponse> {
    const res = await this.fetchJson<LoginResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    this.setToken(res.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }
    return res;
  }

  async updateProfile(username: string, req: UpdateProfileRequest): Promise<UserProfile> {
    const res = await this.fetchJson<UserProfile>(`/api/auth/profile?username=${encodeURIComponent(username)}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(res));
    }
    return res;
  }

  async demoLogin(): Promise<LoginResponse> {
    const res = await this.fetchJson<LoginResponse>('/api/auth/demo-login', {
      method: 'POST',
    });
    this.setToken(res.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }
    return res;
  }

  setToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  getSavedUser(): UserProfile | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auth_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {}
      }
    }
    return null;
  }

  logout() {
    this.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
  }

  async getDatasetsStatus(): Promise<any> {
    return this.fetchJson<any>('/api/data/datasets-status');
  }

  async checkConnectivity(): Promise<any> {
    return this.fetchJson<any>('/api/data/connectivity');
  }
}

export const api = new ApiClient();
