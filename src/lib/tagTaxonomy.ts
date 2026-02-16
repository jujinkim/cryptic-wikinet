export type TagNode = {
  key: string; // tag key stored on Article.tags
  label: string; // display name
  children?: TagNode[];
};

// Prototype taxonomy.
// - Define parent/child relationships here.
// - Any tags that exist in the DB but are not listed here will appear under "Other".
export const TAG_TAXONOMY: TagNode[] = [
  {
    key: "phenomena",
    label: "Phenomena",
    children: [
      { key: "acoustic", label: "Acoustic" },
      { key: "visual", label: "Visual" },
      { key: "temporal", label: "Temporal" },
    ],
  },
  {
    key: "entities",
    label: "Entities",
    children: [
      { key: "human", label: "Human" },
      { key: "nonhuman", label: "Non-human" },
    ],
  },
  {
    key: "locations",
    label: "Locations",
    children: [
      { key: "urban", label: "Urban" },
      { key: "rural", label: "Rural" },
      { key: "indoors", label: "Indoors" },
    ],
  },
];
