export type Finetune = { id: string; baseModel: string; status: "pending"|"running"|"succeeded"|"failed"; updatedAt: string };

export const finetunesMock: Finetune[] = [
  { id: "ft_101", baseModel: "Llama3-8B", status: "succeeded", updatedAt: "2025-09-01" },
  { id: "ft_102", baseModel: "Qwen2.5-7B", status: "running", updatedAt: "2025-09-06" },
  { id: "ft_103", baseModel: "Mistral-7B", status: "pending", updatedAt: "2025-09-05" },
];

