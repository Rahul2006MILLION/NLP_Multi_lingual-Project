// Starts the FastAPI backend and the Vite frontend together; Ctrl+C stops both.
// Set PYTHON to choose the interpreter (e.g. PYTHON=.venv/bin/python npm run dev).
import { spawn } from "node:child_process";

const python = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const apiPort = process.env.API_PORT || "8000";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const procs = [
  ["api", python, ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", apiPort, "--reload", "--reload-dir", "backend"], {}],
  ["web", npm, ["--prefix", "frontend", "run", "dev"], { VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || `http://127.0.0.1:${apiPort}` }],
].map(([name, cmd, args, env]) => {
  const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } });
  const tag = `[${name}]`;
  const pipe = (stream, out) => stream.on("data", (b) => b.toString().split(/\r?\n/).filter(Boolean).forEach((l) => out.write(`${tag} ${l}\n`)));
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on("exit", (code) => {
    console.log(`${tag} exited with code ${code}`);
    shutdown(code ?? 0);
  });
  p.on("error", (e) => {
    console.error(`${tag} failed to start: ${e.message}`);
    shutdown(1);
  });
  return p;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => !p.killed && p.kill("SIGTERM"));
  setTimeout(() => process.exit(code), 300);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
