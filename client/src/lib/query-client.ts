import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The app's own NetworkFirst service-worker strategy (Step 3) already
      // handles the offline-read case at the network layer; React Query's
      // job here is just sane client-side cache behavior on top of that,
      // not a second offline strategy competing with the first.
      staleTime: 60 * 1000,
      retry: 1
    }
  }
})
