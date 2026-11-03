$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()
Write-Host "Server running at http://localhost:8000/ - Serving c:\Users\riona\code"
Start-Process "http://localhost:8000/"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }
        
        $localFilePath = Join-Path "c:\Users\riona\code" ($urlPath.TrimStart("/").Replace("/", "\"))
        
        if (Test-Path $localFilePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            if ($localFilePath.EndsWith(".html")) {
                $response.ContentType = "text/html; charset=utf-8"
            } elseif ($localFilePath.EndsWith(".js")) {
                $response.ContentType = "application/javascript"
            } elseif ($localFilePath.EndsWith(".css")) {
                $response.ContentType = "text/css"
            } elseif ($localFilePath.EndsWith(".json")) {
                $response.ContentType = "application/json"
            } else {
                $response.ContentType = "application/octet-stream"
            }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    } catch {
        # ignore abort/close exceptions on shutdown
    }
}

