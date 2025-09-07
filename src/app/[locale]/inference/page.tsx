"use client";
import {useModels} from "@/lib/hooks/useModels";
import {useState} from "react";

export default function InferencePage() {
  const {loading, data: models} = useModels();
  const [model, setModel] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);

  function runMock() {
    if (!model || !prompt) return;
    setRunning(true);
    setOutput("");
    setTimeout(() => {
      setOutput(`Mock response (model=${model}, temp=${temperature}):\n` + prompt.split("").reverse().join(""));
      setRunning(false);
    }, 700);
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Inference</h1>
        <p className="text-muted-foreground">Run prompts against models (mock).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 space-y-3 md:col-span-1">
          <div className="space-y-2">
            <label className="text-sm">Model</label>
            <select
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              disabled={loading}
              value={model}
              onChange={(e)=>setModel(e.target.value)}
            >
              <option value="">{loading ? "Loading..." : "Select a model"}</option>
              {models.map(m => (
                <option key={m.id} value={m.name}>{m.name} ({m.version})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Temperature: {temperature.toFixed(2)}</label>
            <input type="range" min={0} max={1} step={0.01} value={temperature} onChange={(e)=>setTemperature(Number(e.target.value))} />
          </div>
          <button
            onClick={runMock}
            disabled={!model || !prompt || running}
            className="h-9 rounded-md bg-primary text-primary-foreground px-3 text-sm disabled:opacity-50"
          >
            {running ? "Running..." : "Run"}
          </button>
        </div>

        <div className="rounded-lg border p-4 space-y-2 md:col-span-2">
          <label className="text-sm">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e)=>setPrompt(e.target.value)}
            rows={8}
            placeholder="Enter your prompt here"
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
          <div>
            <label className="text-sm">Output</label>
            <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm min-h-24">{output || "(no output)"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

