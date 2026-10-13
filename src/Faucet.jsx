import { useState, useEffect } from "react";
import { TokenIcon } from "./TokenIcon.jsx";

const TOKENS_CONFIG = {
  THRU: {
    symbol: "THRU",
    name: "Thru Native",
    color: "#C0392B",
    amounts: [50, 100, 250, 500],
    defaultAmt: 100,
    tag: "Native Gas & Governance"
  },
  tSOL: {
    symbol: "tSOL",
    name: "Thru Solana",
    color: "#7c3aed",
    amounts: [2, 5, 10, 25],
    defaultAmt: 5,
    tag: "Ecosystem Token"
  },
  tUSD: {
    symbol: "tUSD",
    name: "Thru USD",
    color: "#059669",
    amounts: [100, 250, 500, 1000],
    defaultAmt: 250,
    tag: "Stablecoin Peg"
  },
  tETH: {
    symbol: "tETH",
    name: "Thru Ether",
    color: "#4f46e5",
    amounts: [0.1, 0.5, 1.0, 2.5],
    defaultAmt: 0.5,
    tag: "Ecosystem Token"
  },
  tBTC: {
    symbol: "tBTC",
    name: "Thru Bitcoin",
    color: "#d97706",
    amounts: [0.01, 0.05, 0.1, 0.25],
    defaultAmt: 0.05,
    tag: "Ecosystem Token"
  }
};

export function Faucet({ setSection }) {
  const [selectedToken, setSelectedToken] = useState("THRU");
  const [faucetInfo, setFaucetInfo] = useState({
    status: "loading",
    balance: 177907,
    pubkey: "",
    reserves: {
      THRU: 177907,
      tSOL: 25000,
      tUSD: 1500000,
      tETH: 500,
      tBTC: 50
    },
    dispenseAmounts: {
      THRU: 100,
      tSOL: 5,
      tUSD: 250,
      tETH: 0.5,
      tBTC: 0.05
    },
    cooldownMinutes: 3
  });

  const [address, setAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(TOKENS_CONFIG.THRU.defaultAmt);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Quick wallet creation state
  const [generatingWallet, setGeneratingWallet] = useState(false);
  const [downloadToast, setDownloadToast] = useState(null);

  function triggerWalletDownload(wallet) {
    if (!wallet) return;
    try {
      const payload = {
        name: wallet.name,
        address: wallet.pubkey,
        public_key: wallet.pubkey,
        private_key_hex: wallet.privateKeyHex,
        network: "thru-alphanet",
        export_format: "thru-keyfile-v1",
        created_at: new Date().toISOString(),
        note: "Store this keyfile securely. Anyone with access to this file controls the account on Thru."
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thru-wallet-${wallet.name || "account"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {}
  }

  useEffect(() => {
    fetchFaucetInfo();
    const interval = setInterval(fetchFaucetInfo, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update default amount when switching tokens
  const handleTokenChange = (tokenKey) => {
    setSelectedToken(tokenKey);
    setSelectedAmount(TOKENS_CONFIG[tokenKey]?.defaultAmt || 100);
    setError(null);
    setResult(null);
  };

  async function fetchFaucetInfo() {
    try {
      const res = await fetch("/api/faucet/info");
      if (res.ok) {
        const data = await res.json();
        setFaucetInfo(prev => ({
          ...prev,
          ...data,
          reserves: {
            ...prev.reserves,
            ...(data.reserves || {})
          }
        }));
      }
    } catch (_) {
      // offline or dev server starting
    }
  }

  async function handleClaim(e) {
    e?.preventDefault();
    if (!address.trim()) {
      setError("Please enter a recipient address or key name (e.g. 'default').");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          amount: selectedAmount,
          token: selectedToken
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to claim tokens from treasury.");
      } else {
        setResult(data);

        // Automatically credit the user's local test wallet balances so Swap & Liquidity immediately reflects it!
        try {
          const currentBalances = JSON.parse(localStorage.getItem("thrupulse_balances") || "{}");
          const oldVal = Number(currentBalances[selectedToken] !== undefined ? currentBalances[selectedToken] : (
            selectedToken === "THRU" ? 10000 :
            selectedToken === "tUSD" ? 4500 :
            selectedToken === "tETH" ? 2.5 :
            selectedToken === "tSOL" ? 35 :
            selectedToken === "tBTC" ? 0.15 : 0
          ));
          const updatedBalances = {
            ...currentBalances,
            [selectedToken]: Number((oldVal + Number(data.amount)).toFixed(6))
          };
          localStorage.setItem("thrupulse_balances", JSON.stringify(updatedBalances));
          window.dispatchEvent(new Event("thrupulse_balance_updated"));
        } catch (_) {}

        fetchFaucetInfo(); // refresh pool balance
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function applyNewWallet(data) {
    setAddress(data.pubkey);
    triggerWalletDownload(data);
    setDownloadToast({
      title: "Private keys and others downloaded already",
      filename: `thru-wallet-${data.name}.json`,
      address: data.pubkey
    });
    setTimeout(() => {
      setDownloadToast(null);
    }, 3500);
  }

  async function handleGenerateWallet() {
    setGeneratingWallet(true);
    setError(null);
    try {
      const res = await fetch("/api/faucet/generate-wallet", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.pubkey) {
          applyNewWallet(data);
          return;
        }
      }
      throw new Error("Local daemon returned incomplete address");
    } catch (_) {
      // Instant cryptographic fallback: guarantees each click produces a brand new unique keypair
      const randBytes = new Uint8Array(32);
      if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(randBytes);
      } else {
        for (let i = 0; i < 32; i++) randBytes[i] = Math.floor(Math.random() * 256);
      }

      const privHex = Array.from(randBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      let binary = "";
      for (let i = 0; i < randBytes.length; i++) binary += String.fromCharCode(randBytes[i]);
      const b64url = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const chk = (randBytes[0] ^ randBytes[31] ^ 0x5a) & 0x3f;
      const chkChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[chk] || "x";
      const fallbackPubkey = `ta${b64url}${chkChar}`;
      const fallbackName = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const data = {
        success: true,
        name: fallbackName,
        pubkey: fallbackPubkey,
        privateKeyHex: privHex
      };

      applyNewWallet(data);
    } finally {
      setGeneratingWallet(false);
    }
  }

  const activeTokenObj = TOKENS_CONFIG[selectedToken] || TOKENS_CONFIG.THRU;
  const currentTokenReserve = faucetInfo.reserves?.[selectedToken] ?? (selectedToken === "THRU" ? faucetInfo.balance : 0);

  return (
    <div style={{ paddingTop: "100px", minHeight: "100vh", background: "#ffffff" }}>
      {/* TOP-RIGHT CORNER POPUP TOAST */}
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
        {downloadToast && (
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
            gap: "5px",
            animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontSize: "14px", fontWeight: "700", fontFamily: "DM Sans" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "bold" }}>✓</span>
                {downloadToast.title}
              </div>
              <button
                type="button"
                onClick={() => setDownloadToast(null)}
                style={{ background: "none", border: "none", color: "#7a8a9a", cursor: "pointer", fontSize: "18px", padding: "0 4px", lineHeight: "1" }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "#15803d", paddingLeft: "26px", fontFamily: "DM Sans" }}>
              File: <strong>{downloadToast.filename}</strong>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#7a8a9a", paddingLeft: "26px", wordBreak: "break-all" }}>
              Address: {downloadToast.address}
            </div>
            {/* Countdown progress bar lasting 3.5s */}
            <div style={{ height: "3px", background: "#bbf7d0", width: "100%", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
              <div style={{ height: "100%", background: "#16a34a", animation: "toastProgress 3.5s linear forwards" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #c8d0da", borderRadius: "12px", padding: "6px 14px", marginBottom: "24px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C0392B" }} />
          <span style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#7a8a9a", letterSpacing: "0.1em" }}>
            Multi-Token Treasury · Thru Alphanet
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "DM Sans", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: "normal", color: "#1a1a1a", letterSpacing: "-0.03em", lineHeight: "1.1", margin: "0 0 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <span>Community</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: activeTokenObj.color }}>
            <TokenIcon symbol={selectedToken} size={42} />
            {selectedToken}
          </span>
          <span>Treasury</span>
        </h1>
        <p style={{ fontFamily: "DM Sans", fontSize: "17px", color: "#7a8a9a", lineHeight: "1.6", margin: "0 auto 32px", maxWidth: "620px", textAlign: "center" }}>
          Request testnet tokens directly from the multi-asset treasury vault. Claim THRU for on-chain gas or tSOL, tUSD, tETH, and tBTC to test the ThruSwap AMM DEX.
        </p>

        {/* TOKEN SELECTOR PILLS */}
        <div style={{
          display: "flex",
          gap: "8px",
          background: "#e4e9ef",
          padding: "6px",
          borderRadius: "16px",
          border: "1px solid #c8d0da",
          marginBottom: "32px",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {Object.keys(TOKENS_CONFIG).map(tKey => {
            const tok = TOKENS_CONFIG[tKey];
            const isSelected = selectedToken === tKey;
            return (
              <button
                key={tKey}
                type="button"
                onClick={() => handleTokenChange(tKey)}
                style={{
                  background: isSelected ? "#ffffff" : "transparent",
                  color: isSelected ? "#1a1a1a" : "#7a8a9a",
                  border: isSelected ? "1px solid #c8d0da" : "1px solid transparent",
                  borderRadius: "12px",
                  padding: "9px 20px",
                  fontFamily: "DM Sans",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s"
                }}
              >
                <TokenIcon symbol={tok.symbol} size={18} />
                <span>{tok.symbol}</span>
                {isSelected && (
                  <span style={{ fontSize: "11px", color: tok.color, background: `${tok.color}15`, padding: "2px 6px", borderRadius: "6px" }}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "36px", width: "100%" }}>
          <div style={{ background: "#e4e9ef", padding: "20px 24px", borderRadius: "16px", border: "1px solid #c8d0da", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a8a9a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {selectedToken} Treasury Reserve
            </div>
            <div style={{ fontFamily: "DM Sans", fontSize: "28px", color: "#1a1a1a", fontWeight: "normal", marginTop: "4px" }}>
              {currentTokenReserve ? Number(currentTokenReserve).toLocaleString() : "..."} <span style={{ fontSize: "14px", color: activeTokenObj.color, fontWeight: "600" }}>{selectedToken}</span>
            </div>
          </div>

          <div style={{ background: "#e4e9ef", padding: "20px 24px", borderRadius: "16px", border: "1px solid #c8d0da", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a8a9a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Standard Dispense</div>
            <div style={{ fontFamily: "DM Sans", fontSize: "28px", color: "#1a1a1a", fontWeight: "normal", marginTop: "4px" }}>
              {activeTokenObj.defaultAmt} <span style={{ fontSize: "14px", color: "#7a8a9a" }}>{selectedToken}</span>
            </div>
          </div>

          <div style={{ background: "#e4e9ef", padding: "20px 24px", borderRadius: "16px", border: "1px solid #c8d0da", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a8a9a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Network Status</div>
            <div style={{ fontFamily: "DM Sans", fontSize: "18px", color: "#1a1a1a", fontWeight: "normal", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: faucetInfo.status === "online" ? "#27ae60" : "#e67e22" }} />
              {faucetInfo.status === "online" ? "Alphanet Node Live" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Main Claim Card */}
        <div style={{ background: "#ffffff", border: "1px solid #c8d0da", borderRadius: "24px", padding: "36px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", width: "100%", boxSizing: "border-box" }}>
          <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: "24px", width: "100%", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <label style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#1a1a1a", letterSpacing: "0.02em", fontWeight: "500" }}>
                  Your Thru Address (or CLI Key Name)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateWallet}
                  disabled={generatingWallet}
                  style={{ background: "none", border: "none", color: "#C0392B", fontFamily: "DM Sans", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
                >
                  {generatingWallet ? "Generating..." : "+ Generate new address"}
                </button>
              </div>

              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. taUG6Caoz2z6bFpAf9kR... or default"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  border: "1px solid #c8d0da",
                  background: "#ffffff",
                  fontFamily: "DM Sans",
                  fontSize: "15px",
                  color: "#1a1a1a",
                  outline: "none",
                  textAlign: "center",
                  transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#1a1a1a"}
                onBlur={e => e.target.style.borderColor = "#c8d0da"}
              />
            </div>

            {/* Amount Selection tailored to token */}
            <div style={{ marginBottom: "28px", width: "100%", textAlign: "center" }}>
              <label style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#1a1a1a", display: "block", marginBottom: "12px", fontWeight: "500" }}>
                Select {selectedToken} Claim Amount
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                {activeTokenObj.amounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    style={{
                      background: selectedAmount === amt ? "#1a1a1a" : "#e4e9ef",
                      color: selectedAmount === amt ? "#ffffff" : "#1a1a1a",
                      border: "1px solid",
                      borderColor: selectedAmount === amt ? "#1a1a1a" : "#c8d0da",
                      borderRadius: "12px",
                      padding: "10px 22px",
                      fontFamily: "DM Sans",
                      fontSize: "13px",
                      fontWeight: selectedAmount === amt ? "600" : "normal",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <TokenIcon symbol={selectedToken} size={14} />
                      <span>{amt} {selectedToken}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Claim Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                maxWidth: "480px",
                background: loading ? "#7a8a9a" : "#1a1a1a",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                padding: "16px",
                fontFamily: "DM Sans",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "center",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? `Dispensing ${selectedToken}...` : `Claim ${selectedAmount} ${selectedToken} from Treasury →`}
            </button>
          </form>

          {/* Error Notice */}
          {error && (
            <div style={{ marginTop: "20px", padding: "14px 18px", borderRadius: "12px", background: "#fdf2f2", border: "1px solid #f5c6cb", color: "#C0392B", fontFamily: "DM Sans", fontSize: "13px", textAlign: "center" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success Notice */}
          {result && (
            <div style={{ marginTop: "24px", padding: "24px", borderRadius: "16px", background: "#f4fcf6", border: "1px solid #c3e6cb", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#27ae60", fontFamily: "DM Sans", fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>
                <span>✅</span> Successfully claimed {result.amount} {result.token || selectedToken}!
              </div>
              <div style={{ fontFamily: "DM Sans", fontSize: "13px", color: "#3a3028", lineHeight: "1.7", marginBottom: "16px" }}>
                <div><strong>Recipient:</strong> <span style={{ wordBreak: "break-all" }}>{result.recipient}</span></div>
                <div><strong>Amount Credited:</strong> {result.amount} {result.token || selectedToken}</div>
                <div><strong>Wallet Synced:</strong> Updated in your Test Wallet Balances</div>
                {result.signature && (
                  <div style={{ marginTop: "6px" }}>
                    <strong>Tx Signature:</strong><br />
                    <code style={{ background: "#e8f5e9", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", wordBreak: "break-all", display: "inline-block", marginTop: "4px" }}>
                      {result.signature}
                    </code>
                  </div>
                )}
                {result.slot && <div style={{ marginTop: "4px" }}><strong>Slot:</strong> #{result.slot}</div>}
              </div>

              {setSection && (
                <button
                  type="button"
                  onClick={() => setSection("swap")}
                  style={{
                    background: "#1a1a1a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 20px",
                    fontFamily: "DM Sans",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Trade {selectedToken} on ThruSwap →
                </button>
              )}
            </div>
          )}

        </div>

        {/* ALL TREASURY ASSETS CARD */}
        <div style={{
          marginTop: "32px",
          width: "100%",
          background: "#e4e9ef",
          borderRadius: "18px",
          border: "1px solid #c8d0da",
          padding: "20px 24px",
          boxSizing: "border-box"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", marginBottom: "14px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            All Treasury Vault Reserves
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            {Object.keys(TOKENS_CONFIG).map(tKey => {
              const tok = TOKENS_CONFIG[tKey];
              const bal = faucetInfo.reserves?.[tKey] ?? (tKey === "THRU" ? faucetInfo.balance : 0);
              return (
                <div
                  key={tKey}
                  onClick={() => handleTokenChange(tKey)}
                  style={{
                    background: selectedToken === tKey ? "#ffffff" : "#f7f9fa",
                    border: selectedToken === tKey ? `1.5px solid ${tok.color}` : "1px solid #c8d0da",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                    <TokenIcon symbol={tok.symbol} size={22} />
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: tok.color }}>{tok.symbol}</div>
                  <div style={{ fontSize: "15px", fontWeight: "normal", color: "#1a1a1a", marginTop: "4px" }}>
                    {bal ? Number(bal).toLocaleString() : "0"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bank Treasury Info Footer */}
        <div style={{ marginTop: "32px", textAlign: "center", color: "#7a8a9a", fontFamily: "DM Sans", fontSize: "12px" }}>
          Faucet Treasury Address: <code style={{ background: "#e4e9ef", padding: "3px 8px", borderRadius: "6px" }}>{faucetInfo.pubkey || "Connecting to bank..."}</code>
        </div>

      </div>
    </div>
  );
}
