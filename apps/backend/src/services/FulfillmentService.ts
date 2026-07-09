import type {
  CostumeFulfillmentOverrideRequest,
  EffectiveCostumeFulfillmentResponse,
  PreparedReservationFulfillment,
  ReservationFulfillmentSelectionRequest,
  UserFulfillmentPreferencesRequest,
  UserFulfillmentPreferencesResponse,
  UserSavedLocationRequest,
  VendorFulfillmentSettingsRequest
} from "../dto/fulfillment.dto";
import { GeocodingService } from "./GeocodingService";
import { LalamoveClient, LalamoveApiError } from "./lalamove/LalamoveClient";
import { buildQuotationPayload, parseQuotedPrice } from "./lalamove/LalamoveQuoteHelper";
import {
  buildWindowRange,
  isFulfillmentMethod,
  isFulfillmentMode,
  isFulfillmentWindowSlot,
  isModeNarrowerOrEqual,
  locationMatchesServiceArea,
  modeAllowsMethod,
  type LocationSnapshot,
  type ServiceAreaDefinition
} from "../domain/fulfillment";
import { Costume } from "../models/Costume";
import { CostumeFulfillmentOverride } from "../models/CostumeFulfillmentOverride";
import { ReservationFulfillment } from "../models/ReservationFulfillment";
import { UserSavedLocation } from "../models/UserSavedLocation";
import { UserFulfillmentPreferences } from "../models/UserFulfillmentPreferences";
import { VendorFulfillmentSettings } from "../models/VendorFulfillmentSettings";

type SavedLocationResolution = {
  id: number | null;
  snapshot: LocationSnapshot | null;
};

const DEFAULT_VENDOR_FULFILLMENT = {
  outbound_mode: "BOTH" as const,
  return_mode: "BOTH" as const,
  outbound_pickup_fee: 0,
  outbound_delivery_fee: 0,
  return_pickup_fee: 0,
  return_delivery_fee: 0,
  primary_location: null as LocationSnapshot | null,
  service_areas: null as ServiceAreaDefinition[] | null,
  delivery_provider: "MANUAL" as const,
  lalamove_service_type: "MOTORCYCLE" as string | null
};

export class FulfillmentService {
  private geocodingService = new GeocodingService();

  private assertFulfillmentModePair(input: Pick<VendorFulfillmentSettingsRequest, "outbound_mode" | "return_mode">) {
    if (!isFulfillmentMode(input.outbound_mode)) {
      throw new Error("Invalid outbound fulfillment mode");
    }
    if (!isFulfillmentMode(input.return_mode)) {
      throw new Error("Invalid return fulfillment mode");
    }
  }

  private parseMoney(value: number | string | undefined) {
    if (value === undefined || value === null || value === "") return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("Fulfillment fees must be valid non-negative numbers");
    }
    return parsed;
  }

  private normalizeText(value: unknown) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }

  private normalizeLocationSnapshot(
    input: Record<string, unknown> | null | undefined,
    labelFallback: string,
    options?: { requireContactFields?: boolean }
  ): LocationSnapshot | null {
    if (!input) return null;

    const addressLine1 = this.normalizeText(input.address_line_1);
    const city = this.normalizeText(input.city);
    if (!addressLine1 || !city) {
      throw new Error("Location must include address line 1 and city");
    }

    const contactRequired = Boolean(options?.requireContactFields);
    const contactName = this.normalizeText(input.contact_name);
    const phoneNumber = this.normalizeText(input.phone_number);
    if (contactRequired && !contactName) {
      throw new Error("Location must include a contact name");
    }
    if (contactRequired && !phoneNumber) {
      throw new Error("Location must include a phone number");
    }

    const latitude = this.normalizeCoordinate(input.latitude);
    const longitude = this.normalizeCoordinate(input.longitude);
    if ((latitude === null) !== (longitude === null)) {
      throw new Error("Location pin must include both latitude and longitude");
    }
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      throw new Error("Latitude must be between -90 and 90");
    }
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      throw new Error("Longitude must be between -180 and 180");
    }

    return {
      label: this.normalizeText(input.label) || labelFallback,
      contact_name: contactName,
      phone_number: phoneNumber,
      address_line_1: addressLine1,
      address_line_2: this.normalizeText(input.address_line_2),
      barangay: this.normalizeText(input.barangay),
      city,
      province: this.normalizeText(input.province),
      postal_code: this.normalizeText(input.postal_code),
      country: this.normalizeText(input.country) || "Philippines",
      area: this.normalizeText(input.area),
      notes: this.normalizeText(input.notes),
      latitude,
      longitude
    };
  }

  private normalizeLocationInput(input: UserSavedLocationRequest) {
    const snapshot = this.normalizeLocationSnapshot(input as unknown as Record<string, unknown>, "Saved location", {
      requireContactFields: true
    });

    if (!snapshot) {
      throw new Error("Location is required");
    }

    return {
      label: snapshot.label || "Saved location",
      contact_name: snapshot.contact_name || "",
      phone_number: snapshot.phone_number || "",
      address_line_1: snapshot.address_line_1 || "",
      address_line_2: snapshot.address_line_2 || null,
      barangay: snapshot.barangay || null,
      city: snapshot.city || "",
      province: snapshot.province || null,
      postal_code: snapshot.postal_code || null,
      country: snapshot.country || "Philippines",
      area: snapshot.area || null,
      notes: snapshot.notes || null,
      is_default: Boolean(input.is_default),
      latitude: snapshot.latitude ?? null,
      longitude: snapshot.longitude ?? null
    };
  }

  private async resolveCoordinates(values: {
    address_line_1: string;
    address_line_2?: string | null;
    barangay?: string | null;
    city: string;
    province?: string | null;
    postal_code?: string | null;
    country?: string | null;
    area?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<{ lat: number; lng: number } | null> {
    if (
      values.latitude !== null &&
      values.latitude !== undefined &&
      values.longitude !== null &&
      values.longitude !== undefined
    ) {
      return { lat: values.latitude, lng: values.longitude };
    }

    return this.geocodingService.geocodeLocationFields(values).catch(() => null);
  }

  private normalizeServiceAreas(input: VendorFulfillmentSettingsRequest["service_areas"]) {
    if (!input) return null;

    const rawAreas = Array.isArray(input) ? input : [input];
    const normalized = rawAreas
      .map((area) => ({
        label: this.normalizeText(area?.label),
        city: this.normalizeText(area?.city),
        province: this.normalizeText(area?.province),
        area: this.normalizeText(area?.area),
        notes: this.normalizeText(area?.notes)
      }))
      .filter((area) => area.label || area.area || area.city || area.province);

    return normalized.length > 0 ? normalized : null;
  }

  private toLocationSnapshot(location: Pick<
    UserSavedLocation,
    | "label"
    | "contact_name"
    | "phone_number"
    | "address_line_1"
    | "address_line_2"
    | "barangay"
    | "city"
    | "province"
    | "postal_code"
    | "country"
    | "area"
    | "notes"
    | "latitude"
    | "longitude"
  >): LocationSnapshot {
    return {
      label: location.label,
      contact_name: location.contact_name,
      phone_number: location.phone_number,
      address_line_1: location.address_line_1,
      address_line_2: location.address_line_2,
      barangay: location.barangay,
      city: location.city,
      province: location.province,
      postal_code: location.postal_code,
      country: location.country,
      area: location.area,
      notes: location.notes,
      latitude: location.latitude,
      longitude: location.longitude
    };
  }

  private async ensureOverrideCompatibilityWithVendorDefaults(
    vendorId: number,
    outboundMode: VendorFulfillmentSettingsRequest["outbound_mode"],
    returnMode: VendorFulfillmentSettingsRequest["return_mode"]
  ) {
    const costumesWithOverrides = await Costume.findAll({
      where: { owner_id: vendorId },
      include: [{ association: "fulfillmentOverride", required: true }]
    });

    const incompatible = costumesWithOverrides
      .filter((costume) => {
        const override = (costume as any).fulfillmentOverride as CostumeFulfillmentOverride | undefined;
        if (!override) return false;

        return (
          !isModeNarrowerOrEqual(outboundMode, override.outbound_mode) ||
          !isModeNarrowerOrEqual(returnMode, override.return_mode)
        );
      })
      .map((costume) => costume.name);

    if (incompatible.length > 0) {
      throw new Error(
        `Update costume fulfillment overrides before narrowing vendor defaults for: ${incompatible.join(", ")}`
      );
    }
  }

  private async resolveDeliveryLocationSelection(
    userId: number,
    selection: {
      saved_location_id?: number | null;
      new_location?: UserSavedLocationRequest | null;
      save_as_default?: boolean;
    } | null | undefined
  ): Promise<SavedLocationResolution> {
    if (selection?.saved_location_id || selection?.new_location) {
      return this.resolveSavedLocationSelection(userId, selection);
    }

    const prefs = await UserFulfillmentPreferences.findOne({ where: { user_id: userId } });
    if (prefs?.default_saved_location_id) {
      return this.resolveSavedLocationSelection(userId, {
        saved_location_id: Number(prefs.default_saved_location_id)
      });
    }

    throw new Error("A renter location is required for delivery");
  }

  private async resolveSavedLocationSelection(
    userId: number,
    selection: {
      saved_location_id?: number | null;
      new_location?: UserSavedLocationRequest | null;
      save_as_default?: boolean;
    } | null | undefined
  ): Promise<SavedLocationResolution> {
    if (!selection) {
      throw new Error("A renter location is required for delivery");
    }

    if (selection.saved_location_id) {
      const location = await UserSavedLocation.findOne({
        where: { id: Number(selection.saved_location_id), user_id: userId }
      });
      if (!location) {
        throw new Error("Saved location not found");
      }

      return {
        id: location.id,
        snapshot: this.toLocationSnapshot(location)
      };
    }

    if (!selection.new_location) {
      throw new Error("A renter location is required for delivery");
    }

    const createdLocation = await this.createSavedLocation(userId, {
      ...selection.new_location,
      is_default: Boolean(selection.save_as_default)
    });

    return {
      id: createdLocation.id,
      snapshot: this.toLocationSnapshot(createdLocation)
    };
  }

  private assertPickupLocationConfigured(location: LocationSnapshot | null) {
    if (!location) {
      throw new Error("Vendor must configure a primary business location before pickup can be offered");
    }
  }

  private outsideServiceAreaForLocation(
    location: LocationSnapshot | null,
    serviceAreas: ServiceAreaDefinition[] | null
  ) {
    if (!location || !serviceAreas || serviceAreas.length === 0) {
      return false;
    }

    return !serviceAreas.some((serviceArea) => locationMatchesServiceArea(location, serviceArea));
  }

  async getVendorSettings(vendorId: number) {
    return VendorFulfillmentSettings.findOne({ where: { vendor_id: vendorId } });
  }

  async upsertVendorSettings(vendorId: number, payload: VendorFulfillmentSettingsRequest) {
    this.assertFulfillmentModePair(payload);
    await this.ensureOverrideCompatibilityWithVendorDefaults(vendorId, payload.outbound_mode, payload.return_mode);

    const settings = await VendorFulfillmentSettings.findOne({ where: { vendor_id: vendorId } });
    const primaryLocation = this.normalizeLocationSnapshot(
      (payload.primary_location as Record<string, unknown> | null | undefined) ?? null,
      "Primary business location"
    );

    if (primaryLocation && (primaryLocation.latitude == null || primaryLocation.longitude == null)) {
      const coords = await this.resolveCoordinates({
        address_line_1: primaryLocation.address_line_1 || "",
        address_line_2: primaryLocation.address_line_2,
        barangay: primaryLocation.barangay,
        city: primaryLocation.city || "",
        province: primaryLocation.province,
        postal_code: primaryLocation.postal_code,
        country: primaryLocation.country,
        area: primaryLocation.area,
        latitude: primaryLocation.latitude,
        longitude: primaryLocation.longitude
      });
      if (coords) {
        primaryLocation.latitude = coords.lat;
        primaryLocation.longitude = coords.lng;
      }
    }

    const nextValues = {
      vendor_id: vendorId,
      primary_location: primaryLocation,
      outbound_mode: payload.outbound_mode,
      return_mode: payload.return_mode,
      outbound_pickup_fee: this.parseMoney(payload.outbound_pickup_fee),
      outbound_delivery_fee: this.parseMoney(payload.outbound_delivery_fee),
      return_pickup_fee: this.parseMoney(payload.return_pickup_fee),
      return_delivery_fee: this.parseMoney(payload.return_delivery_fee),
      service_areas: this.normalizeServiceAreas(payload.service_areas),
      delivery_provider: payload.delivery_provider ?? "MANUAL",
      lalamove_service_type: payload.lalamove_service_type ?? "MOTORCYCLE"
    };

    if (settings) {
      await settings.update(nextValues);
      return settings;
    }

    return VendorFulfillmentSettings.create(nextValues);
  }

  async getEffectiveCostumeFulfillment(
    costume: Pick<Costume, "id" | "owner_id">
  ): Promise<EffectiveCostumeFulfillmentResponse> {
    const vendorId = Number(costume.owner_id);
    if (!vendorId) {
      throw new Error("Costume is missing a vendor");
    }

    const [settings, override] = await Promise.all([
      VendorFulfillmentSettings.findOne({ where: { vendor_id: vendorId } }),
      CostumeFulfillmentOverride.findOne({ where: { costume_id: Number(costume.id) } })
    ]);

    const baseOutboundMode = settings?.outbound_mode ?? DEFAULT_VENDOR_FULFILLMENT.outbound_mode;
    const baseReturnMode = settings?.return_mode ?? DEFAULT_VENDOR_FULFILLMENT.return_mode;

    const effectiveOverride =
      override &&
      isModeNarrowerOrEqual(baseOutboundMode, override.outbound_mode) &&
      isModeNarrowerOrEqual(baseReturnMode, override.return_mode)
        ? override
        : null;

    return {
      vendor_settings_configured: Boolean(settings),
      primary_location: (settings?.primary_location as LocationSnapshot | null) ?? DEFAULT_VENDOR_FULFILLMENT.primary_location,
      service_areas: (settings?.service_areas as ServiceAreaDefinition[] | null) ?? DEFAULT_VENDOR_FULFILLMENT.service_areas,
      outbound_mode: effectiveOverride?.outbound_mode ?? baseOutboundMode,
      return_mode: effectiveOverride?.return_mode ?? baseReturnMode,
      outbound_pickup_fee: Number(settings?.outbound_pickup_fee ?? DEFAULT_VENDOR_FULFILLMENT.outbound_pickup_fee),
      outbound_delivery_fee: Number(
        settings?.outbound_delivery_fee ?? DEFAULT_VENDOR_FULFILLMENT.outbound_delivery_fee
      ),
      return_pickup_fee: Number(settings?.return_pickup_fee ?? DEFAULT_VENDOR_FULFILLMENT.return_pickup_fee),
      return_delivery_fee: Number(settings?.return_delivery_fee ?? DEFAULT_VENDOR_FULFILLMENT.return_delivery_fee),
      delivery_provider: settings?.delivery_provider ?? DEFAULT_VENDOR_FULFILLMENT.delivery_provider,
      lalamove_service_type: settings?.lalamove_service_type ?? DEFAULT_VENDOR_FULFILLMENT.lalamove_service_type,
      costume_override: effectiveOverride ? effectiveOverride.toJSON() : null
    };
  }

  async upsertCostumeOverride(
    vendorId: number,
    costumeId: number,
    payload?: CostumeFulfillmentOverrideRequest | null
  ) {
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) {
      throw new Error("Costume not found or unauthorized");
    }

    const existingOverride = await CostumeFulfillmentOverride.findOne({ where: { costume_id: costume.id } });

    if (payload === undefined) {
      return existingOverride;
    }

    if (payload === null) {
      if (existingOverride) {
        await existingOverride.destroy();
      }
      return null;
    }

    if (!isFulfillmentMode(payload.outbound_mode) || !isFulfillmentMode(payload.return_mode)) {
      throw new Error("Invalid costume fulfillment override");
    }

    const vendorSettings = await this.getVendorSettings(vendorId);
    const vendorOutboundMode = vendorSettings?.outbound_mode ?? DEFAULT_VENDOR_FULFILLMENT.outbound_mode;
    const vendorReturnMode = vendorSettings?.return_mode ?? DEFAULT_VENDOR_FULFILLMENT.return_mode;

    if (!isModeNarrowerOrEqual(vendorOutboundMode, payload.outbound_mode)) {
      throw new Error("Costume outbound override cannot expand the vendor default");
    }
    if (!isModeNarrowerOrEqual(vendorReturnMode, payload.return_mode)) {
      throw new Error("Costume return override cannot expand the vendor default");
    }

    if (payload.outbound_mode === vendorOutboundMode && payload.return_mode === vendorReturnMode) {
      if (existingOverride) {
        await existingOverride.destroy();
      }
      return null;
    }

    if (existingOverride) {
      await existingOverride.update(payload);
      return existingOverride;
    }

    return CostumeFulfillmentOverride.create({
      costume_id: costume.id,
      ...payload
    });
  }

  async listSavedLocations(userId: number) {
    return UserSavedLocation.findAll({
      where: { user_id: userId },
      order: [
        ["is_default", "DESC"],
        ["created_at", "DESC"]
      ]
    });
  }

  async createSavedLocation(userId: number, payload: UserSavedLocationRequest) {
    const values = this.normalizeLocationInput(payload);
    const existingCount = await UserSavedLocation.count({ where: { user_id: userId } });
    const isDefault = existingCount === 0 ? true : values.is_default;

    if (isDefault) {
      await UserSavedLocation.update({ is_default: false }, { where: { user_id: userId } });
    }

    const { latitude: _lat, longitude: _lng, ...locationValues } = values;
    const coords = await this.resolveCoordinates(values);

    return UserSavedLocation.create({
      ...locationValues,
      is_default: isDefault,
      user_id: userId,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null
    });
  }

  async updateSavedLocation(userId: number, locationId: number, payload: UserSavedLocationRequest) {
    const location = await UserSavedLocation.findOne({
      where: { id: locationId, user_id: userId }
    });
    if (!location) {
      throw new Error("Saved location not found");
    }

    const values = this.normalizeLocationInput(payload);
    if (values.is_default) {
      await UserSavedLocation.update({ is_default: false }, { where: { user_id: userId } });
    }

    const { latitude: _lat, longitude: _lng, ...locationValues } = values;
    const coords = await this.resolveCoordinates(values);

    await location.update({
      ...locationValues,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null
    });
    return location;
  }

  private emptyFulfillmentPreferences(userId: number): UserFulfillmentPreferencesResponse {
    return {
      user_id: userId,
      default_saved_location_id: null,
      default_delivery_window_slot: null,
      default_return_window_slot: null
    };
  }

  private toFulfillmentPreferencesResponse(
    prefs: UserFulfillmentPreferences
  ): UserFulfillmentPreferencesResponse {
    return {
      user_id: prefs.user_id,
      default_saved_location_id: prefs.default_saved_location_id
        ? Number(prefs.default_saved_location_id)
        : null,
      default_delivery_window_slot: prefs.default_delivery_window_slot ?? null,
      default_return_window_slot: prefs.default_return_window_slot ?? null,
      created_at: prefs.created_at,
      updated_at: prefs.updated_at
    };
  }

  private async validateFulfillmentPreferencesPayload(
    userId: number,
    payload: UserFulfillmentPreferencesRequest
  ) {
    if (
      payload.default_delivery_window_slot !== undefined &&
      payload.default_delivery_window_slot !== null &&
      !isFulfillmentWindowSlot(payload.default_delivery_window_slot)
    ) {
      throw new Error("Invalid default delivery window slot");
    }

    if (
      payload.default_return_window_slot !== undefined &&
      payload.default_return_window_slot !== null &&
      !isFulfillmentWindowSlot(payload.default_return_window_slot)
    ) {
      throw new Error("Invalid default return window slot");
    }

    if (payload.default_saved_location_id) {
      const location = await UserSavedLocation.findOne({
        where: { id: Number(payload.default_saved_location_id), user_id: userId }
      });
      if (!location) {
        throw new Error("Saved location not found");
      }
    }
  }

  async getFulfillmentPreferences(userId: number): Promise<UserFulfillmentPreferencesResponse> {
    const prefs = await UserFulfillmentPreferences.findOne({ where: { user_id: userId } });
    if (!prefs) {
      return this.emptyFulfillmentPreferences(userId);
    }

    return this.toFulfillmentPreferencesResponse(prefs);
  }

  async upsertFulfillmentPreferences(
    userId: number,
    payload: UserFulfillmentPreferencesRequest
  ): Promise<UserFulfillmentPreferencesResponse> {
    await this.validateFulfillmentPreferencesPayload(userId, payload);

    const existing = await UserFulfillmentPreferences.findOne({ where: { user_id: userId } });
    const nextValues = {
      default_saved_location_id:
        payload.default_saved_location_id === undefined
          ? (existing?.default_saved_location_id ?? null)
          : payload.default_saved_location_id,
      default_delivery_window_slot:
        payload.default_delivery_window_slot === undefined
          ? (existing?.default_delivery_window_slot ?? null)
          : payload.default_delivery_window_slot,
      default_return_window_slot:
        payload.default_return_window_slot === undefined
          ? (existing?.default_return_window_slot ?? null)
          : payload.default_return_window_slot
    };

    if (existing) {
      await existing.update(nextValues);
      return this.toFulfillmentPreferencesResponse(existing);
    }

    const created = await UserFulfillmentPreferences.create({
      user_id: userId,
      ...nextValues
    });

    return this.toFulfillmentPreferencesResponse(created);
  }

  async deleteSavedLocation(userId: number, locationId: number) {
    const location = await UserSavedLocation.findOne({
      where: { id: locationId, user_id: userId }
    });
    if (!location) {
      throw new Error("Saved location not found");
    }

    const wasDefault = location.is_default;
    await location.destroy();

    if (wasDefault) {
      const nextLocation = await UserSavedLocation.findOne({
        where: { user_id: userId },
        order: [["created_at", "DESC"]]
      });
      if (nextLocation) {
        nextLocation.is_default = true;
        await nextLocation.save();
      }
    }

    return { success: true as const };
  }

  async prepareReservationFulfillment(args: {
    userId: number;
    costume: Pick<Costume, "id" | "owner_id">;
    startDate: string;
    endDate: string;
    selection: ReservationFulfillmentSelectionRequest;
  }): Promise<PreparedReservationFulfillment> {
    const { userId, costume, startDate, endDate, selection } = args;
    if (!selection) {
      throw new Error("Fulfillment selection is required");
    }

    if (!isFulfillmentMethod(selection.outbound_method) || !isFulfillmentMethod(selection.return_method)) {
      throw new Error("Invalid fulfillment method");
    }
    if (
      (selection.pickup_window_slot && !isFulfillmentWindowSlot(selection.pickup_window_slot)) ||
      (selection.delivery_window_slot && !isFulfillmentWindowSlot(selection.delivery_window_slot)) ||
      !isFulfillmentWindowSlot(selection.return_window_slot)
    ) {
      throw new Error("Invalid fulfillment time window");
    }

    const effective = await this.getEffectiveCostumeFulfillment(costume);
    if (!modeAllowsMethod(effective.outbound_mode, selection.outbound_method)) {
      throw new Error("Selected outbound method is not available for this costume");
    }
    if (!modeAllowsMethod(effective.return_mode, selection.return_method)) {
      throw new Error("Selected return method is not available for this costume");
    }

    const vendorLocation = effective.primary_location;
    if (selection.outbound_method === "PICKUP") {
      this.assertPickupLocationConfigured(vendorLocation);
    }
    if (selection.return_method === "PICKUP") {
      this.assertPickupLocationConfigured(vendorLocation);
    }

    const outboundLocation =
      selection.outbound_method === "DELIVERY"
        ? await this.resolveDeliveryLocationSelection(userId, selection.outbound_location)
        : { id: null, snapshot: vendorLocation };

    const canReuseOutboundLocation =
      Boolean(selection.use_same_location_for_return) &&
      selection.outbound_method === "DELIVERY" &&
      selection.return_method === "DELIVERY";

    const returnLocation =
      selection.return_method === "DELIVERY"
        ? canReuseOutboundLocation
          ? outboundLocation
          : await this.resolveDeliveryLocationSelection(userId, selection.return_location)
        : { id: null, snapshot: vendorLocation };

    const pickupRange =
      selection.outbound_method === "PICKUP"
        ? buildWindowRange(
            startDate,
            selection.pickup_window_slot || (() => {
              throw new Error("Pickup window is required for pickup outbound reservations");
            })()
          )
        : null;

    const deliveryRange =
      selection.outbound_method === "DELIVERY"
        ? buildWindowRange(
            startDate,
            selection.delivery_window_slot || (() => {
              throw new Error("Delivery window is required for delivery outbound reservations");
            })()
          )
        : null;

    const returnRange = buildWindowRange(endDate, selection.return_window_slot);

    const staticOutboundFee =
      selection.outbound_method === "PICKUP"
        ? Number(effective.outbound_pickup_fee)
        : Number(effective.outbound_delivery_fee);
    const staticReturnFee =
      selection.return_method === "PICKUP"
        ? Number(effective.return_pickup_fee)
        : Number(effective.return_delivery_fee);

    let outboundFee = staticOutboundFee;
    let returnFee = staticReturnFee;
    let returnFeeIsEstimate = false;

    // Attempt live Lalamove quotes when the vendor uses Lalamove and both legs are DELIVERY
    if (
      effective.delivery_provider === "LALAMOVE" &&
      selection.outbound_method === "DELIVERY" &&
      selection.return_method === "DELIVERY"
    ) {
      try {
        const lalamove = new LalamoveClient();
        const serviceType = effective.lalamove_service_type ?? "MOTORCYCLE";
        const vendorLoc = effective.primary_location as LocationSnapshot | null;

        const outboundPayload = buildQuotationPayload(vendorLoc, outboundLocation.snapshot, serviceType);
        const returnPayload = buildQuotationPayload(returnLocation.snapshot, vendorLoc, serviceType);

        const [outboundQuote, returnQuote] = await Promise.all([
          outboundPayload ? lalamove.createQuotation(outboundPayload) : null,
          returnPayload ? lalamove.createQuotation(returnPayload) : null
        ]);

        if (outboundQuote) {
          outboundFee = parseQuotedPrice(outboundQuote.priceBreakdown.total);
        }
        if (returnQuote) {
          returnFee = parseQuotedPrice(returnQuote.priceBreakdown.total);
          returnFeeIsEstimate = true;
        }
      } catch (err) {
        // Fail-soft: use static fees on any Lalamove / network error
        if (!(err instanceof LalamoveApiError)) {
          console.warn("[FulfillmentService] Lalamove quote failed, using static fees:", err);
        } else {
          console.warn(`[FulfillmentService] Lalamove API error ${err.statusCode} (${err.lalamoveCode}), using static fees`);
        }
        outboundFee = staticOutboundFee;
        returnFee = staticReturnFee;
        returnFeeIsEstimate = false;
      }
    }

    const outsideServiceArea =
      this.outsideServiceAreaForLocation(
        selection.outbound_method === "DELIVERY" ? outboundLocation.snapshot : null,
        effective.service_areas as ServiceAreaDefinition[] | null
      ) ||
      this.outsideServiceAreaForLocation(
        selection.return_method === "DELIVERY" ? returnLocation.snapshot : null,
        effective.service_areas as ServiceAreaDefinition[] | null
      );

    return {
      outbound_method: selection.outbound_method,
      return_method: selection.return_method,
      outbound_location_id: outboundLocation.id,
      outbound_location_snapshot: outboundLocation.snapshot,
      return_location_id: returnLocation.id,
      return_location_snapshot: returnLocation.snapshot,
      pickup_window_start: pickupRange?.start ?? null,
      pickup_window_end: pickupRange?.end ?? null,
      delivery_window_start: deliveryRange?.start ?? null,
      delivery_window_end: deliveryRange?.end ?? null,
      return_window_start: returnRange.start,
      return_window_end: returnRange.end,
      outbound_fee: outboundFee,
      return_fee: returnFee,
      return_fee_is_estimate: returnFeeIsEstimate,
      outside_service_area: outsideServiceArea,
      vendor_approval_status: "PENDING_VENDOR_REVIEW",
      vendor_approval_note: null
    };
  }

  async upsertReservationFulfillment(reservationId: number, payload: PreparedReservationFulfillment) {
    const existing = await ReservationFulfillment.findOne({ where: { reservation_id: reservationId } });
    if (existing) {
      await existing.update(payload);
      return existing;
    }

    return ReservationFulfillment.create({
      reservation_id: reservationId,
      ...payload
    });
  }
}
