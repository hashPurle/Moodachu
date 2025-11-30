Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       MOODACHU ZK FULL TEST PIPELINE       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- PATHS ---
$circomFile = "..\circuits\moodachu.circom"
$buildDir   = "..\build"
$keysDir    = "..\keys"
$testDir    = "."

$wasmFile   = "$buildDir\moodachu_js\moodachu.wasm"
$inputFile  = "$testDir\input.json"
$wtnsFile   = "$testDir\witness.wtns"
$proofFile  = "$testDir\proof.json"
$publicFile = "$testDir\public.json"

$ptauFile   = "$keysDir\ptau_final.ptau"
$zkeyFile   = "$keysDir\proving_key.zkey"
$vkFile     = "$keysDir\verification_key.json"


# -----------------------------
Write-Host ""
Write-Host "== COMPILING CIRCUIT ==" -ForegroundColor Yellow
# -----------------------------
circom $circomFile --r1cs --wasm --sym -o $buildDir

if ($LASTEXITCODE -ne 0) {
    Write-Host "CIRCUIT COMPILATION FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "Circuit compiled successfully" -ForegroundColor Green


# -----------------------------
Write-Host ""
Write-Host "== PREPARE PROVING KEY ==" -ForegroundColor Yellow
# -----------------------------
snarkjs groth16 setup "$buildDir\moodachu.r1cs" $ptauFile $zkeyFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "KEY GENERATION FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "Proving key generated" -ForegroundColor Green


# -----------------------------
Write-Host ""
Write-Host "== EXPORT VERIFICATION KEY ==" -ForegroundColor Yellow
# -----------------------------
snarkjs zkey export verificationkey $zkeyFile $vkFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "VERIFICATION KEY EXPORT FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "Verification key generated" -ForegroundColor Green


# -----------------------------
Write-Host ""
Write-Host "== GENERATE WITNESS ==" -ForegroundColor Yellow
# -----------------------------
node "$buildDir\moodachu_js\generate_witness.js" $wasmFile $inputFile $wtnsFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "WITNESS GENERATION FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "Witness generated" -ForegroundColor Green


# -----------------------------
Write-Host ""
Write-Host "== GENERATE PROOF ==" -ForegroundColor Yellow
# -----------------------------
snarkjs groth16 prove $zkeyFile $wtnsFile $proofFile $publicFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "PROOF GENERATION FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "Proof generated" -ForegroundColor Green


# -----------------------------
Write-Host ""
Write-Host "== VERIFY PROOF ==" -ForegroundColor Yellow
# -----------------------------
snarkjs groth16 verify $vkFile $publicFile $proofFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "PROOF VERIFICATION FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "============================================" -ForegroundColor Green
Write-Host "           ALL TESTS PASSED                  " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
