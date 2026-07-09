import { env } from "../config/env";

export interface GeocodedCoordinates {
  lat: number;
  lng: number;
}

/**
 * Thin wrapper around the Google Geocoding API.
 * Called only on address create/update (geocode-on-write), never at quote time.
 * Returns null on any failure so callers can save without coords (fail-soft).
 */
export class GeocodingService {
  private buildAddressString(parts: {
    address_line_1?: string | null;
    address_line_2?: string | null;
    barangay?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
  }): string {
    return [
      parts.address_line_1,
      parts.address_line_2,
      parts.barangay,
      parts.city,
      parts.province,
      parts.country ?? "Philippines"
    ]
      .filter(Boolean)
      .join(", ");
  }

  async geocodeAddress(address: string): Promise<GeocodedCoordinates | null> {
    const apiKey = env.googleMapsApiKey;
    if (!apiKey) {
      return null;
    }

    try {
      const encoded = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        status: string;
        results: Array<{
          geometry: { location: { lat: number; lng: number } };
        }>;
      };

      if (data.status !== "OK" || !data.results.length) {
        return null;
      }

      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } catch {
      return null;
    }
  }

  async geocodeLocationFields(parts: {
    address_line_1?: string | null;
    address_line_2?: string | null;
    barangay?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
  }): Promise<GeocodedCoordinates | null> {
    const address = this.buildAddressString(parts);
    if (!address) return null;
    return this.geocodeAddress(address);
  }
}
