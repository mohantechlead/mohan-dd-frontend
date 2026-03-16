import { getToken } from "@/lib/auth";

interface ApiResponse {
  data: any;
  status: number;
}

export default class ApiProxy {
  // Get headers for API requests
  static async getHeaders(requireAuth: boolean): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const authToken = await getToken();

    if (authToken && requireAuth) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    return headers;
  }

  // Handle the fetch request and return response data
  static async handleFetch(endpoint: string, requestOptions: RequestInit): Promise<ApiResponse> {
    let data: Record<string, unknown> = {};
    let status = 500;

    try {
      const response = await fetch(endpoint, requestOptions);
      const text = await response.text();
      status = response.status;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: "Invalid JSON response", raw: text.slice(0, 200) };
      }
    } catch (error) {
      const err = error as Error;
      data = {
        message: "Cannot reach API server. Is the Django backend running?",
        hint: "Start it with: cd mohan-dd-backend/django_backend && python manage.py runserver",
        endpoint,
        error: err?.message ?? String(error),
      };
      status = 500;
    }

    return { data, status };
  }

  // PUT request
  static async put(endpoint: string, object: any, requireAuth: boolean): Promise<ApiResponse> {
    const jsonData = JSON.stringify(object);
    const headers = await ApiProxy.getHeaders(requireAuth);
    const requestOptions: RequestInit = {
      method: "PUT",
      headers,
      body: jsonData,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }

  // DELETE request
  static async delete(endpoint: string, requireAuth: boolean): Promise<ApiResponse> {
    const headers = await ApiProxy.getHeaders(requireAuth);
    const requestOptions: RequestInit = {
      method: "DELETE",
      headers,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }

  // POST request
  static async post(endpoint: string, object: any, requireAuth: boolean): Promise<ApiResponse> {
    const jsonData = JSON.stringify(object);
    const headers = await ApiProxy.getHeaders(requireAuth);
    const requestOptions: RequestInit = {
      method: "POST",
      headers,
      body: jsonData,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }

  // GET request
  static async get(endpoint: string, requireAuth: boolean): Promise<ApiResponse> {
    const headers = await ApiProxy.getHeaders(requireAuth);
    const requestOptions: RequestInit = {
      method: "GET",
      headers,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }
}
