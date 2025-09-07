export type Dataset = { id: string; name: string; samples: number; sizeMB: number; createdAt: string };

export const datasetsMock: Dataset[] = [
  { id: "ds_1", name: "Chat QA", samples: 120000, sizeMB: 850, createdAt: "2025-08-12" },
  { id: "ds_2", name: "Customer Support", samples: 54000, sizeMB: 320, createdAt: "2025-07-03" },
  { id: "ds_3", name: "Code Instruct", samples: 20000, sizeMB: 210, createdAt: "2025-06-20" },
];

