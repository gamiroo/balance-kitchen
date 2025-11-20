import { expect } from '@jest/globals';

type MatcherResult = {
  message: () => string;
  pass: boolean;
};

declare module 'expect' {
  interface AsymmetricMatchers {
    toHaveAttribute(attribute: string, value?: unknown): void;
    toBeInTheDocument(): void;
  }
  interface Matchers<R> {
    toHaveAttribute(attribute: string, value?: unknown): R;
    toBeInTheDocument(): R;
  }
}

expect.extend({
  toHaveAttribute(received: any, attribute: string, value?: unknown): MatcherResult {
    const hasAttribute = received && received.attributes && attribute in received.attributes;
    const pass = hasAttribute && (value === undefined || received.attributes[attribute] === value);
    return {
      message: () =>
        `expected element${pass ? ' not' : ''} to have attribute \"${attribute}\"${value !== undefined ? ` with value ${value}` : ''}`,
      pass,
    };
  },
  toBeInTheDocument(received: any): MatcherResult {
    const pass = received != null;
    return {
      message: () => `expected element${pass ? ' not' : ''} to be in the document`,
      pass,
    };
  },
});
