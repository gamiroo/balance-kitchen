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
  toHaveAttribute(
    received: { attributes?: Record<string, unknown> | undefined } | null | undefined,
    attribute: string,
    value?: unknown,
  ): MatcherResult {
    const attributes = received?.attributes;
    const hasAttribute = attributes !== undefined && attribute in attributes;
    const pass = hasAttribute && (value === undefined || attributes[attribute] === value);
    return {
      message: () =>
        `expected element${pass ? ' not' : ''} to have attribute \"${attribute}\"${value !== undefined ? ` with value ${value}` : ''}`,
      pass,
    };
  },
  toBeInTheDocument(received: unknown): MatcherResult {
    const pass = received != null;
    return {
      message: () => `expected element${pass ? ' not' : ''} to be in the document`,
      pass,
    };
  },
});
