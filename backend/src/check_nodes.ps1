Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Select-Object ProcessId, @{Name="CPU"; Expression={(Get-Process -Id $_.ProcessId).CPU}}, CommandLine | Format-Table -Wrap
