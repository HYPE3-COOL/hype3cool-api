export class TokenViewedEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId: string,
  ) {}
}

export class TokenLikedEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId: string,
  ) {}
}

export class TokenUnlikedEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId: string,
  ) {}
}

export class TokenBookmarkedEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId: string,
  ) {}
}


export class TokenUnbookmarkedEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId: string,
  ) {}
}
