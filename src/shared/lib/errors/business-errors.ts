// src/lib/errors/business-errors.ts
export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export class InsufficientBalanceError extends BusinessError {
  constructor(available: number, requested: number) {
    super(
      'INSUFFICIENT_BALANCE',
      `Insufficient meal balance. Available: ${available}, Requested: ${requested}`,
      400
    )
    this.name = 'InsufficientBalanceError'
  }
}

export class PackExpiredError extends BusinessError {
  constructor() {
    super('PACK_EXPIRED', 'Meal pack has expired', 400)
    this.name = 'PackExpiredError'
  }
}
