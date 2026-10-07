import { useQuery } from '@tanstack/react-query'
import { fetchFilterOptions } from '@/api/endpoints'

/** Fetched once at boot and cached for the session: venues, formats, ticket types, seat cap, hold length. */
export const useFilterOptions = () =>
  useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: Infinity,
    gcTime: Infinity,
  })
