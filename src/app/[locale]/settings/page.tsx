"use client";
import {useState} from "react";

export default function SettingsPage() {
  const [provider, setProvider] = useState("OpenAI");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(()=>setSaved(false), 1200);
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Provider and API key configuration (mock).</p>
      </div>
      <div className="rounded-lg border p-4 space-y-3 max-w-xl">
        <div className="space-y-1">
          <label className="text-sm">Provider</label>
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={provider} onChange={(e)=>setProvider(e.target.value)}>
            <option>OpenAI</option>
            <option>Azure OpenAI</option>
            <option>Anthropic</option>
            <option>Local/Ollama</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm">API Key</label>
          <input className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={apiKey} onChange={(e)=>setApiKey(e.target.value)} placeholder="sk-..." />
        </div>
        <button onClick={save} className="h-9 rounded-md bg-primary text-primary-foreground px-3 text-sm">Save</button>
        {saved && <div className="text-green-600 text-sm">Saved (mock)</div>}
      </div>
    </div>
  );
}

