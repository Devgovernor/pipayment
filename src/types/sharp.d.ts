declare module 'sharp' {
  interface Sharp {
    metadata(): Promise<{
      width?: number;
      height?: number;
      format?: string;
      size?: number;
      channels?: number;
    }>;
    composite(images: Array<{
      input: Buffer | string;
      top?: number;
      left?: number;
      gravity?: string;
    }>): Sharp;
    toBuffer(): Promise<Buffer>;
  }

  function sharp(input?: Buffer | string): Sharp;
  export = sharp;
}