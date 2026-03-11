import { apiClient } from "@/lib/axios";

export interface DestinationCity {
  idKey: string;
  name: string;
  nameEn: string;
  timezone: string;
}

export interface DestinationCountry {
  idKey: string;
  name: string;
  nameEn: string;
  flagEmoji?: string;
  isSupported: boolean;
  cities: DestinationCity[];
}

export async function fetchDestinations(): Promise<DestinationCountry[]> {
  const res = await apiClient.get<{
    success: boolean;
    countries: DestinationCountry[];
  }>("/destinations");
  return res.data.countries ?? [];
}
