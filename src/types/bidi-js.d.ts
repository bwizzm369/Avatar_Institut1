declare module "bidi-js" {
  export type BidiEmbeddingLevels = {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  };

  export type BidiEngine = {
    getEmbeddingLevels(
      text: string,
      explicitDirection?: "ltr" | "rtl",
    ): BidiEmbeddingLevels;
    getReorderSegments(
      text: string,
      embeddingLevels: BidiEmbeddingLevels,
      start?: number,
      end?: number,
    ): Array<[number, number]>;
    getMirroredCharactersMap(
      text: string,
      embeddingLevels: BidiEmbeddingLevels,
      start?: number,
      end?: number,
    ): Map<number, string>;
  };

  export default function bidiFactory(): BidiEngine;
}
