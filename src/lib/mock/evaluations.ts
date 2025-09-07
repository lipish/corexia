export type Evaluation = { id: string; dataset: string; model: string; metric: string; score: number; createdAt: string };

export const evaluationsMock: Evaluation[] = [
  { id: "ev_1", dataset: "Chat QA", model: "Chat QA Custom", metric: "Accuracy", score: 0.86, createdAt: "2025-09-01" },
  { id: "ev_2", dataset: "Customer Support", model: "Llama3", metric: "BERScore", score: 0.73, createdAt: "2025-09-03" },
];

