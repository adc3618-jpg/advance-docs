#!/usr/bin/env python3
"""문서 HTML을 단독 실행 가능한 단일 HTML 파일로 내보낸다 (표준 라이브러리만 사용).

공통 CSS(common.css 등)를 참고해 작성한 문서를 외부 파일 없이 하나의 .html 로 만든다.
  - <link rel="stylesheet" href="로컬.css">  → <style> 로 인라인 (css 안의 @import / url() 도 재귀 처리)
  - <script src="로컬.js">                   → 인라인 <script>
  - <img src>, css url() 의 로컬 이미지/폰트   → data URI
  - http(s):// 로 시작하는 외부 리소스         → 기본은 그대로 둔다. --inline-remote 로 받아서 인라인

사용법:
  python3 tools/export_html.py docs/my-doc.html                 # → docs/my-doc.standalone.html
  python3 tools/export_html.py docs/my-doc.html -o out/doc.html
  python3 tools/export_html.py docs/my-doc.html --inline-remote  # 웹폰트 등 외부 CSS까지 포함(오프라인용)
"""
import argparse, base64, mimetypes, re, sys, urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

def is_remote(u): return u.startswith(("http://", "https://", "//"))
def skip(u): return not u or u.startswith(("data:", "#", "mailto:", "javascript:"))

def fetch(ref, base, remote):
    """(bytes, 새 base) 반환. base 는 Path(로컬) 또는 str(URL)."""
    if isinstance(base, str) or is_remote(ref):
        url = urljoin(base, ref) if isinstance(base, str) else (("https:" + ref) if ref.startswith("//") else ref)
        with urllib.request.urlopen(url) as r:
            return r.read(), url
    path = (base / urlparse(ref).path).resolve()
    return path.read_bytes(), path

def data_uri(ref, base, remote):
    if skip(ref) or (is_remote(ref) and not remote):
        return ref
    try:
        data, loc = fetch(ref, base, remote)
    except Exception as e:
        print(f"경고: {ref} 를 읽지 못해 그대로 둡니다 ({e})", file=sys.stderr)
        return ref
    mime = mimetypes.guess_type(str(loc).split("?")[0])[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(data).decode()}"

def inline_css(css, base, remote):
    def imp(m):
        ref = m.group(2) or m.group(3)
        if skip(ref) or (is_remote(ref) and not remote): return m.group(0)
        try:
            data, loc = fetch(ref, base, remote)
        except Exception as e:
            print(f"경고: @import {ref} 실패 ({e})", file=sys.stderr); return m.group(0)
        return inline_css(data.decode("utf-8"), loc.parent if isinstance(loc, Path) else loc, remote)
    css = re.sub(r"""@import\s+(url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])[^;]*;""", imp, css)
    return re.sub(r"""url\(\s*(['"]?)([^'")]+)\1\s*\)""",
                  lambda m: f'url("{data_uri(m.group(2), base, remote)}")', css)

def export(src: Path, remote=False):
    html = src.read_text(encoding="utf-8")
    base = src.parent

    def link(m):
        tag = m.group(0)
        if not re.search(r"""rel\s*=\s*['"]?stylesheet""", tag, re.I): return tag
        h = re.search(r"""href\s*=\s*['"]([^'"]+)['"]""", tag, re.I)
        if not h or skip(h.group(1)) or (is_remote(h.group(1)) and not remote): return tag
        data, loc = fetch(h.group(1), base, remote)
        nb = loc.parent if isinstance(loc, Path) else loc
        return f"<style>\n{inline_css(data.decode('utf-8'), nb, remote)}\n</style>"

    def script(m):
        s = re.search(r"""src\s*=\s*['"]([^'"]+)['"]""", m.group(1), re.I)
        if not s or skip(s.group(1)) or (is_remote(s.group(1)) and not remote): return m.group(0)
        data, _ = fetch(s.group(1), base, remote)
        attrs = re.sub(r"""\s*src\s*=\s*['"][^'"]+['"]""", "", m.group(1))
        body = data.decode("utf-8").replace("</script", "<\\/script")
        return f"<script{attrs}>\n{body}\n</script>"

    def img(m):
        return f'{m.group(1)}"{data_uri(m.group(2), base, remote)}"'

    html = re.sub(r"<link\b[^>]*>", link, html, flags=re.I)
    html = re.sub(r"<script\b([^>]*)>\s*</script>", script, html, flags=re.I)
    html = re.sub(r"""(<(?:img|source|image)\b[^>]*?\bsrc\s*=\s*)['"]([^'"]+)['"]""", img, html, flags=re.I)
    # 인라인 <style> / style="" 안의 url() 처리
    html = re.sub(r"(<style\b[^>]*>)(.*?)(</style>)",
                  lambda m: m.group(1) + inline_css(m.group(2), base, remote) + m.group(3), html, flags=re.S | re.I)
    return html

def main():
    ap = argparse.ArgumentParser(description="문서 HTML을 단독 HTML 파일로 내보내기")
    ap.add_argument("src", type=Path)
    ap.add_argument("-o", "--out", type=Path)
    ap.add_argument("--inline-remote", action="store_true", help="http(s) 외부 리소스도 받아서 인라인")
    a = ap.parse_args()
    out = a.out or a.src.with_suffix(".standalone.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(export(a.src, a.inline_remote), encoding="utf-8")
    print(f"생성: {out} ({out.stat().st_size/1024:.1f} KB)")

if __name__ == "__main__":
    main()
