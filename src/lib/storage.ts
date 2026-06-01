import { StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';

// 🟢 Custom IndexedDB Storage Engine (No 5MB Limit)
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};