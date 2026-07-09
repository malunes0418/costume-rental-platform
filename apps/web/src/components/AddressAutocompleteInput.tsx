"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Loader2, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PLACES_LIBRARIES: ("places")[] = ["places"];

export type ResolvedAddressFields = {
  address_line_1: string;
  address_line_2?: string | null;
  barangay?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  area?: string | null;
  latitude: number;
  longitude: number;
  formatted_address?: string;
};

type AddressAutocompleteInputProps = {
  onResolved: (fields: ResolvedAddressFields) => void;
  className?: string;
  label?: string;
  placeholder?: string;
};

function componentLongName(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string
): string | null {
  const match = components?.find((component) => component.types.includes(type));
  return match?.long_name?.trim() || null;
}

function mapPlaceToFields(place: google.maps.places.PlaceResult): ResolvedAddressFields | null {
  const location = place.geometry?.location;
  if (!location) return null;

  const components = place.address_components;
  const streetNumber = componentLongName(components, "street_number");
  const route = componentLongName(components, "route");
  const premise = componentLongName(components, "premise");
  const streetLine = [streetNumber, route].filter(Boolean).join(" ").trim();

  const barangay =
    componentLongName(components, "sublocality_level_1") ||
    componentLongName(components, "sublocality") ||
    componentLongName(components, "neighborhood");

  const city =
    componentLongName(components, "locality") ||
    componentLongName(components, "administrative_area_level_2") ||
    "";

  const province = componentLongName(components, "administrative_area_level_1");
  const postalCode = componentLongName(components, "postal_code");
  const country = componentLongName(components, "country") || "Philippines";
  const area =
    componentLongName(components, "sublocality_level_2") ||
    componentLongName(components, "neighborhood") ||
    barangay;

  const addressLine1 =
    streetLine ||
    premise ||
    place.name ||
    place.formatted_address?.split(",")[0]?.trim() ||
    "";

  if (!addressLine1 || !city) {
    return null;
  }

  return {
    address_line_1: addressLine1,
    address_line_2: null,
    barangay,
    city,
    province,
    postal_code: postalCode,
    country,
    area,
    latitude: Number(location.lat().toFixed(7)),
    longitude: Number(location.lng().toFixed(7)),
    formatted_address: place.formatted_address || undefined
  };
}

export function AddressAutocompleteInput({
  onResolved,
  className,
  label = "Search address",
  placeholder = "Start typing a street, building, or landmark…"
}: AddressAutocompleteInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const listboxId = useId();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "snapcos-google-places",
    googleMapsApiKey: apiKey,
    libraries: PLACES_LIBRARIES
  });

  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const attributionRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureSessionToken = useCallback(() => {
    if (!sessionTokenRef.current && typeof google !== "undefined") {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof google === "undefined") return;
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    if (attributionRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(attributionRef.current);
    }
  }, [isLoaded]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const runPredictionSearch = useCallback(
    (value: string) => {
      if (!autocompleteServiceRef.current || value.trim().length < 3) {
        setPredictions([]);
        setIsSearching(false);
        setOpen(false);
        return;
      }

      const token = ensureSessionToken();
      setIsSearching(true);
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: "ph" },
          sessionToken: token ?? undefined
        },
        (results, status) => {
          setIsSearching(false);
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([]);
            setOpen(false);
            return;
          }
          setPredictions(results);
          setActiveIndex(-1);
          setOpen(true);
        }
      );
    },
    [ensureSessionToken]
  );

  function handleQueryChange(next: string) {
    setQuery(next);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPredictionSearch(next), 300);
  }

  const resolvePlace = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      if (!placesServiceRef.current) {
        setError("Places service is not ready. Try again in a moment.");
        return;
      }

      setIsResolving(true);
      setError(null);
      const token = ensureSessionToken();

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["geometry.location", "address_components", "formatted_address", "name"],
          sessionToken: token ?? undefined
        },
        (place, status) => {
          setIsResolving(false);
          // End the billing session after Place Details (per Google session pricing).
          sessionTokenRef.current = null;

          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            setError("Could not load that place. Try another suggestion or enter the address manually.");
            return;
          }

          const mapped = mapPlaceToFields(place);
          if (!mapped) {
            setError("That place is missing a street or city. Enter the address manually instead.");
            return;
          }

          setQuery(prediction.description);
          setPredictions([]);
          setOpen(false);
          onResolved(mapped);
        }
      );
    },
    [ensureSessionToken, onResolved]
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || predictions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % predictions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? predictions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      resolvePlace(predictions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const helperText = useMemo(() => {
    if (loadError) return "Google Places failed to load. Enter the address manually instead.";
    if (!apiKey) return null;
    if (!isLoaded) return "Loading address search…";
    return "Philippines addresses only. Pick a suggestion to enable live delivery quotes.";
  }, [apiKey, isLoaded, loadError]);

  if (!apiKey) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            // Delay so suggestion clicks register before the list closes.
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder={placeholder}
          disabled={!isLoaded || Boolean(loadError) || isResolving}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className="h-11 rounded-sm pl-10 pr-10"
        />
        {(isSearching || isResolving) && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {open && predictions.length > 0 ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-background shadow-lg"
          >
            {predictions.map((prediction, index) => (
              <li key={prediction.place_id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                    index === activeIndex ? "bg-muted" : "hover:bg-muted/70"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => resolvePlace(prediction)}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium text-foreground">
                      {prediction.structured_formatting.main_text}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {prediction.structured_formatting.secondary_text}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {/* Required attribution container for PlacesService; visually hidden. */}
      <div ref={attributionRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
