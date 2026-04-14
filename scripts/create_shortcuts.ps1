$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$baseDir = "D:\OneDrive\工作资料\00 信息组工作\2026-04-14 校线异常分析"

$sc1 = $ws.CreateShortcut("$desktop\RailAnalysis-Start.lnk")
$sc1.TargetPath = "$baseDir\scripts\启动校线分析系统.bat"
$sc1.WorkingDirectory = "$baseDir\scripts"
$sc1.Description = "Start Rail Analysis System"
$sc1.Save()

$sc2 = $ws.CreateShortcut("$desktop\RailAnalysis-Stop.lnk")
$sc2.TargetPath = "$baseDir\scripts\停止校线分析系统.bat"
$sc2.WorkingDirectory = "$baseDir\scripts"
$sc2.Description = "Stop Rail Analysis System"
$sc2.Save()

Write-Host "Shortcuts created on desktop"
