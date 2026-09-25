import { readInstitutionSettings } from "./institutionSettings";

function toAscii(str: string): string {
  const map: Record<string, string> = {
    "০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9"
  };
  return String(str || "").replace(/[০-৯]/g, (m) => map[m] || m);
}

export interface GeoFields {
  centerId: string;
  districtId: string;
  upazilaId: string;
}

export function buildCenterId(): string {
  const s = readInstitutionSettings();
  const div = toAscii(s.geoDivisionCode || "55").replace(/\D/g, "").padStart(2, "0").slice(-2);
  const dist = toAscii(s.geoDistrictCode || "49").replace(/\D/g, "").padStart(2, "0").slice(-2);
  const upa = toAscii(s.geoUpazilaCode || "52").replace(/\D/g, "").padStart(2, "0").slice(-2);
  const lic = toAscii(s.licenseNo || "02").replace(/\D/g, "").padStart(2, "0").slice(-2);
  return `LSFC${div}${dist}${upa}${lic}`;
}

export function getGeoContext(): GeoFields {
  const s = readInstitutionSettings();
  return {
    centerId: buildCenterId(),
    districtId: toAscii(s.geoDistrictCode || "49").replace(/\D/g, "").padStart(2, "0").slice(-2),
    upazilaId: toAscii(s.geoUpazilaCode || "52").replace(/\D/g, "").padStart(2, "0").slice(-2),
  };
}

export function enrichWithGeo<T extends object>(record: T): T & GeoFields {
  return { ...record, ...getGeoContext() };
}
