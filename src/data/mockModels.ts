import type { FeedItem } from '../feed/types';
export const mockModels = {
  version: 1,
  collection: { id: 'models', title: 'Models' },
  items: ['Alex', 'Morgan', 'Taylor', 'Jordan', 'Robin', 'Casey', 'Jamie'].map((title, index): FeedItem => ({
    id: `model-${String(index + 1).padStart(3, '0')}`, type: 'image', title,
    mediaUrl: `/media/images/model-${index + 1}.jpg`, width: 900, height: 1350,
  })),
};
