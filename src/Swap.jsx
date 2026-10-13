import { useState, useEffect } from "react";
import { TokenIcon } from "./TokenIcon.jsx";

const TOKENS = [
  { symbol: "THRU", name: "Thru Native", price: 0.45, color: "#C0392B", decimals: 6 },
  { symbol: "tUSD", name: "Thru USD", price: 1.00, color: "#059669", decimals: 6 },
  { symbol: "tETH", name: "Thru Ether", price: 3420.00, color: "#4f46e5", decimals: 8 },
  { symbol: "tSOL", name: "Thru Solana", price: 158.00, color: "#7c3aed", decimals: 6 },
  { symbol: "tBTC", name: "Thru Bitcoin", price: 68500.00, color: "#d97706", decimals: 8 }
];

const INITIAL_BALANCES = {
  THRU: 10000,
  tUSD: 4500,
  tETH: 2.5,
  tSOL: 35.0,
  tBTC: 0.15
};

const INITIAL_POOLS = [
  { id: "THRU-tUSD", tokenA: "THRU", tokenB: "tUSD", reserveA: 3500000, reserveB: 1575000, apr: "28.4%", tvl: "$3,150,000", vol24h: "$840,200" },
  { id: "THRU-tETH", tokenA: "THRU", tokenB: "tETH", reserveA: 2800000, reserveB: 368.4, apr: "34.2%", tvl: "$2,520,000", vol24h: "$620,100" },
  { id: "tUSD-tETH", tokenA: "tUSD", tokenB: "tETH", reserveA: 1800000, reserveB: 526.3, apr: "19.8%", tvl: "$3,600,000", vol24h: "$950,400" },
];

const INITIAL_POSITIONS = [
  { id: "pos-1", poolId: "THRU-tUSD", tokenA: "THRU", tokenB: "tUSD", lpTokens: 420.5, share: "0.12%", pooledA: 4200, pooledB: 1890, earnedFees: "$42.80" }
];

export function Swap({ setSection }) {
  const [mode, setMode] = useState("swap"); // "swap" | "liquidity"
  
  // Balances
  const [balances, setBalances] = useState(() => {
    try {
      const saved = localStorage.getItem("thrupulse_balances");
      return saved ? JSON.parse(saved) : INITIAL_BALANCES;
    } catch {
      return INITIAL_BALANCES;
    }
  });

  const [syncingOnchain, setSyncingOnchain] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("thrupulse_balances", JSON.stringify(balances));
    } catch (_) {}
  }, [balances]);

  // Listen for Treasury claims and external balance updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("thrupulse_balances");
        if (saved) setBalances(JSON.parse(saved));
      } catch (_) {}
    };
    window.addEventListener("thrupulse_balance_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("thrupulse_balance_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleSyncOnchain = async () => {
    setSyncingOnchain(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/wallet/balance?address=default");
      const data = await res.json();
      if (data.success && typeof data.balance === "number") {
        const updated = {
          ...balances,
          THRU: data.balance
        };
        setBalances(updated);
        localStorage.setItem("thrupulse_balances", JSON.stringify(updated));
        setSyncMessage(`Synced ${data.balance.toLocaleString()} THRU directly from on-chain RPC!`);
      } else {
        setSyncMessage(`⚠️ On-chain sync: ${data.error || "Node offline"}`);
      }
    } catch (err) {
      setSyncMessage(`⚠️ Node unreachable: ${err.message}`);
    } finally {
      setSyncingOnchain(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // SWAP STATE
  const [fromToken, setFromToken] = useState("THRU");
  const [toToken, setToToken] = useState("tUSD");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(null);
  const [swapError, setSwapError] = useState(null);

  // LIQUIDITY STATE
  const [selectedPoolId, setSelectedPoolId] = useState("THRU-tUSD");
  const [liqAmountA, setLiqAmountA] = useState("");
  const [liqAmountB, setLiqAmountB] = useState("");
  const [supplying, setSupplying] = useState(false);
  const [liqSuccess, setLiqSuccess] = useState(null);
  const [liqError, setLiqError] = useState(null);
  const [myPositions, setMyPositions] = useState(() => {
    try {
      const saved = localStorage.getItem("thrupulse_positions");
      return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
    } catch {
      return INITIAL_POSITIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("thrupulse_positions", JSON.stringify(myPositions));
    } catch (_) {}
  }, [myPositions]);

  // Helper token lookups
  const getToken = (sym) => TOKENS.find(t => t.symbol === sym) || TOKENS[0];
  const fromObj = getToken(fromToken);
  const toObj = getToken(toToken);

  // Exchange rate calculation
  const currentRate = (fromObj.price / toObj.price);

  // Handle From Amount Change in Swap
  const handleFromChange = (val) => {
    setFromAmount(val);
    setSwapSuccess(null);
    setSwapError(null);
    if (!val || isNaN(val) || parseFloat(val) <= 0) {
      setToAmount("");
      return;
    }
    const num = parseFloat(val);
    const feeMultiplier = 0.998; // 0.2% fee
    const calculated = (num * currentRate * feeMultiplier).toFixed(toObj.decimals > 6 ? 6 : 4);
    setToAmount(calculated);
  };

  // Flip Tokens
  const handleFlip = () => {
    const prevFrom = fromToken;
    const prevTo = toToken;
    setFromToken(prevTo);
    setToToken(prevFrom);
    setSwapSuccess(null);
    setSwapError(null);
    if (toAmount && !isNaN(toAmount)) {
      setFromAmount(toAmount);
      const newRate = (getToken(prevTo).price / getToken(prevFrom).price);
      setToAmount((parseFloat(toAmount) * newRate * 0.998).toFixed(getToken(prevFrom).decimals > 6 ? 6 : 4));
    }
  };

  // Execute Swap
  const handleSwap = () => {
    const parsedFrom = parseFloat(fromAmount);
    if (!parsedFrom || parsedFrom <= 0) {
      setSwapError("Please enter a valid amount to swap.");
      return;
    }
    if (parsedFrom > (balances[fromToken] || 0)) {
      setSwapError(`Insufficient ${fromToken} balance.`);
      return;
    }

    setSwapping(true);
    setSwapError(null);
    setSwapSuccess(null);

    setTimeout(() => {
      const parsedTo = parseFloat(toAmount);
      const newBalances = {
        ...balances,
        [fromToken]: Number((balances[fromToken] - parsedFrom).toFixed(6)),
        [toToken]: Number(((balances[toToken] || 0) + parsedTo).toFixed(6))
      };
      setBalances(newBalances);

      const fakeTxHash = "tx_thruvm_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      setSwapSuccess({
        from: `${parsedFrom} ${fromToken}`,
        to: `${parsedTo} ${toToken}`,
        rate: `1 ${fromToken} = ${(currentRate * 0.998).toFixed(4)} ${toToken}`,
        hash: fakeTxHash,
        time: "< 0.35s (RISC-V ThruVM Finality)"
      });
      setTimeout(() => setSwapSuccess(null), 8000);

      setFromAmount("");
      setToAmount("");
      setSwapping(false);
    }, 850);
  };

  // Active pool for liquidity
  const currentPool = INITIAL_POOLS.find(p => p.id === selectedPoolId) || INITIAL_POOLS[0];
  const poolTokenA = getToken(currentPool.tokenA);
  const poolTokenB = getToken(currentPool.tokenB);
  const poolPriceRatio = poolTokenA.price / poolTokenB.price;

  // Handle Liquidity Amount A Change
  const handleLiqAChange = (val) => {
    setLiqAmountA(val);
    setLiqSuccess(null);
    setLiqError(null);
    if (!val || isNaN(val) || parseFloat(val) <= 0) {
      setLiqAmountB("");
      return;
    }
    const num = parseFloat(val);
    const calculatedB = (num * poolPriceRatio).toFixed(4);
    setLiqAmountB(calculatedB);
  };

  // Handle Liquidity Amount B Change
  const handleLiqBChange = (val) => {
    setLiqAmountB(val);
    setLiqSuccess(null);
    setLiqError(null);
    if (!val || isNaN(val) || parseFloat(val) <= 0) {
      setLiqAmountA("");
      return;
    }
    const num = parseFloat(val);
    const calculatedA = (num / poolPriceRatio).toFixed(4);
    setLiqAmountA(calculatedA);
  };

  // Supply Liquidity
  const handleSupplyLiquidity = () => {
    const valA = parseFloat(liqAmountA);
    const valB = parseFloat(liqAmountB);
    if (!valA || valA <= 0 || !valB || valB <= 0) {
      setLiqError("Please enter valid deposit amounts.");
      return;
    }
    if (valA > (balances[currentPool.tokenA] || 0)) {
      setLiqError(`Insufficient ${currentPool.tokenA} balance.`);
      return;
    }
    if (valB > (balances[currentPool.tokenB] || 0)) {
      setLiqError(`Insufficient ${currentPool.tokenB} balance.`);
      return;
    }

    setSupplying(true);
    setLiqError(null);
    setLiqSuccess(null);

    setTimeout(() => {
      // 0.2% fee charged on supplied liquidity
      const feeMultiplier = 0.998;
      const netValA = Number((valA * feeMultiplier).toFixed(6));
      const netValB = Number((valB * feeMultiplier).toFixed(6));

      // Deduct full deposit from balances
      const newBalances = {
        ...balances,
        [currentPool.tokenA]: Number((balances[currentPool.tokenA] - valA).toFixed(6)),
        [currentPool.tokenB]: Number((balances[currentPool.tokenB] - valB).toFixed(6))
      };
      setBalances(newBalances);

      const mintedLP = (Math.sqrt(netValA * netValB)).toFixed(2);
      const newPosition = {
        id: `pos-${Date.now()}`,
        poolId: currentPool.id,
        tokenA: currentPool.tokenA,
        tokenB: currentPool.tokenB,
        lpTokens: parseFloat(mintedLP),
        share: `${((netValA / (currentPool.reserveA + netValA)) * 100).toFixed(3)}%`,
        pooledA: netValA,
        pooledB: netValB,
        earnedFees: "$0.00"
      };

      setMyPositions([newPosition, ...myPositions]);
      setLiqSuccess({
        pool: currentPool.id,
        deposited: `${valA} ${currentPool.tokenA} + ${valB} ${currentPool.tokenB}`,
        lp: `${mintedLP} ${currentPool.id} LP Tokens`,
        hash: "tx_thruvm_lp_" + Math.random().toString(36).substring(2, 12)
      });
      setTimeout(() => setLiqSuccess(null), 8000);

      setLiqAmountA("");
      setLiqAmountB("");
      setSupplying(false);
    }, 900);
  };

  // Remove Position
  const handleRemovePosition = (posId) => {
    const pos = myPositions.find(p => p.id === posId);
    if (!pos) return;
    
    // Return tokens
    const newBalances = {
      ...balances,
      [pos.tokenA]: Number((balances[pos.tokenA] + pos.pooledA).toFixed(6)),
      [pos.tokenB]: Number((balances[pos.tokenB] + pos.pooledB).toFixed(6))
    };
    setBalances(newBalances);
    setMyPositions(myPositions.filter(p => p.id !== posId));
  };

  // Reset balances to default test amounts
  const handleResetBalances = () => {
    setBalances(INITIAL_BALANCES);
    setSwapSuccess(null);
    setSwapError(null);
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "104px 24px 100px", fontFamily: "DM Sans, sans-serif" }}>
      
      {/* TOP-RIGHT CORNER POPUPS */}
      <div style={{
        position: "fixed",
        top: "84px",
        right: "24px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
        width: "calc(100vw - 48px)",
        pointerEvents: "none"
      }}>
        {/* Swap Success Popup */}
        {swapSuccess && (
          <div style={{
            pointerEvents: "auto",
            background: "#ffffff",
            border: "1px solid #86efac",
            borderLeft: "4px solid #16a34a",
            borderRadius: "16px",
            padding: "16px 18px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontSize: "14px", fontWeight: "700" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "bold" }}>✓</span>
                Swap Executed Successfully
              </div>
              <button
                onClick={() => setSwapSuccess(null)}
                style={{ background: "none", border: "none", color: "#7a8a9a", cursor: "pointer", fontSize: "18px", padding: "0 4px", lineHeight: "1" }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "#15803d", paddingLeft: "26px" }}>
              Swapped <strong>{swapSuccess.from}</strong> for <strong>{swapSuccess.to}</strong>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#7a8a9a", paddingLeft: "26px", wordBreak: "break-all" }}>
              Tx: {swapSuccess.hash}
            </div>
          </div>
        )}

        {/* Liquidity Success Popup */}
        {liqSuccess && (
          <div style={{
            pointerEvents: "auto",
            background: "#ffffff",
            border: "1px solid #86efac",
            borderLeft: "4px solid #16a34a",
            borderRadius: "16px",
            padding: "16px 18px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontSize: "14px", fontWeight: "700" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "bold" }}>✓</span>
                Liquidity Supplied Successfully
              </div>
              <button
                onClick={() => setLiqSuccess(null)}
                style={{ background: "none", border: "none", color: "#7a8a9a", cursor: "pointer", fontSize: "18px", padding: "0 4px", lineHeight: "1" }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "#15803d", paddingLeft: "26px" }}>
              Minted <strong>{liqSuccess.lp}</strong>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#7a8a9a", paddingLeft: "26px", wordBreak: "break-all" }}>
              Tx: {liqSuccess.hash}
            </div>
          </div>
        )}
      </div>

      {/* HEADER SECTION */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#f0f3f6",
          padding: "6px 14px",
          borderRadius: "100px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#1a1a1a",
          marginBottom: "16px",
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C0392B" }} />
          ThruVM AMM Engine
        </div>
        <h1 style={{ fontSize: "38px", fontWeight: "normal", color: "#1a1a1a", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Swap & Add Liquidity
        </h1>
        <p style={{ color: "#7a8a9a", fontSize: "16px", maxWidth: "600px", margin: "0 auto 28px", lineHeight: "1.6" }}>
          Trade native tokens and supply liquidity on Thru's high-speed RISC-V automated market maker.
        </p>

        {/* MODE TOGGLE PILLS */}
        <div style={{
          display: "inline-flex",
          background: "#f0f3f6",
          padding: "5px",
          borderRadius: "14px",
          border: "1px solid #c8d0da"
        }}>
          <button
            onClick={() => { setMode("swap"); setSwapSuccess(null); setSwapError(null); }}
            style={{
              padding: "10px 32px",
              borderRadius: "10px",
              border: "none",
              background: mode === "swap" ? "#1a1a1a" : "transparent",
              color: mode === "swap" ? "#ffffff" : "#7a8a9a",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Swap
          </button>
          <button
            onClick={() => { setMode("liquidity"); setLiqSuccess(null); setLiqError(null); }}
            style={{
              padding: "10px 32px",
              borderRadius: "10px",
              border: "none",
              background: mode === "liquidity" ? "#1a1a1a" : "transparent",
              color: mode === "liquidity" ? "#ffffff" : "#7a8a9a",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Add Liquidity
          </button>
        </div>
      </div>

      {/* WALLET BALANCE BAR */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #c8d0da",
        borderRadius: "18px",
        padding: "20px 24px",
        marginBottom: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "16px"
      }}>
        {/* Balances Row - Centered */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px"
        }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", letterSpacing: "0.02em" }}>
            Test Wallet Balances:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
            {TOKENS.map(t => (
              <span key={t.symbol} style={{
                background: "#f7f9fa",
                border: "1px solid #e4e9ef",
                borderRadius: "10px",
                padding: "4px 10px",
                fontSize: "12px",
                color: "#1a1a1a",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <TokenIcon symbol={t.symbol} size={15} />
                <strong style={{ color: t.color }}>{t.symbol}</strong>: {(balances[t.symbol] || 0).toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {/* Buttons Row - Centered */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap"
        }}>
          {/* Sync On-Chain Button */}
          <button
            onClick={handleSyncOnchain}
            disabled={syncingOnchain}
            title="Queries the live Thru node RPC (thru getbalance) to sync your real on-chain THRU funds"
            style={{
              background: "#f0f3f6",
              border: "1px solid #c8d0da",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#1a1a1a",
              cursor: syncingOnchain ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { if (!syncingOnchain) e.currentTarget.style.borderColor = "#C0392B"; }}
            onMouseLeave={e => { if (!syncingOnchain) e.currentTarget.style.borderColor = "#c8d0da"; }}
          >
            <span>{syncingOnchain ? "Syncing..." : "Sync On-Chain (THRU)"}</span>
          </button>

          {/* Claim from Treasury Button */}
          {setSection && (
            <button
              onClick={() => setSection("faucet")}
              title="Claim THRU, tSOL, tUSD, tETH, or tBTC from the Community Treasury"
              style={{
                background: "#1a1a1a",
                border: "none",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#ffffff",
                cursor: "pointer",
                transition: "opacity 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              + Claim from Treasury
            </button>
          )}

          {/* Reset Balances Button */}
          <button
            onClick={handleResetBalances}
            style={{
              background: "none",
              border: "1px solid #c8d0da",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "12px",
              color: "#7a8a9a",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#1a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#7a8a9a"; e.currentTarget.style.borderColor = "#c8d0da"; }}
          >
            Reset ↻
          </button>
        </div>

        {/* Sync Status Banner - Centered */}
        {syncMessage && (
          <div style={{
            background: "#f4fcf6",
            border: "1px solid #c3e6cb",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "12px",
            color: "#27ae60",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px"
          }}>
            <span>{syncMessage}</span>
            <button
              onClick={() => setSyncMessage(null)}
              style={{ background: "none", border: "none", color: "#7a8a9a", cursor: "pointer", fontSize: "14px", lineHeight: "1" }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SWAP CARD MODE */}
      {/* ========================================================================= */}
      {mode === "swap" && (
        <div style={{ maxWidth: "480px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid #c8d0da",
            borderRadius: "24px",
            padding: "28px 24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
            boxSizing: "border-box",
            width: "100%"
          }}>
            
            {/* Header + Settings */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "17px", fontWeight: "600", color: "#1a1a1a" }}>
                Swap
              </div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  style={{
                    background: "none",
                    border: "1px solid #c8d0da",
                    borderRadius: "10px",
                    width: "34px",
                    height: "34px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7a8a9a",
                    transition: "all 0.2s"
                  }}
                  title="Slippage settings"
                >
                  ⚙
                </button>

                {/* Slippage Settings Dropdown */}
                {showSettings && (
                  <div style={{
                    position: "absolute",
                    right: 0,
                    top: "42px",
                    background: "#ffffff",
                    border: "1px solid #c8d0da",
                    borderRadius: "16px",
                    padding: "16px",
                    width: "240px",
                    zIndex: 50,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
                  }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", marginBottom: "8px" }}>
                      Slippage Tolerance
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["0.1", "0.5", "1.0"].map(s => (
                        <button
                          key={s}
                          onClick={() => { setSlippage(s); setShowSettings(false); }}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: "8px",
                            border: slippage === s ? "1px solid #1a1a1a" : "1px solid #c8d0da",
                            background: slippage === s ? "#1a1a1a" : "#ffffff",
                            color: slippage === s ? "#ffffff" : "#7a8a9a",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FROM INPUT BOX */}
            <div style={{
              background: "#f7f9fa",
              border: "1px solid #e4e9ef",
              borderRadius: "18px",
              padding: "16px 18px",
              marginBottom: "10px",
              boxSizing: "border-box",
              width: "100%"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#7a8a9a", fontWeight: "500" }}>You Pay</span>
                <span style={{ fontSize: "12px", color: "#7a8a9a" }}>
                  Balance: <strong>{(balances[fromToken] || 0).toLocaleString()}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", boxSizing: "border-box" }}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={e => {
                    const val = e.target.value.replace(/,/g, ".");
                    if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      handleFromChange(val);
                    }
                  }}
                  style={{
                    flex: "1 1 0%",
                    minWidth: 0,
                    width: "100%",
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    outline: "none",
                    fontFamily: "DM Sans, sans-serif"
                  }}
                />
                
                {/* Max Button */}
                <button
                  onClick={() => handleFromChange(String(balances[fromToken] || 0))}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #c8d0da",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#C0392B",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  MAX
                </button>

                {/* Token Selector with Logo */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ffffff",
                  border: "1px solid #c8d0da",
                  borderRadius: "12px",
                  padding: "5px 10px",
                  flexShrink: 0
                }}>
                  <TokenIcon symbol={fromToken} size={20} />
                  <select
                    value={fromToken}
                    onChange={e => {
                      const newFrom = e.target.value;
                      if (newFrom === toToken) setToToken(fromToken);
                      setFromToken(newFrom);
                      setFromAmount("");
                      setToAmount("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      outline: "none",
                      fontFamily: "DM Sans, sans-serif",
                      paddingRight: "2px"
                    }}
                  >
                    {TOKENS.map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#a0aec0", marginTop: "4px" }}>
                ≈ ${fromAmount && !isNaN(fromAmount) ? (parseFloat(fromAmount) * fromObj.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} USD
              </div>
            </div>

            {/* FLIP BUTTON */}
            <div style={{ textAlign: "center", margin: "-18px 0", position: "relative", zIndex: 10 }}>
              <button
                onClick={handleFlip}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid #c8d0da",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "rotate(180deg)"}
                onMouseLeave={e => e.currentTarget.style.transform = "rotate(0deg)"}
                title="Switch tokens"
              >
                ⇅
              </button>
            </div>

            {/* TO INPUT BOX */}
            <div style={{
              background: "#f7f9fa",
              border: "1px solid #e4e9ef",
              borderRadius: "18px",
              padding: "16px 18px",
              marginTop: "10px",
              marginBottom: "20px",
              boxSizing: "border-box",
              width: "100%"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#7a8a9a", fontWeight: "500" }}>You Receive</span>
                <span style={{ fontSize: "12px", color: "#7a8a9a" }}>
                  Balance: <strong>{(balances[toToken] || 0).toLocaleString()}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", boxSizing: "border-box" }}>
                <input
                  type="text"
                  placeholder="0.0"
                  readOnly
                  value={toAmount}
                  style={{
                    flex: "1 1 0%",
                    minWidth: 0,
                    width: "100%",
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    outline: "none",
                    fontFamily: "DM Sans, sans-serif"
                  }}
                />

                {/* Token Selector with Logo */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ffffff",
                  border: "1px solid #c8d0da",
                  borderRadius: "12px",
                  padding: "5px 10px",
                  flexShrink: 0
                }}>
                  <TokenIcon symbol={toToken} size={20} />
                  <select
                    value={toToken}
                    onChange={e => {
                      const newTo = e.target.value;
                      if (newTo === fromToken) setFromToken(toToken);
                      setToToken(newTo);
                      setFromAmount("");
                      setToAmount("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      outline: "none",
                      fontFamily: "DM Sans, sans-serif",
                      paddingRight: "2px"
                    }}
                  >
                    {TOKENS.map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#a0aec0", marginTop: "4px" }}>
                ≈ ${toAmount && !isNaN(toAmount) ? (parseFloat(toAmount) * toObj.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} USD
              </div>
            </div>

            {/* EXCHANGE RATE & ROUTE DETAILS */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #e4e9ef",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "20px",
              fontSize: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#7a8a9a" }}>Rate</span>
                <span style={{ color: "#1a1a1a", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <TokenIcon symbol={fromToken} size={14} /> 1 {fromToken} ≈ <TokenIcon symbol={toToken} size={14} /> {(currentRate * 0.998).toFixed(4)} {toToken}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#7a8a9a" }}>Slippage Tolerance</span>
                <span style={{ color: "#1a1a1a", fontWeight: "600" }}>{slippage}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a8a9a" }}>Routing</span>
                <span style={{ color: "#C0392B", fontWeight: "600" }}>Direct ThruVM Pool</span>
              </div>
            </div>

            {/* ERROR ALERT */}
            {swapError && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#dc2626",
                textAlign: "center"
              }}>
                {swapError}
              </div>
            )}



            {/* SWAP BUTTON */}
            <button
              onClick={handleSwap}
              disabled={swapping || !fromAmount || parseFloat(fromAmount) <= 0}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                background: swapping ? "#7a8a9a" : (!fromAmount || parseFloat(fromAmount) <= 0) ? "#e4e9ef" : "#1a1a1a",
                color: (!fromAmount || parseFloat(fromAmount) <= 0) ? "#94a3b8" : "#ffffff",
                fontSize: "15px",
                fontWeight: "600",
                cursor: (!fromAmount || parseFloat(fromAmount) <= 0 || swapping) ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
              }}
            >
              {swapping
                ? "Simulating & Executing on ThruVM..."
                : !fromAmount
                ? "Enter an Amount"
                : parseFloat(fromAmount) > (balances[fromToken] || 0)
                ? `Insufficient ${fromToken} Balance`
                : `Swap ${fromToken} for ${toToken}`}
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD LIQUIDITY MODE */}
      {/* ========================================================================= */}
      {mode === "liquidity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          <div style={{ maxWidth: "560px", margin: "0 auto", width: "100%" }}>
            <div style={{
              background: "#ffffff",
              border: "1px solid #c8d0da",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
            }}>
              
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#1a1a1a", marginBottom: "6px" }}>
                Add Liquidity to Pool
              </div>
              <p style={{ fontSize: "13px", color: "#7a8a9a", margin: "0 0 24px" }}>
                Deposit pairs to receive LP tokens and earn pool trading rewards proportionally.
              </p>

              {/* POOL SELECTOR BUTTONS */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", marginBottom: "8px" }}>
                  Select Liquidity Pool
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {INITIAL_POOLS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPoolId(p.id);
                        setLiqAmountA("");
                        setLiqAmountB("");
                        setLiqSuccess(null);
                        setLiqError(null);
                      }}
                      style={{
                        padding: "12px 10px",
                        borderRadius: "14px",
                        border: selectedPoolId === p.id ? "2px solid #1a1a1a" : "1px solid #c8d0da",
                        background: selectedPoolId === p.id ? "#f7f9fa" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>
                        <TokenIcon symbol={p.tokenA} size={18} style={{ zIndex: 2 }} />
                        <TokenIcon symbol={p.tokenB} size={18} style={{ marginLeft: "-6px", zIndex: 1 }} />
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>{p.id}</div>
                      <div style={{ fontSize: "11px", color: "#C0392B", fontWeight: "600", marginTop: "2px" }}>{p.apr} APR</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* TOKEN A INPUT */}
              <div style={{
                background: "#f7f9fa",
                border: "1px solid #e4e9ef",
                borderRadius: "18px",
                padding: "16px 20px",
                marginBottom: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#7a8a9a" }}>Deposit {currentPool.tokenA}</span>
                  <span style={{ fontSize: "12px", color: "#7a8a9a" }}>
                    Balance: <strong>{(balances[currentPool.tokenA] || 0).toLocaleString()}</strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={liqAmountA}
                    onChange={e => handleLiqAChange(e.target.value)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      fontSize: "22px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => handleLiqAChange(String(balances[currentPool.tokenA] || 0))}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #c8d0da",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#C0392B",
                      cursor: "pointer"
                    }}
                  >
                    MAX
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "14px", color: "#1a1a1a" }}>
                    <TokenIcon symbol={currentPool.tokenA} size={18} />
                    <span>{currentPool.tokenA}</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", fontSize: "16px", color: "#7a8a9a", margin: "-4px 0 8px" }}>
                +
              </div>

              {/* TOKEN B INPUT */}
              <div style={{
                background: "#f7f9fa",
                border: "1px solid #e4e9ef",
                borderRadius: "18px",
                padding: "16px 20px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#7a8a9a" }}>Deposit {currentPool.tokenB}</span>
                  <span style={{ fontSize: "12px", color: "#7a8a9a" }}>
                    Balance: <strong>{(balances[currentPool.tokenB] || 0).toLocaleString()}</strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={liqAmountB}
                    onChange={e => handleLiqBChange(e.target.value)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      fontSize: "22px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => handleLiqBChange(String(balances[currentPool.tokenB] || 0))}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #c8d0da",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#C0392B",
                      cursor: "pointer"
                    }}
                  >
                    MAX
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "14px", color: "#1a1a1a" }}>
                    <TokenIcon symbol={currentPool.tokenB} size={18} />
                    <span>{currentPool.tokenB}</span>
                  </div>
                </div>
              </div>

              {/* POOL RATIO & METRICS */}
              <div style={{
                background: "#ffffff",
                border: "1px solid #e4e9ef",
                borderRadius: "14px",
                padding: "14px 16px",
                marginBottom: "20px",
                fontSize: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#7a8a9a" }}>Pool Ratio</span>
                  <span style={{ color: "#1a1a1a", fontWeight: "600" }}>
                    1 {currentPool.tokenA} = {poolPriceRatio.toFixed(4)} {currentPool.tokenB}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#7a8a9a" }}>Estimated Pool APR</span>
                  <span style={{ color: "#166534", fontWeight: "700" }}>{currentPool.apr}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7a8a9a" }}>Current Pool TVL</span>
                  <span style={{ color: "#1a1a1a", fontWeight: "600" }}>{currentPool.tvl}</span>
                </div>
              </div>

              {/* ERROR ALERT */}
              {liqError && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#dc2626",
                  textAlign: "center"
                }}>
                  {liqError}
                </div>
              )}



              {/* SUPPLY BUTTON */}
              <button
                onClick={handleSupplyLiquidity}
                disabled={supplying || !liqAmountA || parseFloat(liqAmountA) <= 0}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "none",
                  background: supplying ? "#7a8a9a" : (!liqAmountA || parseFloat(liqAmountA) <= 0) ? "#e4e9ef" : "#1a1a1a",
                  color: (!liqAmountA || parseFloat(liqAmountA) <= 0) ? "#94a3b8" : "#ffffff",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: (!liqAmountA || parseFloat(liqAmountA) <= 0 || supplying) ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                {supplying ? "Supplying to ThruVM Pool..." : "Supply Liquidity"}
              </button>

            </div>
          </div>

          {/* MY LIQUIDITY POSITIONS */}
          <div style={{ maxWidth: "760px", margin: "0 auto", width: "100%" }}>
            <div style={{
              background: "#ffffff",
              border: "1px solid #c8d0da",
              borderRadius: "24px",
              padding: "32px"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 16px" }}>
                My Liquidity Positions ({myPositions.length})
              </h3>

              {myPositions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#7a8a9a", fontSize: "14px" }}>
                  You do not have any active liquidity positions yet. Supply liquidity above to start earning swap fees.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {myPositions.map(pos => (
                    <div key={pos.id} style={{
                      background: "#f7f9fa",
                      border: "1px solid #e4e9ef",
                      borderRadius: "16px",
                      padding: "18px 20px",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px"
                    }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                          {pos.poolId} Pool
                        </div>
                        <div style={{ fontSize: "12px", color: "#7a8a9a" }}>
                          Pooled: <strong>{pos.pooledA} {pos.tokenA}</strong> + <strong>{pos.pooledB} {pos.tokenB}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>
                          {pos.lpTokens} LP
                        </div>
                        <div style={{ fontSize: "11px", color: "#166534", fontWeight: "600" }}>
                          Share: {pos.share} • Earned: {pos.earnedFees}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemovePosition(pos.id)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #c8d0da",
                          borderRadius: "10px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#C0392B",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#C0392B"; e.currentTarget.style.color = "#ffffff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#C0392B"; }}
                      >
                        Remove Liquidity
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
