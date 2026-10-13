import { useState, useEffect } from "react";

export function Faucet() {
  const [faucetInfo, setFaucetInfo] = useState({
    status: "loading",
    balance: 0,
    pubkey: "",
    dispenseAmount: 100,
    cooldownMinutes: 5
  });

  const [address, setAddress] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Quick wallet creation state
  const [generatingWallet, setGeneratingWallet] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState(null);

  useEffect(() => {
    fetchFaucetInfo();
    const interval = setInterval(fetchFaucetInfo, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchFaucetInfo() {
    try {
      const res = await fetch("/api/faucet/info");
      if (res.ok) {
        const data = await res.json();
        setFaucetInfo(data);
      }
    } catch (_) {
      // offline or dev server starting
    }
  }

  async function handleClaim(e) {
    e?.preventDefault();
    if (!address.trim()) {
      setError("Please enter a recipient address or key name.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), amount: selectedAmount })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to claim tokens from faucet.");
      } else {
        setResult(data);
        fetchFaucetInfo(); // refresh pool balance
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateWallet() {
    setGeneratingWallet(true);
    setError(null);
    try {
      const res = await fetch("/api/faucet/generate-wallet", { method: "POST" });
      const data = await res.json();
      if (data.success && data.pubkey) {
        setGeneratedWallet(data);
        setAddress(data.pubkey);
      } else {
        setError(data.error || "Failed to generate wallet");
      }
    } catch (err) {
      setError(`Failed to generate wallet: ${err.message}`);
    } finally {
      setGeneratingWallet(false);
    }
  }

  return (
    <div style={{ paddingTop: "100px", minHeight: "100vh", background: "#ffffff" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #c8d0da", borderRadius: "12px", padding: "6px 14px", marginBottom: "28px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C0392B" }} />
          <span style={{ fontFamily: "DM Sans", fontSize: "11px", color: "#7a8a9a", letterSpacing: "0.1em" }}>
            Official Community Faucet · Thru Alphanet
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "DM Sans", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: "normal", color: "#1a1a1a", letterSpacing: "-0.03em", lineHeight: "1.1", margin: "0 0 16px", textAlign: "center" }}>
          Claim testnet <span style={{ color: "#C0392B" }}>THRU</span>
        </h1>
        <p style={{ fontFamily: "DM Sans", fontSize: "18px", color: "#7a8a9a", lineHeight: "1.6", margin: "0 auto 40px", maxWidth: "600px", textAlign: "center" }}>
          Request test tokens directly from our Faucet Treasury to test smart contracts, create accounts, and explore the Thru network.
        </p>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "36px", width: "100%" }}>
          <div style={{ background: "#e4e9ef", padding: "20px 24px", borderRadius: "16px", border: "1px solid #c8d0da", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a8a9a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Faucet Pool Balance</div>
            <div style={{ fontFamily: "DM Sans", fontSize: "28px", color: "#1a1a1a", fontWeight: "normal", marginTop: "4px" }}>
              {faucetInfo.balance ? faucetInfo.balance.toLocaleString() : "..."} <span style={{ fontSize: "14px", color: "#7a8a9a" }}>THRU</span>
            </div>
          </div>

          <div style={{ background: "#e4e9ef", padding: "20px 24px", borderRadius: "16px", border: "1px solid #c8d0da", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a8a9a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Default Dispense</div>
            <div style={{ fontFamily: "DM Sans", fontSize: "28px", color: "#1a1a1a", fontWeight: "normal", marginTop: "4px" }}>
              {faucetInfo.dispenseAmount} <span style={{ fontSize: "14px", color: "#7a8a9a" }}>THRU</span>
            </div>
          </div>

          <div style={{ background: "#e4e9ef", padding: "20px 24px", borderRadius: "16px", border: "1px solid #c8d0da", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#7a8a9a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Network Status</div>
            <div style={{ fontFamily: "DM Sans", fontSize: "20px", color: "#1a1a1a", fontWeight: "normal", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: faucetInfo.status === "online" ? "#27ae60" : "#e67e22" }} />
              {faucetInfo.status === "online" ? "Alphanet Live" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Main Claim Card */}
        <div style={{ background: "#ffffff", border: "1px solid #c8d0da", borderRadius: "24px", padding: "36px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", width: "100%", boxSizing: "border-box" }}>
          <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: "24px", width: "100%", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <label style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#1a1a1a", letterSpacing: "0.02em", fontWeight: "500" }}>
                  Your Thru Address (or Key Name)
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

            {/* Amount Selection */}
            <div style={{ marginBottom: "28px", width: "100%", textAlign: "center" }}>
              <label style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#1a1a1a", display: "block", marginBottom: "12px", fontWeight: "500" }}>
                Select Claim Amount
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                {[50, 100, 250, 500].map(amt => (
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
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    {amt} THRU
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
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "center",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Processing On-Chain Transaction..." : `Claim ${selectedAmount} THRU Tokens →`}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#27ae60", fontFamily: "DM Sans", fontSize: "15px", fontWeight: "bold", marginBottom: "12px" }}>
                <span>✅</span> Tokens successfully transferred!
              </div>
              <div style={{ fontFamily: "DM Sans", fontSize: "13px", color: "#3a3028", lineHeight: "1.7" }}>
                <div><strong>Recipient:</strong> <span style={{ wordBreak: "break-all" }}>{result.recipient}</span></div>
                <div><strong>Amount Sent:</strong> {result.amount} THRU</div>
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
            </div>
          )}

          {/* Newly Generated Wallet Notice */}
          {generatedWallet && (
            <div style={{ marginTop: "24px", padding: "20px", borderRadius: "16px", background: "#fffde7", border: "1px solid #fff59d", textAlign: "center" }}>
              <div style={{ fontFamily: "DM Sans", fontSize: "13px", fontWeight: "bold", color: "#795548", marginBottom: "8px" }}>
                🔑 Newly Generated Account:
              </div>
              <div style={{ fontFamily: "DM Sans", fontSize: "12px", color: "#5d4037", wordBreak: "break-all", lineHeight: "1.8" }}>
                <div><strong>Name:</strong> {generatedWallet.name}</div>
                <div><strong>Public Key:</strong> {generatedWallet.pubkey}</div>
                <div><strong>Private Key Hex:</strong> {generatedWallet.privateKeyHex}</div>
                <div style={{ color: "#c62828", marginTop: "6px" }}>* Saved locally in your CLI configuration.</div>
              </div>
            </div>
          )}
        </div>

        {/* Bank Treasury Info Footer */}
        <div style={{ marginTop: "40px", textAlign: "center", color: "#7a8a9a", fontFamily: "DM Sans", fontSize: "12px" }}>
          Faucet Treasury Address: {faucetInfo.pubkey || "Connecting to bank..."}
        </div>

      </div>
    </div>
  );
}
