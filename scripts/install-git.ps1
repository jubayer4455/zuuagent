$destZip = "$env:USERPROFILE\.gemini\antigravity\scratch\mingit.zip"
$destDir = "$env:USERPROFILE\.gemini\antigravity\scratch\mingit"
$minGitUrl = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip"

Write-Host "Downloading MinGit portable from $minGitUrl..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $minGitUrl -OutFile $destZip -UseBasicParsing

Write-Host "Extracting to $destDir..."
if (Test-Path $destDir) { Remove-Item -Recurse -Force $destDir }
New-Item -ItemType Directory -Path $destDir -Force | Out-Null
Expand-Archive -Path $destZip -DestinationPath $destDir -Force
Remove-Item -Force $destZip

$gitBin = Join-Path $destDir "cmd\git.exe"
if (Test-Path $gitBin) {
    Write-Host "Git installed successfully:"
    & $gitBin --version
} else {
    Write-Host "Git binary not found at $gitBin"
}
