import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
  canFetchWeather,
  getTripDayWeatherForecast,
} from "@/features/planner/api/weather.api";

interface UseTripDayWeatherParams {
  destination?: string;
  dayDateIso?: string;
}

export function useTripDayWeather({
  destination,
  dayDateIso,
}: UseTripDayWeatherParams) {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["trip-day-weather", destination, dayDateIso],
    queryFn: () =>
      getTripDayWeatherForecast({
        destination: destination!,
        dayDateIso: dayDateIso!,
      }),
    enabled: Boolean(
      destination &&
        dayDateIso &&
        canFetchWeather() &&
        isLoaded &&
        isSignedIn,
    ),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
  });
}
