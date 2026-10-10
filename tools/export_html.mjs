#!/usr/bin/env node
/**
 * 문서 HTML을 단독 실행 가능한 단일 HTML 파일로 내보낸다 (Node 18+, 외부 패키지 없음).
 *
 * 공통 CSS(common.css 등)를 참고해 작성한 문서를 외부 파일 없이 하나의 .html 로 만든다.
 *   - <link rel="stylesheet" href="로컬.css">  → <style> 로 인라인 (css 안의 @import / url() 도 재귀 처리)
 *   - <script src="로컬.js">                   → 인라인 <script>
 *   - <img src>, css url() 의 로컬 이미지/폰트   → data URI
 *   - http(s):// 로 시작하는 외부 리소스         → 기본은 그대로 둔다. --inline-remote 로 받아서 인라인
 *
 * 사용법:
 *   node tools/export_html.mjs docs/my-doc.html                 # → docs/my-doc.standalone.html
 *   node tools/export_html.mjs docs/my-doc.html -o out/doc.html
 *   node tools/export_html.mjs docs/my-doc.html --inline-remote  # 웹폰트 등 외부 CSS까지 포함(오프라인용)
 */
import fs from "node:fs";
import path from "node:path";

const MIME = {
  ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
};

const isRemote = (u) => /^(https?:)?\/\//.test(u);
const skip = (u) => !u || /^(data:|#|mailto:|javascript:)/.test(u);
const isUrl = (b) => /^https?:\/\//.test(b);

/** String.replace 의 비동기 버전 (콜백이 Promise 를 반환할 수 있다). */
async function replaceAsync(str, re, fn) {
  const matches = [...str.matchAll(re)];
  const results = await Promise.all(matches.map((m) => fn(...m)));
  let i = 0;
  return str.replace(re, () => results[i++]);
}

/** { data: Buffer, loc, base } 반환. base 는 로컬 디렉터리 경로 또는 URL 문자열. */
async function fetchRef(ref, base) {
  if (isUrl(base) || isRemote(ref)) {
    const url = ref.startsWith("//") ? "https:" + ref : isUrl(base) ? new URL(ref, base).href : ref;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: Buffer.from(await res.arrayBuffer()), loc: url, base: new URL(".", url).href };
  }
  const file = path.resolve(base, decodeURI(ref.split(/[?#]/)[0]));
  return { data: fs.readFileSync(file), loc: file, base: path.dirname(file) };
}

const warn = (msg) => console.error(`경고: ${msg}`);

async function dataUri(ref, base, remote) {
  if (skip(ref) || (isRemote(ref) && !remote)) return ref;
  try {
    const { data, loc } = await fetchRef(ref, base);
    const ext = path.extname(loc.split(/[?#]/)[0]).toLowerCase();
    return `data:${MIME[ext] || "application/octet-stream"};base64,${data.toString("base64")}`;
  } catch (e) {
    warn(`${ref} 를 읽지 못해 그대로 둡니다 (${e.message})`);
    return ref;
  }
}

async function inlineCss(css, base, remote) {
  css = await replaceAsync(
    css,
    /@import\s+(url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])[^;]*;/g,
    async (whole, _g1, g2, g3) => {
      const ref = g2 || g3;
      if (skip(ref) || (isRemote(ref) && !remote)) return whole;
      try {
        const r = await fetchRef(ref, base);
        return await inlineCss(r.data.toString("utf-8"), r.base, remote);
      } catch (e) {
        warn(`@import ${ref} 실패 (${e.message})`);
        return whole;
      }
    },
  );
  return replaceAsync(css, /url\(\s*(['"]?)([^'")]+)\1\s*\)/g, async (_w, _q, ref) =>
    `url("${await dataUri(ref, base, remote)}")`);
}

async function exportHtml(src, remote = false) {
  let html = fs.readFileSync(src, "utf-8");
  const base = path.dirname(path.resolve(src));

  html = await replaceAsync(html, /<link\b[^>]*>/gi, async (tag) => {
    if (!/rel\s*=\s*['"]?stylesheet/i.test(tag)) return tag;
    const h = tag.match(/href\s*=\s*['"]([^'"]+)['"]/i);
    if (!h || skip(h[1]) || (isRemote(h[1]) && !remote)) return tag;
    const r = await fetchRef(h[1], base);
    return `<style>\n${await inlineCss(r.data.toString("utf-8"), r.base, remote)}\n</style>`;
  });

  html = await replaceAsync(html, /<script\b([^>]*)>\s*<\/script>/gi, async (whole, attrs) => {
    const s = attrs.match(/src\s*=\s*['"]([^'"]+)['"]/i);
    if (!s || skip(s[1]) || (isRemote(s[1]) && !remote)) return whole;
    const { data } = await fetchRef(s[1], base);
    const rest = attrs.replace(/\s*src\s*=\s*['"][^'"]+['"]/i, "");
    return `<script${rest}>\n${data.toString("utf-8").replaceAll("</script", "<\\/script")}\n</script>`;
  });

  html = await replaceAsync(
    html,
    /(<(?:img|source|image)\b[^>]*?\bsrc\s*=\s*)['"]([^'"]+)['"]/gi,
    async (_w, head, ref) => `${head}"${await dataUri(ref, base, remote)}"`,
  );

  // 인라인 <style> 안의 url() 처리
  return replaceAsync(html, /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, async (_w, open, css, close) =>
    open + (await inlineCss(css, base, remote)) + close);
}

async function main() {
  const args = process.argv.slice(2);
  let src, out, remote = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-o" || args[i] === "--out") out = args[++i];
    else if (args[i] === "--inline-remote") remote = true;
    else if (!src) src = args[i];
  }
  if (!src) {
    console.error("사용법: node tools/export_html.mjs <문서.html> [-o 출력.html] [--inline-remote]");
    process.exit(1);
  }
  out ??= src.replace(/\.html?$/i, "") + ".standalone.html";
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, await exportHtml(src, remote), "utf-8");
  console.log(`생성: ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
