/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import type { Point3d, XAndY } from "@szewtwin/core-geometry";
import type { Cartographic } from "@szewtwin/core-common";
import { IVaultApp, QuantityType } from "@szewtwin/core-frontend";
import { FormatTraits } from "@szewtwin/core-quantity";
import { MeasureTools } from "../MeasureTools.js";

import type { FormatDefinition, FormatProps, FormatSpecHandle, FormatterSpec} from "@szewtwin/core-quantity";
export namespace FormatterUtils {
  const bearingUnitSystems = ["metric", "imperial", "usCustomary", "usSurvey"] as const;
  const bearingRegistrationPromises = new Map<string, Promise<void>>();

  /**
   * Gets a FormatterSpec by KoQ string with fallback to QuantityType.
   * @param koqString The Kind of Quantity string to look up.
   * @param fallbackQuantityType The QuantityType to use if KoQ lookup fails.
   * @returns A FormatterSpec or undefined if both lookups fail.
   */
  export function getFormatterSpecWithFallback(koqString: string, persistenceUnitName: string, fallbackQuantityType: QuantityType): FormatterSpec | undefined {
    const koqEntry = IVaultApp.quantityFormatter.getSpecsByNameAndUnit({ name: koqString, persistenceUnitName });
    if (koqEntry) {
      return koqEntry.formatterSpec;
    }

    // Fallback to QuantityType
    return IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(fallbackQuantityType);
  }

  /** Returns the handle's formatterSpec, falling back to QuantityType if the handle couldn't resolve its KoQ. */
  export function getSpecFromHandle(handle: FormatSpecHandle, fallback: QuantityType): FormatterSpec | undefined {
    return handle.formatterSpec ?? IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(fallback);
  }

  /** Formats a sequence of values with spec without the unit label */
  function formatValuesWithNoUnitLabel(values: number[], spec: FormatterSpec): string {
    const oldFormatTraits = spec.format.formatTraits;

    spec.format.formatTraits &= ~FormatTraits.ShowUnitLabel; // Bit-wise remove ShowUnitLabel trait if exists
    const strs = values.map((value) => IVaultApp.quantityFormatter.formatQuantity(value, spec));
    spec.format.formatTraits = oldFormatTraits; // Restore original format traits

    return strs.join(", ");
  }

  export async function formatCoordinates(point: Point3d): Promise<string> {
    const coordSpec =
      await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
        QuantityType.Coordinate
      );
    return formatCoordinatesImmediate(point, coordSpec);
  }

  export function formatCoordinatesImmediate(point: Point3d, coordSpec?: FormatterSpec): string {
    if (!coordSpec) {
      coordSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.Coordinate
        );
    }
    if (undefined === coordSpec) return "";

    return formatValuesWithNoUnitLabel([point.x, point.y, point.z], coordSpec);
  }

  export async function formatCoordinatesXY(point: XAndY): Promise<string> {
    const coordSpec =
      await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
        QuantityType.Coordinate
      );
    return formatCoordinatesXYImmediate(point, coordSpec);
  }

  export function formatCoordinatesXYImmediate(point: XAndY, coordSpec?: FormatterSpec): string {
    if (!coordSpec) {
      coordSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.Coordinate
        );
    }
    if (undefined === coordSpec) return "";

    return formatValuesWithNoUnitLabel([point.x, point.y], coordSpec);
  }

  /** Formats the input angle into DD°MM'SS.SS" format.
   * NOTE: uses the same symbols as the IVaultApp's quantityFormatter for minute and second.
   * The minute symbol is an apostrophe ' while it should be a prime (\u2032)
   * The second symbol is a quotation mark " while it should be a double prime (\u2033)
   */
  export function formatAngleToDMS(angleInDegrees: number): string {
    const isNegative = angleInDegrees < 0;
    angleInDegrees = Math.abs(angleInDegrees);

    const d = Math.trunc(angleInDegrees);
    const m = Math.abs(Math.trunc((angleInDegrees - d) * 60));
    const s = Math.abs(((angleInDegrees - d) * 60 - m) * 60);

    let str = isNegative ? "-" : "";
    str += d;
    str += "\xB0";
    str += `00${m}`.slice(-2);
    str += "\u0027";
    str += `00000${s.toFixed(2)}`.slice(-5);
    str += "\u0022";
    return str;
  }

  export function formatCartographicToLatLongDMS(c: Cartographic): string {
    const latSuffixKey =
      0 < c.latitude
        ? "MeasureTools:Generic.latitudeNorthSuffix"
        : "MeasureTools:Generic.latitudeSouthSuffix";
    const longSuffixKey =
      0 < c.longitude
        ? "MeasureTools:Generic.longitudeEastSuffix"
        : "MeasureTools:Generic.longitudeWestSuffix";

    let str = FormatterUtils.formatAngleToDMS(Math.abs(c.latitudeDegrees));
    str += MeasureTools.localization.getLocalizedString(latSuffixKey);
    str += ", ";
    str += FormatterUtils.formatAngleToDMS(Math.abs(c.longitudeDegrees));
    str += MeasureTools.localization.getLocalizedString(longSuffixKey);
    return str;
  }

  export async function formatCartographicToLatLong(
    c: Cartographic, angleSpec?: FormatterSpec
  ): Promise<string> {
    if (!angleSpec) {
      angleSpec =
        await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
          QuantityType.LatLong
        );
    }
    return formatCartographicToLatLongImmediate(c, angleSpec);
  }

  export function formatCartographicToLatLongImmediate(
    c: Cartographic,
    angleSpec?: FormatterSpec
  ): string {
    if (!angleSpec) {
      angleSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.LatLong
        );
    }
    if (undefined === angleSpec) return "";

    const latSuffixKey =
      0 < c.latitude
        ? "MeasureTools:Generic.latitudeNorthSuffix"
        : "MeasureTools:Generic.latitudeSouthSuffix";
    const longSuffixKey =
      0 < c.longitude
        ? "MeasureTools:Generic.longitudeEastSuffix"
        : "MeasureTools:Generic.longitudeWestSuffix";

    let str = IVaultApp.quantityFormatter.formatQuantity(
      Math.abs(c.latitude),
      angleSpec
    );
    str += MeasureTools.localization.getLocalizedString(latSuffixKey);
    str += ", ";
    str += IVaultApp.quantityFormatter.formatQuantity(
      Math.abs(c.longitude),
      angleSpec
    );
    str += MeasureTools.localization.getLocalizedString(longSuffixKey);
    return str;
  }

  export function formatSlope(
    slopeInPercent: number,
    withSlopeRatio: boolean
  ): string {

    const fSlope = `${slopeInPercent.toFixed(2)}%`;

    if (!withSlopeRatio || 0.0 === slopeInPercent)
      return fSlope;

    const oneOverSlope = 100.0 / Math.abs(slopeInPercent);
    const sign = slopeInPercent < 0.0 ? "-" : "";
    const fSlopeRatio = `${sign}1 : ${oneOverSlope.toFixed(3)}`;

    return `${fSlope} (${fSlopeRatio})`;
  }

  export async function formatStation(station: number, stationSpec?: FormatterSpec): Promise<string> {
    if (!stationSpec) {
      stationSpec =
        await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
          QuantityType.Stationing
        );
    }
    return formatStationImmediate(station, stationSpec);
  }

  export function formatStationImmediate(station: number, stationSpec?: FormatterSpec): string {
    if (!stationSpec) {
      stationSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.Stationing
        );
    }
    return stationSpec ? IVaultApp.quantityFormatter.formatQuantity(station, stationSpec) : station.toString();
  }

  export async function formatLength(length: number, lengthSpec?: FormatterSpec): Promise<string> {
    if (!lengthSpec) {
      lengthSpec =
        await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
          QuantityType.LengthEngineering
        );
    }
    return formatLengthImmediate(length, lengthSpec);
  }

  export function formatLengthImmediate(length: number, lengthSpec?: FormatterSpec): string {
    if (!lengthSpec) {
      lengthSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.LengthEngineering
        );
    }
    return lengthSpec ? IVaultApp.quantityFormatter.formatQuantity(length, lengthSpec) : length.toString();
  }

  export async function formatAngle(angle: number, angleSpec?: FormatterSpec): Promise<string> {
    if (!angleSpec) {
      angleSpec =
        await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
          QuantityType.Angle
        );
    }
    return formatAngleImmediate(angle, angleSpec);
  }

  export function formatAngleImmediate(angle: number, angleSpec?: FormatterSpec): string {
    if (!angleSpec) {
      angleSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.Angle
        );
    }
    return angleSpec ? IVaultApp.quantityFormatter.formatQuantity(angle, angleSpec) : angle.toString();
  }

  export async function formatArea(area: number, areaSpec?: FormatterSpec): Promise<string> {
    if (!areaSpec) {
      areaSpec =
        await IVaultApp.quantityFormatter.getFormatterSpecByQuantityType(
          QuantityType.Area
        );
    }
    return formatAreaImmediate(area, areaSpec);
  }

  export function formatAreaImmediate(area: number, areaSpec?: FormatterSpec): string {
    if (!areaSpec) {
      areaSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          QuantityType.Area
        );
    }
    return areaSpec ? IVaultApp.quantityFormatter.formatQuantity(area, areaSpec) : area.toString();
  }

  /**
   * @returns The bearing in radians, where 0 is North and π/2 is East.
   */
  export function calculateBearing(dx: number, dy: number): number {
    let bearing = Math.atan2(dx, dy); // radians, 0 = North, π/2 = East
    if (bearing < 0) bearing += 2 * Math.PI; // Normalize to [0, 2π)
    return bearing;
  }

  async function getBearingFormatProps(bearingKoQ: string, system?: (typeof bearingUnitSystems)[number]): Promise<FormatDefinition> {
    try {
      const formatProps = await IVaultApp.formatsProvider.getFormat(bearingKoQ, system);
      if (formatProps) {
        return formatProps;
      }
    } catch {
      // fall through to non-system lookup / default format
    }

    try {
      const formatProps = await IVaultApp.formatsProvider.getFormat(bearingKoQ);
      if (formatProps) {
        return formatProps;
      }
    } catch {
      // fall through to default format
    }

    return getDefaultBearingFormatProps();
  }

  async function registerBearingFormatSpecs(bearingKoQ: string, persistenceUnitName: string): Promise<void> {
    for (const system of bearingUnitSystems) {
      const formatProps = await getBearingFormatProps(bearingKoQ, system);
      await IVaultApp.quantityFormatter.addFormattingSpecsToRegistry({
        name: bearingKoQ,
        persistenceUnitName,
        formatProps,
        system,
      });
    }
  }

  export async function ensureBearingFormatSpecsRegistered(bearingKoQ: string, persistenceUnitName: string): Promise<void> {
    const key = `${bearingKoQ}|${persistenceUnitName}`;
    let promise = bearingRegistrationPromises.get(key);
    if (!promise) {
      promise = registerBearingFormatSpecs(bearingKoQ, persistenceUnitName).catch((err) => {
        bearingRegistrationPromises.delete(key);
        throw err;
      });
      bearingRegistrationPromises.set(key, promise);
    }

    await promise;
  }

  /**
   * Creates a FormatterSpec for bearing using the provided KoQ string with fallback to default bearing format.
   * @param bearingKoQ The Kind of Quantity string for bearing.
   * @param persistenceUnitName The persistence unit name for the bearing.
   * @returns A FormatterSpec for bearing formatting.
   */
  export async function getBearingFormatterSpec(bearingKoQ: string, persistenceUnitName: string): Promise<FormatterSpec | undefined> {
    const formatProps = await getBearingFormatProps(bearingKoQ);

    // Create and return the formatter spec
    return IVaultApp.quantityFormatter.createFormatterSpec({
      persistenceUnitName,
      formatProps
    });
  }

  export function getDefaultBearingFormatProps(): FormatProps {
    return {
      minWidth: 2,
      precision: 0,
      type: "Bearing",
      revolutionUnit: "Units.REVOLUTION",
      formatTraits: ["showUnitLabel"],
      uomSeparator: "",
      composite: {
        includeZero: true,
        spacer: "",
        units: [
          { name: "Units.ARC_DEG", label: "°" },
          { name: "Units.ARC_MINUTE", label: "'" },
          { name: "Units.ARC_SECOND", label: "\"" },
        ],
      },
    };
  }
}
