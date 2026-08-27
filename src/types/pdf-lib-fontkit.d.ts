declare module "@pdf-lib/fontkit" {
  const fontkit: {
    // pdf-lib Fontkit.create returns a Font instance; the vendor types omit a default export.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create(buffer: Uint8Array, postscriptName?: string): any;
  };
  export default fontkit;
}

