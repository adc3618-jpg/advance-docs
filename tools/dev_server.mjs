#!/usr/bin/env node
/**
 * 문서 HTML 미리보기용 개발 서버 (Node 18+, 외부 패키지 없음).
 *
 * 저장소 루트를 정적으로 서비스하고, 파일(.html/.css/.js/이미지 등)이 바뀌면
 * 브라우저를 자동으로 새로고침한다. HTML 응답에 라이브 리로드 스크립트를 주입하므로
 * 문서 파일 자체는 수정하지 않는다.
 *
 * 사용법:
 *   node tools/dev_server.mjs                  # http://localhost:4000 (저장소 루트)
 *   node tools/dev_server.mjs --port 5000
 *   node tools/dev_server.mjs --dir roadmap    # 특정 폴더를 루트로 서비스
 *
 * 127.0.0.1 에만 바인딩한다 (같은 PC에서만 접속 가능).
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
};

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(repoRoot, opt("--dir", "."));
const port = Number(opt("--port", 4000));

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`디렉터리를 찾을 수 없습니다: ${root}`);
  process.exit(1);
}

const clients = new Set();

const RELOAD_SNIPPET = `
<script>
  (() => {
    const es = new EventSource("/__reload");
    es.addEventListener("reload", () => location.reload());
    es.onerror = () => { es.close(); setTimeout(() => location.reload(), 1000); };
  })();
</script>`;

const inject = (html) =>
  /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${RELOAD_SNIPPET}</body>`) : html + RELOAD_SNIPPET;

/** URL 경로를 root 아래 실제 파일 경로로 변환. root 밖으로 나가면 null. */
function resolvePath(urlPath) {
  const rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const abs = path.resolve(root, rel);
  return abs === root || abs.startsWith(root + path.sep) ? abs : null;
}

function listing(dir, urlPath) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .map((e) => {
      const name = e.name + (e.isDirectory() ? "/" : "");
      return `<li><a href="${path.posix.join(urlPath, name)}">${name}</a></li>`;
    });
  const up = urlPath !== "/" ? `<li><a href="${path.posix.join(urlPath, "..")}/">../</a></li>` : "";
  return `<!doctype html><meta charset="utf-8"><title>${urlPath}</title>
<body style="font:15px/1.8 system-ui;padding:24px"><h2>${urlPath}</h2><ul>${up}${items.join("")}</ul></body>`;
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let file = resolvePath(pathname);
  if (!file) { res.writeHead(403).end("Forbidden"); return; }

  try {
    let stat = fs.statSync(file);
    if (stat.isDirectory()) {
      const index = path.join(file, "index.html");
      if (fs.existsSync(index)) { file = index; stat = fs.statSync(file); }
      else {
        const urlPath = pathname.endsWith("/") ? pathname : pathname + "/";
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        res.end(inject(listing(file, urlPath)));
        return;
      }
    }
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const headers = { "Content-Type": type, "Cache-Control": "no-store" };
    if (ext === ".html") {
      res.writeHead(200, headers);
      res.end(inject(fs.readFileSync(file, "utf8")));
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(res);
    }
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not Found");
  }
});

// 파일 변경 감지 → 연결된 브라우저에 reload 이벤트 전송 (연속 변경은 한 번으로 묶는다)
let timer;
const ignored = (f) => !f || /(^|[\\/])(\.git|node_modules|\.idea)([\\/]|$)/.test(f);
fs.watch(root, { recursive: true }, (_event, filename) => {
  if (ignored(filename)) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`변경 감지: ${filename} → 새로고침`);
    for (const c of clients) c.write("event: reload\ndata: 1\n\n");
  }, 100);
});

server.on("error", (err) => {
  console.error(err.code === "EADDRINUSE" ? `포트 ${port} 가 이미 사용 중입니다. --port 로 다른 포트를 지정하세요.` : err);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () => {
  console.log(`개발 서버 실행 중: http://localhost:${port}  (루트: ${path.relative(process.cwd(), root) || "."})`);
  console.log("종료: Ctrl+C");
});
