// Supabase removed — all data comes from our API
export const supabase = {
  from: () => ({
    select: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }),
    insert: () => ({ data: null, error: null }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
} as any;
