import { useQuery } from '@tanstack/react-query';
import { getNearbyPlaces } from '@/api/map.api';

export const useNearbyPlaces = ({ lat, lng, type, radius = 3000 } = {}) => {
  return useQuery({
    queryKey: ['map', 'nearby', lat?.toFixed(3), lng?.toFixed(3), radius, type],
    queryFn: () => getNearbyPlaces({ lat, lng, type, radius }),
    enabled: !!lat && !!lng && !!type,
    staleTime: 1000 * 60 * 5,
    select: (data) => data?.places || [],
  });
};
