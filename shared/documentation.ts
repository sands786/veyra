export const documentationRoute = "/docs";
export const documentationTeaserAsset = "/manus-storage/veilpay-coming-soon-teaser-with-music_a6a5969d.mp4";

export const documentationChapters = [
  "overview",
  "why",
  "product",
  "privacy",
  "starknet",
  "demo",
] as const;

export const documentationProductSurfaces = [
  "Private payroll",
  "Operations + treasury",
  "Private claims",
  "Launchpad governance",
] as const;

export type DocumentationChapter = (typeof documentationChapters)[number];
