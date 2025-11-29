Write-Host ============================================ 
Write-Host          MOODACHU ZK TEST SUITE              
Write-Host ============================================ 

# --- PATHS ---
$buildDir   = "..\build"
$keysDir    = "..\keys"

$wasmFile   = "$buildDir\moodachu_js\moodachu.wasm"
$zkeyFile   = "$keysDir\proving_key.zkey"
$vkFile     = "$keysDir\verification_key.json"

# --- TEST LIST ---
$tests = @(
    @{ name="happy";     file="test_happy.json";       expect="PASS" },
    @{ name="storm";     file="test_storm.json";       expect="PASS" },
    @{ name="sleepy";    file="test_sleepy.json";      expect="PASS" },
    @{ name="grow";      file="test_grow.json";        expect="PASS" },
    @{ name="stroke";    file="test_stroke.json";      expect="PASS" },
    @{ name="feed";      file="test_feed.json";        expect="PASS" },

    @{ name="invalid_tagA";     file="invalid_tagA.json";       expect="FAIL" },
    @{ name="invalid_tagB";     file="invalid_tagB.json";       expect="FAIL" },
    @{ name="invalid_interaction"; file="invalid_interaction.json"; expect="FAIL" },
    @{ name="invalid_missing";     file="invalid_missing.json";     expect="FAIL" }
)

# Create output directory
$outWitness = "witness.wtns"
$outProof   = "proof.json"
$outPublic  = "public.json"

function Run-Test {
    param (
        [string]$name,
        [string]$file,
        [string]$expect
    )

    Write-Host ""
    Write-Host "=== RUNNING TEST: $name ===" -ForegroundColor Yellow

    # Step 1 — Generate witness
    $gen = "$buildDir\moodachu_js\generate_witness.js"
    node $gen $wasmFile $file $outWitness 2>$null

    $witnessOK = ($LASTEXITCODE -eq 0)

    if (-not $witnessOK) {
        if ($expect -eq "FAIL") {
            Write-Host "PASS (correct failure during witness)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "FAIL (unexpected error in witness generation)" -ForegroundColor Red
            return $false
        }
    }

    # Step 2 — Generate proof
    snarkjs groth16 prove $zkeyFile $outWitness $outProof $outPublic 2>$null
    $proveOK = ($LASTEXITCODE -eq 0)

    if (-not $proveOK) {
        if ($expect -eq "FAIL") {
            Write-Host "PASS (proof failed as expected)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "FAIL (unexpected error in proof)" -ForegroundColor Red
            return $false
        }
    }

    # Step 3 — Verify proof
    snarkjs groth16 verify $vkFile $outPublic $outProof 2>$null
    $verifyOK = ($LASTEXITCODE -eq 0)

    if ($verifyOK -and $expect -eq "PASS") {
        Write-Host "PASS" -ForegroundColor Green
        return $true
    }
    elseif ((-not $verifyOK) -and $expect -eq "FAIL") {
        Write-Host "PASS (verification failed as expected)" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "FAIL (verification mismatch)" -ForegroundColor Red
        return $false
    }
}

$total = 0
$passed = 0

foreach ($t in $tests) {
    $total++
    if (Run-Test -name $t.name -file $t.file -expect $t.expect) {
        $passed++
    }
}

Write-Host ""
Write-Host ============================================
Write-Host "RESULTS: $passed / $total tests passed" -ForegroundColor Cyan
Write-Host ============================================
