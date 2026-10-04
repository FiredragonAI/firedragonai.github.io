# Draws the Listen Everything icon as PNG at any size.
#
# The source icon is an SVG, and nothing on this machine rasterises SVG, so the
# same shapes are drawn with GDI+ instead. The design is laid out in a 128-unit
# box (as in icon.svg) and scaled; the content is shrunk to 0.92 and recentred so
# it stays inside the circular safe zone Android masks adaptive icons to.
param(
  [Parameter(Mandatory = $true)][int]$Size,
  [Parameter(Mandatory = $true)][string]$Out
)

Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$ink = [System.Drawing.ColorTranslator]::FromHtml('#16181D')
$accent = [System.Drawing.ColorTranslator]::FromHtml('#5B9DF9')
$faint = [System.Drawing.ColorTranslator]::FromHtml('#7E8794')
$bright = [System.Drawing.ColorTranslator]::FromHtml('#F2F4F7')

# Full-bleed ground: Play and Android round the corners themselves.
$g.Clear($ink)

$unit = $Size / 128.0
$m = New-Object System.Drawing.Drawing2D.Matrix
$m.Scale($unit, $unit)
$m.Translate(64, 64)          # canvas centre, in design units
$m.Scale(0.92, 0.92)          # keep clear of the adaptive-icon mask
$m.Translate(-64, -66)        # content centre
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

# Headband: down-stroke, semicircle over the top, down-stroke.
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

$brushAccent = New-Object System.Drawing.SolidBrush($accent)
$brushFaint = New-Object System.Drawing.SolidBrush($faint)
$brushBright = New-Object System.Drawing.SolidBrush($bright)

# Earcups
$g.FillPath($brushAccent, (New-RoundedRect 20 70 18 30 7))
$g.FillPath($brushAccent, (New-RoundedRect 90 70 18 30 7))

# Three lines of text; the middle one is the sentence being spoken.
$g.FillPath($brushFaint,  (New-RoundedRect 46 66 36 6 3))
$g.FillPath($brushBright, (New-RoundedRect 46 80 36 6 3))
$g.FillPath($brushFaint,  (New-RoundedRect 46 94 24 6 3))

$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("{0}  {1}x{1}  {2:N0} bytes" -f (Split-Path $Out -Leaf), $Size, (Get-Item $Out).Length)
