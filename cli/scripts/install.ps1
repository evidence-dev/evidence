# Evidence CLI installer for Windows
# Usage: irm https://gaamozau3jchzs3r.public.blob.vercel-storage.com/cli/install.ps1 | iex

# Wrapped in a function so `return` exits the installer without killing the
# user's PowerShell session when run via `irm ... | iex`.
function Install-EvidenceCli {
    $ErrorActionPreference = "Stop"

    $BlobBase = "https://gaamozau3jchzs3r.public.blob.vercel-storage.com/cli"

    # --- Detect platform ---

    $Arch = $env:PROCESSOR_ARCHITECTURE
    switch ($Arch) {
        "AMD64" { $Platform = "windows-x64" }
        default {
            Write-Host "Error: Unsupported architecture: $Arch" -ForegroundColor Red
            Write-Host "Supported: AMD64 (x64)"
            return
        }
    }

    Write-Host "  Detected platform: $Platform"

    # --- Fetch latest version ---

    Write-Host "  Fetching latest version..."
    $VersionJson = Invoke-RestMethod -Uri "$BlobBase/version.json"
    $Version = $VersionJson.latest

    if (-not $Version) {
        Write-Host "Error: Could not determine latest version." -ForegroundColor Red
        return
    }

    Write-Host "  Latest version: v$Version"

    # --- Get binary URL from version.json ---

    $BinaryUrl = $VersionJson.binaries.$Platform

    if (-not $BinaryUrl) {
        Write-Host "Error: No binary available for $Platform." -ForegroundColor Red
        return
    }

    # --- Download binary ---

    $TmpFile = Join-Path $env:TEMP "evidence-download-$PID.exe"
    $PrevProgressPreference = $ProgressPreference

    try {
        Write-Host "  Downloading Evidence CLI v$Version..."
        $ProgressPreference = "SilentlyContinue"
        Invoke-WebRequest -Uri $BinaryUrl -OutFile $TmpFile -UseBasicParsing
        Write-Host "  Downloading Evidence CLI v$Version... done"

        # --- Verify checksum ---

        $ExpectedChecksum = $VersionJson.checksums.$Platform

        if ($ExpectedChecksum) {
            $ActualChecksum = (Get-FileHash -Path $TmpFile -Algorithm SHA256).Hash.ToLower()
            if ($ActualChecksum -ne $ExpectedChecksum) {
                Write-Host "  X Checksum mismatch (expected $ExpectedChecksum, got $ActualChecksum)." -ForegroundColor Red
                Write-Host "  The download may be corrupted. Please try again."
                return
            }
            Write-Host "  OK Checksum verified"
        }

        # --- Install ---

        $InstallDir = Join-Path $env:LOCALAPPDATA "Evidence\bin"
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

        $EvidencePath = Join-Path $InstallDir "evidence.exe"
        $EvdPath = Join-Path $InstallDir "evd.exe"

        Move-Item -Force -Path $TmpFile -Destination $EvidencePath
        Copy-Item -Force -Path $EvidencePath -Destination $EvdPath

        Write-Host "  OK Installed to $EvidencePath"
        Write-Host "  OK Created alias: $EvdPath"

        # --- Add to PATH ---

        $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($UserPath -notlike "*$InstallDir*") {
            $NewPath = if ($UserPath) { "$UserPath;$InstallDir" } else { $InstallDir }
            [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
            $env:Path = "$env:Path;$InstallDir"
            Write-Host ""
            Write-Host "  OK Added $InstallDir to your PATH"
            Write-Host "  Note: Restart your terminal for PATH changes to take effect."
        }

        Write-Host ""

        $IsCiEnv = (($env:CI) -and ($env:CI -ne "false") -and ($env:CI -ne "0")) -or `
            $env:GITHUB_ACTIONS -or $env:GITLAB_CI -or $env:CIRCLECI -or `
            $env:BUILDKITE -or $env:TF_BUILD -or $env:JENKINS_URL
        $OptedOut = @($env:EVIDENCE_TELEMETRY_DISABLED, $env:DO_NOT_TRACK) |
            Where-Object { $_ -and ($_ -ne "false") -and ($_ -ne "0") }
        if ((-not $IsCiEnv) -and (-not $OptedOut)) {
            $StudioHost = if ($env:PUBLIC_STUDIO_HOST) { $env:PUBLIC_STUDIO_HOST } else { "https://evidence.studio" }

            $EvdDir = Join-Path $HOME ".evd"
            $MidFile = Join-Path $EvdDir "machine-id"
            $MachineId = $null
            if (Test-Path $MidFile) { $MachineId = (Get-Content $MidFile -Raw -ErrorAction SilentlyContinue).Trim() }
            if (-not $MachineId) {
                $MachineId = [guid]::NewGuid().ToString()
                try {
                    New-Item -ItemType Directory -Force -Path $EvdDir | Out-Null
                    Set-Content -Path $MidFile -Value $MachineId -NoNewline
                } catch {}
            }

            try {
                $Body = @{
                    event = "cli_installed"
                    machineId = $MachineId
                    properties = @{ platform = $Platform; version = $Version; install_method = "ps1" }
                } | ConvertTo-Json -Compress
                Invoke-RestMethod -Uri "$StudioHost/api/cli/event" -Method Post `
                    -ContentType "application/json" -Body $Body -TimeoutSec 3 | Out-Null
            } catch {}
        }

        # Verify installation
        try {
            $VersionOutput = & $EvidencePath version 2>&1
            Write-Host "  $VersionOutput"
        } catch {
            Write-Host "  Run '$EvidencePath version' to verify."
        }
        Write-Host ""
        Write-Host "  Run 'evidence help' to get started."

    } finally {
        $ProgressPreference = $PrevProgressPreference
        Remove-Item -Force $TmpFile -ErrorAction SilentlyContinue
    }
}

Install-EvidenceCli
