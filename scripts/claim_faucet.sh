#!/usr/bin/env bash
# ==============================================================================
# Thru Betanet Automated Faucet Claim Script
# ==============================================================================
# Protocol limit: 10,000 THRU per transaction
# To get 1,000,000 THRU: 100 claims (~4-5 minutes)
# ==============================================================================

ACCOUNT="${1:-default}"
TOTAL_CLAIMS="${2:-100}" # Default is 100 claims = 1,000,000 THRU tokens

echo "=========================================================="
echo " Starting Thru Betanet Faucet Auto-Claimer"
echo " Target Account : $ACCOUNT"
echo " Claims to run  : $TOTAL_CLAIMS"
echo " Total THRU     : $((TOTAL_CLAIMS * 10000)) THRU (at 10,000 / claim)"
echo " Press Ctrl+C at any time to pause or stop"
echo "=========================================================="

success_count=0
fail_count=0

trap 'echo -e "\n\nScript stopped by user. Total successful claims: $success_count"; exit 0' INT

for (( i=1; i<=TOTAL_CLAIMS; i++ ))
do
    echo -n "[$i/$TOTAL_CLAIMS] Requesting 10,000 THRU... "
    OUTPUT=$(thru faucet withdraw "$ACCOUNT" 10000 2>&1)
    
    if echo "$OUTPUT" | grep -q "Withdraw completed successfully"; then
        SIG=$(echo "$OUTPUT" | grep "Transaction signature:" | awk '{print $NF}' | cut -c1-16)
        echo "✅ SUCCESS! (sig: ${SIG}...)"
        ((success_count++))
    else
        echo "⚠️ FAILED. ($OUTPUT)"
        ((fail_count++))
        sleep 2
    fi

    # Small pause to avoid aggressive rate limiting
    sleep 0.5
done

echo "=========================================================="
echo " Finished!"
echo " Total Successful : $success_count ($((success_count * 10000)) THRU)"
echo " Total Failed     : $fail_count"
echo " Current Balance  :"
thru getbalance "$ACCOUNT"
echo "=========================================================="
