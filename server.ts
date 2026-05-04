import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API to download repository source code
  app.get("/api/download", async (req, res) => {
    const repoUrl = req.query.url as string;
    
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    try {
      // Basic GitHub URL parsing
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub URL. Only GitHub URLs are supported." });
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, "");

      // GitHub API endpoint for downloading the default branch (HEAD)
      const headZipUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/zipball/HEAD`;

      const response = await fetch(headZipUrl, {
        headers: {
          "User-Agent": "RepoVault-App"
        },
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`GitHub responded with ${response.status}: ${response.statusText}`);
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${cleanRepo}-source.zip"`);

      if (response.body) {
        // Stream the response directly to the client
        // @ts-ignore
        const stream = Readable.fromWeb(response.body);
        stream.pipe(res);
      } else {
        res.status(500).json({ error: "No stream body available from GitHub" });
      }
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download repository." });
    }
  });

  // API to get repository file tree
  app.get("/api/repo-tree", async (req, res) => {
    const repoUrl = req.query.url as string;
    if (!repoUrl) return res.status(400).json({ error: "URL is required" });
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=1`, {
        headers: { "User-Agent": "RepoVault-App" }
      });
      if (!response.ok) throw new Error(`GitHub responded with ${response.status}: ${response.statusText}`);
      const data = await response.json();
      res.json(data.tree);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API to get a specific file from the repository
  app.get("/api/repo-file", async (req, res) => {
    const repoUrl = req.query.url as string;
    const filePath = req.query.path as string;
    if (!repoUrl || !filePath) return res.status(400).json({ error: "Missing url or path" });
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    try {
      const response = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/HEAD/${filePath}`, {
        headers: { "User-Agent": "RepoVault-App" }
      });
      if (!response.ok) throw new Error("File not found");
      const text = await response.text();
      res.send(text);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
