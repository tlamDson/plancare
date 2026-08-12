#requires -Version 5.1
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference    = 'SilentlyContinue'

function Emit([hashtable]$o) {
    [Console]::Out.Write( ($o | ConvertTo-Json -Compress -Depth 5) )
    exit 0
}
function AllowStop([string]$msg) {
    if ($script:StatePath -and (Test-Path $script:StatePath)) { Remove-Item $script:StatePath -Force }
    if ($msg) { Emit @{ systemMessage = $msg } }
    exit 0
}

# ---- 1. read hook input (tolerate empty) ---------------------------------
$raw = [Console]::In.ReadToEnd()
$stopHookActive = $false
if ($raw -and $raw.TrimStart().StartsWith('{')) {
    try {
        $h = $raw | ConvertFrom-Json
        if ($h.stop_hook_active) { $stopHookActive = [bool]$h.stop_hook_active }
    } catch { }
}

# ---- 2. locate state; absent = disarmed = normal stop ---------------------
$root = $env:CLAUDE_PROJECT_DIR
if (-not $root) { $root = (Get-Location).Path }
$script:StatePath = Join-Path $root '.claude\.ci-watch.json'
if (-not (Test-Path $script:StatePath)) { exit 0 }

try { $st = Get-Content -Raw -LiteralPath $script:StatePath | ConvertFrom-Json }
catch { AllowStop 'CI guard: state file unreadable - disarmed.' }

# ---- 3. hard limits (checked BEFORE any network call) --------------------
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
if (-not $st.pr)                                  { AllowStop 'CI guard: no PR number - disarmed.' }
if ([int64]$st.deadline_epoch -le $now)           { AllowStop "CI guard: wall-clock deadline reached for PR #$($st.pr) - stopping." }
if ([int]$st.attempts -ge [int]$st.max_attempts)  { AllowStop "CI guard: max attempts ($($st.max_attempts)) reached for PR #$($st.pr) - stopping." }
if ($stopHookActive -and [int]$st.attempts -eq 0) { AllowStop 'CI guard: stale state (stop_hook_active with 0 attempts) - disarmed.' }

# ---- 4. one fast poll (NOT a long poll - keep the hook snappy) -----------
$out  = & gh pr checks $st.pr --json bucket,name,state,link 2>&1 | Out-String
$code = $LASTEXITCODE

$checks = $null
if ($out.TrimStart().StartsWith('[')) { try { $checks = @($out | ConvertFrom-Json) } catch { } }

if ($null -eq $checks) {
    $elapsed = $now - [int64]$st.armed_at_epoch
    if ($elapsed -lt 180) { $verdict = 'PENDING'; $detail = 'checks have not registered yet' }
    else { AllowStop "CI guard: no checks appeared within 3 minutes for PR #$($st.pr) - disarmed. (gh exit $code)" }
} else {
    $b = @($checks | ForEach-Object { $_.bucket })
    if     ($b -contains 'pending')                        { $verdict = 'PENDING'; $detail = "$(($b | Where-Object {$_ -eq 'pending'}).Count) check(s) still running" }
    elseif (($b -contains 'fail') -or ($b -contains 'cancel')) {
        $verdict = 'FAILED'
        $detail  = (@($checks | Where-Object { $_.bucket -in 'fail','cancel' } |
                     ForEach-Object { "$($_.name) [$($_.state)] $($_.link)" }) -join ' | ')
    }
    else { AllowStop "CI guard: PR #$($st.pr) CI concluded green ($($b.Count) checks, skips OK) - disarmed." }
}

# ---- 5. block, and bump the counter --------------------------------------
$st.attempts    = [int]$st.attempts + 1
$st.last_status = $verdict
$st | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $script:StatePath -Encoding utf8

$left = [int]$st.max_attempts - [int]$st.attempts
if ($verdict -eq 'PENDING') {
    $reason = "CI for PR #$($st.pr) is still running ($detail). Do NOT end your turn. " +
              "Run this now in the Bash tool with timeout 540000: " +
              "gh pr checks $($st.pr) --watch --fail-fast --interval 20 " +
              "Then re-check. Attempt $($st.attempts)/$($st.max_attempts); $left continuation(s) left before the guard self-disarms."
} else {
    $reason = "CI for PR #$($st.pr) FAILED: $detail. Do NOT end your turn. " +
              "Get the run id with: gh run list --branch $($st.branch) --workflow 'CI - PR Check' --limit 1 --json databaseId,conclusion " +
              "then: gh run view <id> --log-failed . Fix the cause, commit, push, and wait again. " +
              "Attempt $($st.attempts)/$($st.max_attempts); $left continuation(s) left."
}

Emit @{
    decision      = 'block'
    reason        = $reason
    systemMessage = "CI watch PR #$($st.pr): $verdict (attempt $($st.attempts)/$($st.max_attempts))"
}
