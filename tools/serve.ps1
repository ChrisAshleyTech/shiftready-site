# Minimal static file server for local development (no Node or Python needed).
# Usage:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 5173]
# Then open http://localhost:5173/
param([int]$Port = 5173)
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$types = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".mjs"="text/javascript; charset=utf-8"
  ".css"="text/css; charset=utf-8"; ".json"="application/json"; ".svg"="image/svg+xml"; ".png"="image/png"
  ".ico"="image/x-icon"; ".txt"="text/plain; charset=utf-8"; ".md"="text/plain; charset=utf-8"; ".webmanifest"="application/manifest+json"
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    $file = Join-Path $root $path
    if ((Test-Path $file -PathType Container)) { $file = Join-Path $file "index.html" }
    $full = [System.IO.Path]::GetFullPath($file)
    if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes("Not found")
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  }
} finally { $listener.Stop() }
