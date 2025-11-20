import { jest } from '@jest/globals';

export const useSession = () => ({
  data: null,
  status: 'unauthenticated',
});

export const signIn = jest.fn();
export const signOut = jest.fn();
