import { api, isApiOffline } from '../lib/api';

export async function nudgeSeller(
  dealId: string,
  sellerId: string,
  message?: string
): Promise<boolean> {
  try {
    if (isApiOffline()) throw new Error('offline');
    await api.post('/api/notify', {
      sellerId,
      dealId,
      message: message || 'Please follow up on this deal ASAP.',
    });
    return true;
  } catch {
    return false;
  }
}
