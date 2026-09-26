# ============================================================
# LSFC Project Audit Script
# Scans codebase, generates JSON + Markdown report
# ============================================================

$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "src"
$reportDir = Join-Path $root "audit-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Write-Host ""
Write-Host "=== LSFC Project Audit ===" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# ------------------------------------------------------------
# 1. FILE INVENTORY
# ------------------------------------------------------------
Write-Host "[1/8] Scanning file inventory..." -ForegroundColor Yellow

$allTsFiles = Get-ChildItem -Path $src -Recurse -Include *.ts,*.tsx -File |
  Where-Object { $_.FullName -notmatch "node_modules" }

$fileCount = $allTsFiles.Count
$totalLines = 0
$totalBytes = 0

foreach ($f in $allTsFiles) {
  $totalLines += (Get-Content $f.FullName | Measure-Object -Line).Lines
  $totalBytes += $f.Length
}

# ------------------------------------------------------------
# 2. TODO / FIXME / XXX SCAN
# ------------------------------------------------------------
Write-Host "[2/8] Scanning TODO/FIXME markers..." -ForegroundColor Yellow

$markers = @()
foreach ($f in $allTsFiles) {
  $lineNum = 0
  foreach ($line in Get-Content $f.FullName) {
    $lineNum++
    if ($line -match "TODO|FIXME|XXX|HACK") {
      $relPath = $f.FullName.Replace($root + "\", "")
      $markers += [PSCustomObject]@{
        File = $relPath
        Line = $lineNum
        Text = $line.Trim()
      }
    }
  }
}

# ------------------------------------------------------------
# 3. SECURITY PATTERNS
# ------------------------------------------------------------
Write-Host "[3/8] Scanning security patterns..." -ForegroundColor Yellow

$securityFindings = @()

$securityPatterns = @(
  @{ Name = "Hardcoded password";   Regex = "password\s*[:=]\s*[`"'][^`"']{3,}[`"']";  Severity = "HIGH" },
  @{ Name = "console.log in prod";  Regex = "console\.log\(";                          Severity = "LOW" },
  @{ Name = "any type";             Regex = ":\s*any\b";                               Severity = "MEDIUM" },
  @{ Name = "eval() usage";         Regex = "eval\(";                                  Severity = "CRITICAL" },
  @{ Name = "innerHTML usage";      Regex = "innerHTML\s*=";                           Severity = "HIGH" },
  @{ Name = "dangerouslySetInnerHTML"; Regex = "dangerouslySetInnerHTML";              Severity = "HIGH" },
  @{ Name = "http: URL (no TLS)";   Regex = "http://(?!localhost|127\.)";              Severity = "MEDIUM" },
  @{ Name = "@ts-ignore";           Regex = "@ts-ignore";                              Severity = "MEDIUM" },
  @{ Name = "@ts-expect-error";     Regex = "@ts-expect-error";                        Severity = "MEDIUM" }
)

foreach ($f in $allTsFiles) {
  $lineNum = 0
  foreach ($line in Get-Content $f.FullName) {
    $lineNum++
    foreach ($p in $securityPatterns) {
      if ($line -match $p.Regex) {
        $relPath = $f.FullName.Replace($root + "\", "")
        $securityFindings += [PSCustomObject]@{
          File = $relPath
          Line = $lineNum
          Rule = $p.Name
          Severity = $p.Severity
          Snippet = $line.Trim().Substring(0, [Math]::Min(80, $line.Trim().Length))
        }
      }
    }
  }
}

# ------------------------------------------------------------
# 4. TEST COVERAGE
# ------------------------------------------------------------
Write-Host "[4/8] Checking test coverage..." -ForegroundColor Yellow

$testFiles = Get-ChildItem -Path $src -Recurse -Include *.test.ts,*.test.tsx,*.spec.ts,*.spec.tsx -File
$testCount = $testFiles.Count

# ------------------------------------------------------------
# 5. ACCESSIBILITY
# ------------------------------------------------------------
Write-Host "[5/8] Scanning accessibility patterns..." -ForegroundColor Yellow

$a11yFindings = @()
$ariaCount = 0
$imgWithoutAlt = @()

foreach ($f in $allTsFiles) {
  $content = Get-Content $f.FullName -Raw
  if ($content -match "aria-") {
    $ariaCount += ([regex]::Matches($content, "aria-")).Count
  }
  if ($content -match "<img(?![^>]*\balt=)[^>]*>") {
    $relPath = $f.FullName.Replace($root + "\", "")
    $imgWithoutAlt += $relPath
  }
}

# ------------------------------------------------------------
# 6. FONT & PDF STANDARDS
# ------------------------------------------------------------
Write-Host "[6/8] Verifying PDF/Font standards..." -ForegroundColor Yellow

$fontCheck = [PSCustomObject]@{
  AnekBanglaBold = (Test-Path (Join-Path $root "public\fonts\AnekBangla-Bold.ttf"))
  AnekBanglaRegular = (Test-Path (Join-Path $root "public\fonts\AnekBangla-Regular.ttf"))
  Kalpurush = (Test-Path (Join-Path $root "public\fonts\Kalpurush.ttf"))
  SolaimanLipi = (Test-Path (Join-Path $root "public\fonts\SolaimanLipi.ttf"))
  HyphenationCallback = $false
  KalpurushOnly400 = $false
  FiveColorPalette = $false
}

$pdfStandards = Join-Path $src "utils\pdfStandards.ts"
if (Test-Path $pdfStandards) {
  $ps = Get-Content $pdfStandards -Raw
  $fontCheck.HyphenationCallback = $ps -match "registerHyphenationCallback"
  $fontCheck.KalpurushOnly400 = $ps -match "Kalpurush" -and $ps -match "fontWeight:\s*400"
  $fontCheck.FiveColorPalette = $ps -match "#902A8B" -and $ps -match "#37A448" -and $ps -match "#EC2324"
}

# ------------------------------------------------------------
# 7. PACKAGE.JSON ANALYSIS
# ------------------------------------------------------------
Write-Host "[7/8] Analyzing package.json..." -ForegroundColor Yellow

$pkgPath = Join-Path $root "package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

$deps = @()
foreach ($p in $pkg.dependencies.PSObject.Properties) {
  $deps += [PSCustomObject]@{ Name = $p.Name; Version = $p.Value; Type = "dependency" }
}
foreach ($p in $pkg.devDependencies.PSObject.Properties) {
  $deps += [PSCustomObject]@{ Name = $p.Name; Version = $p.Value; Type = "devDependency" }
}

# ------------------------------------------------------------
# 8. BUILD METRICS
# ------------------------------------------------------------
Write-Host "[8/8] Checking build artifacts..." -ForegroundColor Yellow

$distPath = Join-Path $root "dist"
$distFiles = @()
if (Test-Path $distPath) {
  $distFiles = Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
    [PSCustomObject]@{
      Path = $_.FullName.Replace($root + "\", "")
      SizeKB = [Math]::Round($_.Length / 1KB, 2)
    }
  }
}

# ------------------------------------------------------------
# GENERATE JSON REPORT
# ------------------------------------------------------------
$report = [PSCustomObject]@{
  GeneratedAt = (Get-Date -Format "o")
  Project = "LSFC Management System"
  Version = $pkg.version

  FileInventory = [PSCustomObject]@{
    TotalFiles = $fileCount
    TotalLines = $totalLines
    TotalSizeKB = [Math]::Round($totalBytes / 1KB, 2)
  }

  CodeQuality = [PSCustomObject]@{
    TodoFixmeMarkers = $markers.Count
    Markers = $markers
  }

  Security = [PSCustomObject]@{
    TotalFindings = $securityFindings.Count
    BySeverity = [PSCustomObject]@{
      CRITICAL = ($securityFindings | Where-Object Severity -eq "CRITICAL").Count
      HIGH = ($securityFindings | Where-Object Severity -eq "HIGH").Count
      MEDIUM = ($securityFindings | Where-Object Severity -eq "MEDIUM").Count
      LOW = ($securityFindings | Where-Object Severity -eq "LOW").Count
    }
    Findings = $securityFindings
  }

  Testing = [PSCustomObject]@{
    TestFiles = $testCount
    HasTests = ($testCount -gt 0)
  }

  Accessibility = [PSCustomObject]@{
    AriaAttributeCount = $ariaCount
    ImgWithoutAltCount = $imgWithoutAlt.Count
    ImgWithoutAlt = $imgWithoutAlt
  }

  PdfFontStandards = $fontCheck

  Dependencies = $deps

  BuildArtifacts = $distFiles
}

$jsonPath = Join-Path $reportDir "audit-$timestamp.json"
$report | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

# ------------------------------------------------------------
# GENERATE MARKDOWN REPORT
# ------------------------------------------------------------
$md = @"
# LSFC Project Audit Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Project:** LSFC Management System v$($pkg.version)

---

## 1. File Inventory

| Metric | Value |
|---|---|
| Total .ts/.tsx files | $fileCount |
| Total lines of code | $($totalLines.ToString("N0")) |
| Total size | $([Math]::Round($totalBytes / 1KB, 2)) KB |

---

## 2. Code Quality

**TODO/FIXME markers:** $($markers.Count)

$(if ($markers.Count -gt 0) {
  ($markers | ForEach-Object { "- ``$($_.File):$($_.Line)`` — $($_.Text)" }) -join "`n"
} else {
  "No TODO/FIXME markers found. ✅"
})

---

## 3. Security Findings

**Total:** $($securityFindings.Count)

| Severity | Count |
|---|---|
| 🔴 CRITICAL | $(($securityFindings | Where-Object Severity -eq "CRITICAL").Count) |
| 🟠 HIGH | $(($securityFindings | Where-Object Severity -eq "HIGH").Count) |
| 🟡 MEDIUM | $(($securityFindings | Where-Object Severity -eq "MEDIUM").Count) |
| ⚪ LOW | $(($securityFindings | Where-Object Severity -eq "LOW").Count) |

### Details

$(if ($securityFindings.Count -gt 0) {
  ($securityFindings | ForEach-Object { "- **[$($_.Severity)]** $($_.Rule) — ``$($_.File):$($_.Line)``" }) -join "`n"
} else {
  "No security issues found. ✅"
})

---

## 4. Testing

| Metric | Value |
|---|---|
| Test files | $testCount |
| Status | $(if ($testCount -gt 0) { "✅ Tests present" } else { "❌ No tests" }) |

---

## 5. Accessibility (WCAG 2.2)

| Metric | Value |
|---|---|
| ARIA attributes | $ariaCount |
| Images without alt | $($imgWithoutAlt.Count) |

$(if ($imgWithoutAlt.Count -gt 0) {
  "### Images without alt attribute`n`n" + (($imgWithoutAlt | ForEach-Object { "- ``$_``" }) -join "`n")
} else {
  "All images have alt attributes. ✅"
})

---

## 6. PDF & Font Standards

| Standard | Status |
|---|---|
| AnekBangla-Bold.ttf present | $(if ($fontCheck.AnekBanglaBold) { "✅" } else { "❌" }) |
| AnekBangla-Regular.ttf present | $(if ($fontCheck.AnekBanglaRegular) { "✅" } else { "❌" }) |
| Kalpurush.ttf present | $(if ($fontCheck.Kalpurush) { "✅" } else { "❌" }) |
| SolaimanLipi.ttf present | $(if ($fontCheck.SolaimanLipi) { "✅" } else { "❌" }) |
| Hyphenation callback | $(if ($fontCheck.HyphenationCallback) { "✅" } else { "❌" }) |
| Kalpurush only 400 | $(if ($fontCheck.KalpurushOnly400) { "✅" } else { "❌" }) |
| 5-color palette | $(if ($fontCheck.FiveColorPalette) { "✅" } else { "❌" }) |

---

## 7. Dependencies

**Total:** $($deps.Count)

### Dependencies
$(($deps | Where-Object Type -eq "dependency" | ForEach-Object { "- ``$($_.Name)`` @ $($_.Version)" }) -join "`n")

### Dev Dependencies
$(($deps | Where-Object Type -eq "devDependency" | ForEach-Object { "- ``$($_.Name)`` @ $($_.Version)" }) -join "`n")

---

## 8. Build Artifacts

$(if ($distFiles.Count -gt 0) {
  "| File | Size (KB) |`n|---|---|`n" + (($distFiles | ForEach-Object { "| ``$($_.Path)`` | $($_.SizeKB) |" }) -join "`n")
} else {
  "No dist/ folder found. Run ``npm run build`` first."
})

---

## Summary

- **Files:** $fileCount
- **Lines:** $($totalLines.ToString("N0"))
- **Security findings:** $($securityFindings.Count)
- **Tests:** $testCount
- **Accessibility issues:** $($imgWithoutAlt.Count)

**Full JSON report:** ``audit-reports/audit-$timestamp.json``

---

*Generated by scripts/audit.ps1*
"@

$mdPath = Join-Path $reportDir "audit-$timestamp.md"
$md | Set-Content $mdPath -Encoding UTF8

Write-Host ""
Write-Host "=== Audit Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "JSON report: $jsonPath" -ForegroundColor Cyan
Write-Host "Markdown report: $mdPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:"
Write-Host "  Files scanned: $fileCount"
Write-Host "  Lines of code: $($totalLines.ToString('N0'))"
Write-Host "  TODO/FIXME: $($markers.Count)"
Write-Host "  Security findings: $($securityFindings.Count)"
Write-Host "  Test files: $testCount"
Write-Host "  A11y issues: $($imgWithoutAlt.Count)"
Write-Host ""
