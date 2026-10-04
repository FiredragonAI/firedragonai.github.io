# Play Store feature graphic: 1024 x 500.
#
# Google crops and overlays this on several surfaces, so the composition keeps
# everything well inside the edges and leans on the mark rather than on text.
param([string]$Out = "C:\claude\listen-everything-web\store\feature-graphic-1024x500.png")

Add-Type -AssemblyName System.Drawing

$W = 1024; $H = 500
$bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$ink = [System.Drawing.ColorTranslator]::FromHtml('#16181D')
$accent = [System.Drawing.ColorTranslator]::FromHtml('#5B9DF9')
$fg = [System.Drawing.ColorTranslator]::FromHtml('#F2F4F7')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#AEB6C2')

$g.Clear($ink)

# A soft accent glow behind the mark, so the panel is not a flat rectangle.
$glow = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow.AddEllipse(-80, 60, 620, 620)
$brushGlow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glow)
$brushGlow.CenterColor = [System.Drawing.Color]::FromArgb(58, 91, 157, 249)
$brushGlow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 91, 157, 249))
$g.FillPath($brushGlow, $glow)

# --- the mark, drawn in the same 128-unit space as the app icon ---
$g.Save() | Out-Null
$state = $g.Save()
$m = New-Object System.Drawing.Drawing2D.Matrix
$m.Translate(96, 112)
$m.Scale(2.15, 2.15)
$g.Transform = $m

function New-RoundedRect([double]$x, [double]$y, [double]$w, [double]$h, [double]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

$band = New-Object System.Drawing.Drawing2D.GraphicsPath
$band.StartFigure()
$band.AddLine(28, 76, 28, 68)
$band.AddArc(28, 32, 72, 72, 180, 180)
$band.AddLine(100, 68, 100, 76)
$pen = New-Object System.Drawing.Pen($accent, 8)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($pen, $band)

$bAccent = New-Object System.Drawing.SolidBrush($accent)
$bMuted = New-Object System.Drawing.SolidBrush($muted)
$bFg = New-Object System.Drawing.SolidBrush($fg)
$g.FillPath($bAccent, (New-RoundedRect 20 70 18 30 7))
$g.FillPath($bAccent, (New-RoundedRect 90 70 18 30 7))
$g.FillPath($bMuted,  (New-RoundedRect 46 66 36 6 3))
$g.FillPath($bFg,     (New-RoundedRect 46 80 36 6 3))
$g.FillPath($bMuted,  (New-RoundedRect 46 94 24 6 3))
$g.Restore($state)

# --- wordmark ---
$x = 430
$fName = New-Object System.Drawing.Font('Segoe UI Semibold', 50, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fZh   = New-Object System.Drawing.Font('Microsoft YaHei', 38, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fSub  = New-Object System.Drawing.Font('Microsoft YaHei', 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$g.DrawString('Listen Everything', $fName, $bFg, $x, 150)
$g.DrawString('听见一切', $fZh, $bAccent, $x, 222)
$g.DrawString('任何文字，读给你听', $fSub, $bMuted, $x, 288)
$g.DrawString('文件 · 网页 · 照片 · 语音 · 翻译', $fSub, $bMuted, $x, 324)

$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("{0}  {1}x{2}  {3:N0} bytes" -f (Split-Path $Out -Leaf), $W, $H, (Get-Item $Out).Length)
