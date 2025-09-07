export type Model = { id: string; name: string; type: "base"|"finetuned"; version: string; tags?: string[] };

export const modelsMock: Model[] = [
  { id: "m_llama3_8b", name: "Llama3", type: "base", version: "8B", tags: ["meta"] },
  { id: "m_qwen2_7b", name: "Qwen2.5", type: "base", version: "7B", tags: ["alibaba"] },
  { id: "m_ft_101", name: "Chat QA Custom", type: "finetuned", version: "v1", tags: ["chat", "english"] },
];

