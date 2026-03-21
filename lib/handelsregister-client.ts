/**
 * Client for the Handelsregister microservice running on German VPS.
 * Proxied through /api/handelsregister to hide VPS URL + API key.
 */

export interface CompanyResult {
  index: number;
  name: string;
  court: string;
  register_num: string | null;
  state: string;
  status: string;
  gegenstand: string | null;
  si_fetched?: boolean;
  si_error?: string;
}

export interface CompanySearchResponse {
  search_term: string;
  results_count: number;
  first_result: CompanyResult;
  all_results: CompanyResult[];
}

export interface CompanySearchError {
  error: string;
  message: string;
  retry_after?: number;
}

/**
 * Call the Handelsregister microservice via the VPS.
 * Used server-side only (from API routes).
 */
export async function searchHandelsregister(
  searchTerm: string,
  option: "all" | "min" | "exact" = "all"
): Promise<CompanySearchResponse> {
  const apiUrl = process.env.HANDELSREGISTER_API_URL;
  const apiKey = process.env.HANDELSREGISTER_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("HANDELSREGISTER_API_URL or HANDELSREGISTER_API_KEY not configured");
  }

  const params = new URLSearchParams({ search: searchTerm, option });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000); // 25s timeout

  try {
    const response = await fetch(`${apiUrl}/api/company?${params}`, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as CompanySearchError;
      throw new Error(errorBody.message || `Handelsregister API error: ${response.status}`);
    }

    return await response.json() as CompanySearchResponse;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Handelsregister-Abfrage hat zu lange gedauert. Bitte erneut versuchen.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
