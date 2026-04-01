import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const DAPPS = [
  {
    name: "KEA Wallet",
    category: "Wallet",
    description: "A passkey-powered wallet on Thru Chain. Sign in with Face ID, Touch ID, or a security key — no passwords, no seed phrases. Send and receive THRU tokens natively.",
    status: "Dev Preview",
    logo: null,
    url: "https://keawallet.com",
    highlights: ["Passkey Login", "Send & receive THRU", "Face ID / Touch ID"],
  },
  {
    name: "Thru Wallet",
    category: "Wallet",
    description: "The official pre-alpha wallet for the Thru blockchain. An early preview of the native wallet experience — unaudited and built for explorers.",
    status: "Pre-Alpha",
    logo: "⬡",
    url: "https://wallet.thru.org/",
    highlights: ["Official wallet", "Pre-alpha preview", "Native Thru experience"],
  },
];

// type: "external" → opens in new tab | type: "blog" → opens AI article view
const NEWS = [
  { id: 1, title: "Unto Labs Raises $14.4M to Build Thru", excerpt: "Electric Capital and Framework Ventures back Unto Labs in a combined round valuing the company at $140M.", source: "Thru Blog", date: "Apr 29, 2025", tag: "Funding", type: "blog" },
  { id: 2, title: "ThruVM: How RISC-V Redefines Smart Contract Execution", excerpt: "Thru's VM runs standard Rust and C++ compilers out of the box — no bespoke tooling required.", source: "Thru Blog", date: "Mar 15, 2025", tag: "Technology", type: "blog" },
  { id: 3, title: "Vitalik Proposes RISC-V for Ethereum — Thru Was Already There", excerpt: "Months before Buterin's proposal, Thru had already committed to RISC-V as its execution foundation.", source: "Thru Blog", date: "Apr 23, 2025", tag: "Ecosystem", type: "blog" },
  { id: 4, title: "Inside Thru's Consensus: Compete on Performance, Not Stake", excerpt: "Operators earn their spot with uptime and throughput — a fundamental rethink of validator economics.", source: "Thru Blog", date: "Feb 28, 2025", tag: "Research", type: "blog" },
  { id: 5, title: "Liam Heeger on Leaving Jump Crypto and Building Thru", excerpt: "The former Firedancer engineer on the legal battle, the vision, and why L1 scaling is far from over.", source: "Thru Blog", date: "May 10, 2025", tag: "Interview", type: "blog" },
  { id: 6, title: "Thru Testnet Is Live: What Builders Need to Know", excerpt: "Deploy RISC-V smart contracts using standard Rust toolchains. No custom compilers needed.", source: "Thru Blog", date: "Jun 3, 2025", tag: "Developer", type: "blog" },
];

const NEWS_TAGS = ["All", "Funding", "Technology", "Ecosystem", "Research", "Interview", "Developer"];

const TAG_COLORS = {
  Funding:    { bg: "#fef3c7", text: "#92400e" },
  Technology: { bg: "#dbeafe", text: "#1e40af" },
  Ecosystem:  { bg: "#d1fae5", text: "#065f46" },
  Research:   { bg: "#ede9fe", text: "#5b21b6" },
  Interview:  { bg: "#fce7f3", text: "#9d174d" },
  Developer:  { bg: "#f0fdf4", text: "#166534" },
};

const STATUS_COLORS = {
  "Dev Preview": { bg: "#dbeafe", text: "#1e40af" },
  "Pre-Alpha":   { bg: "#fef3c7", text: "#92400e" },
  "Coming Soon": { bg: "#f1f5f9", text: "#64748b" },
};

// ─── CANVAS ──────────────────────────────────────────────────────────────────

function NodeCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const N = 38;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1,
    }));
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(225,29,72,${0.12 * (1 - dist / 140)})`; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(225,29,72,0.35)"; ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const onResize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── COUNTER ─────────────────────────────────────────────────────────────────

function Counter({ end, prefix = "", suffix = "", decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = (ts) => {
          if (!start) start = ts;
          const prog = Math.min((ts - start) / 1400, 1);
          const ease = 1 - Math.pow(1 - prog, 3);
          setVal(parseFloat((ease * end).toFixed(decimals)));
          if (prog < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step); obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, decimals]);
  return <span ref={ref}>{prefix}{decimals ? val.toFixed(decimals) : Math.round(val)}{suffix}</span>;
}

// ─── REVEAL ──────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(22px)", transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav({ section, setSection, onBack, showBack }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0)",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: "64px", transition: "all 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => showBack ? onBack() : setSection("home")}>
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #4c0519 0%, #e11d48 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(225,29,72,0.35)" }}>
          <span style={{ color: "#fff", fontSize: "15px", fontWeight: "900", fontFamily: "Sora, sans-serif" }}>T</span>
        </div>
        <span style={{ fontFamily: "Sora, sans-serif", fontWeight: "800", fontSize: "15px", color: "#0f0c29", letterSpacing: "-0.03em" }}>
          thru<span style={{ color: "#e11d48" }}>Pulse</span>
        </span>
      </div>

      {showBack ? (
        <button onClick={onBack} style={{
          background: "none", border: "1.5px solid #e2e8f0", color: "#0f0c29",
          fontFamily: "Sora, sans-serif", fontSize: "12px", fontWeight: "700",
          padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px",
        }}>← Back to News</button>
      ) : (
        <div style={{ display: "flex", gap: "2px", background: "#f1f5f9", padding: "3px", borderRadius: "10px" }}>
          {["home", "protocols", "news"].map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              background: section === s ? "#fff" : "transparent",
              color: section === s ? "#0f0c29" : "#94a3b8",
              border: "none", fontFamily: "Sora, sans-serif", fontSize: "12px", fontWeight: "700",
              padding: "7px 18px", borderRadius: "8px", cursor: "pointer", textTransform: "capitalize",
              boxShadow: section === s ? "0 1px 4px rgba(15,12,41,0.08)" : "none", transition: "all 0.2s",
            }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <a href="https://x.com/Thru_pulse" target="_blank" rel="noreferrer" style={{
          width: "38px", height: "38px", borderRadius: "10px",
          border: "1.5px solid #e2e8f0", background: "#f8fafc",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none", flexShrink: 0, transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#0f0c29"; e.currentTarget.style.borderColor = "#0f0c29"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0f0c29">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>
    </nav>
  );
}

// ─── ROTATING WORD ───────────────────────────────────────────────────────────

const WORDS = ["Performance.", "Scale.", "Trust.", "Utility.", "Speed."];
function RotatingWord() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx(i => (i + 1) % WORDS.length); setFade(true); }, 300);
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      display: "inline-block",
      background: "linear-gradient(90deg, #e11d48, #fb7185)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(6px)",
      transition: "opacity 0.3s, transform 0.3s",
    }}>{WORDS[idx]}</span>
  );
}

// ─── BLOG ARTICLES ───────────────────────────────────────────────────────────

const BLOG_CONTENT = {
  1: `On April 29, 2025, Unto Labs — the company building Thru — announced it had raised $14.4 million in a combined pre-seed and seed round. Framework Ventures led the pre-seed. Electric Capital led the seed. The round values the company at $140 million.

For a team of five people with no product in production, those are significant numbers. They reflect a specific bet: that the blockchain industry has not yet produced the infrastructure it actually needs, and that the window to build it is open right now.

## Who backed it and why

Electric Capital and Framework Ventures are not generalist investors placing broad crypto bets. Both funds have deep technical roots and a track record of backing infrastructure that outlasts hype cycles.

Electric Capital has been among the most rigorous analysts of developer activity in crypto — their annual developer reports are the closest thing the industry has to a census of who is actually building. Their bet on Unto Labs is a bet that Thru's approach to developer experience solves a real problem, not a theoretical one.

Framework Ventures backed Solana early, when high-performance L1s were still a minority view. Their thesis has consistently been that throughput and cost matter more than ideology. Thru fits that thesis directly.

Neither fund backs teams for the story. They back teams for the architecture.

## What the money is for

Liam Heeger, Thru's founder, has been direct about this: the capital goes toward people. The team is five right now. The goal is ten by end of year.

Every hire is someone who understands the scope of what Unto Labs is attempting. Thru is not a fork of an existing chain. ThruVM — the RISC-V virtual machine at the core of Thru — is new. The consensus model is new. The account architecture is new. Building all of that correctly requires a small number of exceptionally capable engineers, not a large number of average ones.

The $140 million valuation creates real expectations. Unto Labs is aware of that. The raise is not a destination — it's runway to get to testnet, to mainnet, and to the point where what Thru promises can be demonstrated in production.

## The broader context

This raise is happening at a specific moment in the industry's history. The L2 narrative has dominated the last two years: rollups would scale Ethereum, modular chains would handle everything else, and L1 was a solved problem.

Thru's raise is a direct rebuttal to that. Electric Capital and Framework are placing a large bet that base layer innovation still has significant room — that a chain built from first principles in 2024 can outperform incumbents not just on throughput, but on developer experience, cost, and real-world utility.

**Sources:** [Fortune](https://fortune.com/crypto/2025/04/29/unto-labs-fundraising-framework-ventures-electric-capital/) · [Crypto-Fundraising.info](https://crypto-fundraising.info/projects/unto-labs-thru/) · [X / Unto Labs](https://x.com/untolabs)`,

  3: `On April 20, 2025, Vitalik Buterin posted a proposal to Ethereum's developer forum. The headline was striking: replace the EVM — Ethereum's virtual machine, the foundation of the entire smart contract ecosystem — with RISC-V.

Buterin argued that RISC-V would "greatly improve the efficiency of the Ethereum execution layer, resolving one of the primary scaling bottlenecks." The proposal triggered immediate debate across crypto Twitter, developer forums, and research channels.

Thru had already made this exact bet. Months earlier.

## What Vitalik actually proposed

The proposal was not a roadmap item or a vague suggestion. It was a concrete technical argument: the EVM's interpreter overhead — the cost of translating EVM opcodes into native machine instructions at runtime — is a fundamental inefficiency that compounds at scale. Every ZK proof, every execution trace, every block replay carries that overhead.

RISC-V eliminates it. Because RISC-V is a standard instruction set that maps directly to modern hardware, execution becomes faster, proving becomes cheaper, and the runtime can take advantage of hardware improvements without changes to the spec.

Buterin also cited developer accessibility. RISC-V is already supported by GCC, LLVM, and every major language toolchain. Developers can write contracts in Rust, C, C++, or any language with an LLVM backend — without learning a blockchain-specific language first.

These are exactly the arguments Unto Labs made when designing ThruVM.

## How Thru got there first

Thru's founder Liam Heeger spent two years building Firedancer — the high-performance Solana validator client — at Jump Crypto. That work gave him a precise understanding of where blockchain performance actually breaks down. It is not always consensus. It is not always networking. Often, it is the VM.

When Heeger left to build Thru, the choice of RISC-V was not a trend-follow. It was a conclusion from first principles: if you want a blockchain that competes with web2 infrastructure, you cannot afford a VM that speaks a language no hardware natively understands.

ThruVM was already in development when Buterin's proposal dropped. The timing was coincidental. The logic was identical.

## What this means for Thru

Buterin's proposal validated the thesis publicly in a way that no amount of Thru marketing could. When the creator of Ethereum says RISC-V is the right direction for the most battle-tested VM in crypto, it becomes harder to dismiss RISC-V as an experiment.

For Thru, this is confirmation rather than catalyst. The architecture was already set. What changed is the conversation around it.

The Ethereum community will debate Buterin's proposal for years — transitioning the EVM is a multi-year, politically complex undertaking with billions of dollars of existing contracts at stake. Thru has no such constraint. There are no legacy contracts to preserve. RISC-V is the foundation, not a migration target.

That is the advantage of building from scratch at the right moment.

**Sources:** [CoinDesk](https://www.coindesk.com/tech/2025/04/23/the-protocol-will-eth-developers-swap-out-the-evm-for-risc-v) · [Blockworks](https://blockworks.co/news/vitalik-ethereum-evm-scaling-l1-plan) · [CoinTelegraph](https://cointelegraph.com/explained/what-is-risc-v-and-why-does-vitalik-buterin-want-it-for-ethereum-smart-contracts) · [Vitalik's original post](https://ethereum-magicians.org)`,
  2: `Every blockchain VM is a bet. Ethereum bet on the EVM — a custom stack-based machine optimised for smart contracts but alien to the rest of the software world. Solana bet on BPF, inheriting a Linux kernel tool and bending it toward on-chain execution. Both choices unlocked ecosystems, but they also locked developers into new mental models, new toolchains, and new failure modes.

Thru is making a different bet: **RISC-V**.

## What is RISC-V and why does it matter?

RISC-V is an open-source instruction set architecture originally developed at UC Berkeley. It's the hardware language spoken by a growing share of the world's chips — from embedded sensors to datacenter accelerators. Unlike proprietary ISAs, it has no licensing fees, no single controlling vendor, and a vast existing ecosystem of compilers, debuggers, and tooling.

The key insight behind ThruVM is simple: if you build your smart contract runtime on RISC-V, you inherit all of that. Rust compiles to RISC-V. C compiles to RISC-V. C++ compiles to RISC-V. Any language with an LLVM backend — which is most modern languages — compiles to RISC-V.

**No custom compiler. No new SDK. No blockchain-specific language to learn.**

## The developer experience problem

The crypto industry has long underestimated how much developer friction costs. Solidity is powerful but niche. Move is elegant but exotic. Even Rust-based chains require developers to learn a new set of idioms, macros, and deployment patterns.

The result: a pool of blockchain developers that is orders of magnitude smaller than the pool of general software engineers. Every project fishing from the same pond drives up costs, slows shipping, and limits what gets built.

ThruVM closes that gap. A backend engineer who has never written a smart contract in their life can deploy on Thru using the tools they already know. The learning curve shifts from "learn a new paradigm" to "learn the Thru API" — a dramatically smaller lift.

## Performance without compromise

Beyond developer experience, RISC-V brings real performance benefits. The EVM's interpreter overhead — translating EVM opcodes to native machine instructions at runtime — is a known bottleneck. RISC-V maps directly to hardware. Execution is faster, proving is cheaper, and the runtime can take full advantage of underlying hardware improvements without changes to the VM spec.

Thru's architecture is built around this: bigger accounts, bigger transactions, bigger blocks — none of which require exotic hardware or compromise on decentralisation.

## What this means for the ecosystem

ThruVM doesn't just change who can build on Thru. It changes what can be built. When your smart contract runtime speaks the same language as your database driver, your web server, and your ML model, the integration points multiply. On-chain logic stops being a special case and becomes a first-class component of any software system.

The end of the blockchain dark ages isn't a marketing slogan. It's an engineering thesis. RISC-V is a large part of how Thru intends to prove it.`,

  4: `Most blockchains treat consensus like a political election: whoever accumulates the most stake gets the most power. Validators compete to attract delegations, protocols optimise for economic weight, and the result is a system where capital — not performance — determines who secures the network.

Thru is built on a different premise. **Operators earn their place by doing the work, not by holding the most tokens.**

## The problem with stake-weighted consensus

Proof-of-stake solved real problems. It removed the energy waste of proof-of-work and made Sybil attacks economically expensive. But it introduced a new set of distortions.

When consensus power tracks capital, the interests of large validators and the interests of the network start to diverge. Large validators can afford to be mediocre — their stake protects their position. Small, high-performance validators lose delegation to bigger names regardless of their uptime. Token concentration compounds over time as staking rewards flow disproportionately to those who already hold the most.

The network's security budget ends up subsidising capital accumulation rather than operational excellence.

## How Thru's consensus works

Thru's consensus model flips this. Operators earn their position through **uptime and throughput** — measurable, verifiable indicators of actual contribution to network performance.

An operator who keeps their node running reliably, processes transactions quickly, and pushes fees toward zero outcompetes an operator who simply holds more stake. Performance is the differentiator. Capital is not a shortcut.

This has a natural economic consequence: fees race toward zero. When operators compete on throughput rather than on their ability to attract delegations, the pressure is always downward on costs. Users benefit directly from that competition.

## Why this matters for builders

For developers building on Thru, this isn't just an ideological choice — it has practical implications.

A performance-driven consensus model means the network actively selects for validators who keep latency low and availability high. The incentive structure is aligned with what builders actually need: fast, reliable, cheap transaction execution.

It also means the network is more resistant to centralisation over time. When performance is the barrier to entry rather than capital, a wider range of operators can compete effectively. Geographic distribution, hardware diversity, and operational variety all become assets rather than liabilities.

## The bigger picture

Thru's consensus design is part of a coherent thesis: blockchains need to compete with web2, not just with each other. Web2 infrastructure is ruthlessly optimised — cloud providers compete on uptime SLAs, latency benchmarks, and cost per transaction.

A blockchain where validator selection tracks capital can never close that gap. A blockchain where validator selection tracks performance has a fighting chance.

That's the bet Thru is making. And it starts with making sure the people running the network are the ones doing it best.`,

  5: `Liam Heeger spent two years at Jump Crypto helping build Firedancer — the high-performance Solana validator client that was supposed to prove a blockchain could match the throughput of global financial infrastructure. He left in January 2025. What followed was a lawsuit, a settlement, and the announcement of Thru: a new L1 blockchain built on the conviction that the industry still hasn't solved its most basic problems.

This is his story in his own words.

## On leaving Jump Crypto

Leaving wasn't a sudden decision. I had been thinking about the fundamental constraints of existing chains for a long time — not just performance, but the whole developer experience, the way consensus is structured, the assumptions baked into every VM that exists today.

Jump alleged I was creating a competitive business. We settled. I'm not going to relitigate that. What I will say is that the work I'd done on Firedancer made it very clear to me that raw throughput is solvable. The hard problem isn't making a fast validator. It's building a chain that developers actually want to build on — and that users actually want to use.

## On why L1 is still an open problem

People declared L1 a solved problem. Layer 2 is the future, they said. Rollups will scale everything. I think that's wrong — or at least, incomplete.

L2s are a patch on top of L1 limitations. They add latency, fragmentation, and complexity. If your base layer is genuinely fast and cheap, you don't need most of that. The question is whether you can build a base layer that competes with web2 infrastructure on its own terms — not just within crypto, but against AWS, against Stripe, against the software that runs the world right now.

That's the bar we're trying to hit with Thru. Not "fast for a blockchain." Actually fast.

## On the decision to use RISC-V

Every existing chain VM is a liability for developer adoption. The EVM is powerful but alien. BPF is clever but niche. Even Rust-based chains require you to learn a new paradigm before you ship anything.

RISC-V is different because it's already everywhere. It's the ISA that the rest of the software world is converging on. If you build your runtime on RISC-V, you inherit GCC, LLVM, every debugger, every profiler, decades of tooling. A developer who has never touched crypto can write a smart contract in the language they already know.

That's not a small thing. The bottleneck in this industry isn't capital. It's developer time. Every hour a developer spends learning a new toolchain is an hour they're not building something useful.

## On the $14.4M raise and what comes next

Electric Capital and Framework believed in the thesis early. The valuation reflects what the market thinks the opportunity is worth — I'm more focused on whether we can actually execute.

The money goes toward people. We're five right now. We want to be ten by end of year. Every hire is someone who understands that we're not building another crypto toy. We're building infrastructure.

The testnet is live. We're gathering feedback. Mainnet is the goal, and everything between here and there is about making sure we ship something that works.

## On what success looks like

Success is a developer in Lagos or Berlin or Singapore deploying a contract on Thru using the same Rust codebase they use for everything else — and that contract running reliably, cheaply, at scale.

Success is a company building a payments product on Thru that doesn't think of itself as a "crypto company." It's just a company using the best infrastructure available.

We built casinos. We chased attention. We argued about ideology. That era is over. The end of the beginning means we actually have to build things that work now. Thru is our attempt at that.`,

  6: `The Thru testnet is live. For the first time, developers can deploy smart contracts on a RISC-V blockchain, interact with the network, and start building against a production-grade execution environment. Here is what you need to know to get started.

## What the testnet gives you

The testnet is a fully functional preview of the Thru execution environment. ThruVM — Thru's RISC-V virtual machine — is running. You can deploy contracts, send transactions, and observe the network behaving as it will at mainnet.

This is not a toy environment. The testnet runs the same consensus logic, the same VM specification, and the same account model as mainnet will. What you build and test here will port directly.

## How to deploy your first contract

If you have written Rust before, you already have most of what you need. Thru's contract model compiles standard Rust to RISC-V. There is no new intermediate language, no custom macro system, and no blockchain-specific compiler to install.

**Step 1:** Install the standard Rust toolchain if you haven't already. Add the RISC-V target:

\`\`\`
rustup target add riscv64gc-unknown-none-elf
\`\`\`

**Step 2:** Write your contract as a standard Rust library. Thru exposes a minimal SDK for reading and writing account state, emitting events, and calling other contracts.

**Step 3:** Compile and deploy using the Thru CLI. The deploy command handles packaging, submission, and address derivation.

The full quickstart documentation is available at thru.xyz.

## What to test

The testnet is the right place to validate a few things that are hard to reason about off-chain.

**Transaction throughput.** Thru's block architecture is designed for high-volume workloads. Push your contract with realistic load and observe how the network handles it.

**Account model.** Thru's accounts are larger and more flexible than those on most L1s. If you are migrating a design from another chain, the testnet is where you will discover what the new model unlocks.

**Fee behaviour.** Testnet fees are illustrative, not final, but the fee structure reflects what mainnet will look like. Understand your contract's cost profile before you commit.

## What comes next

The testnet is the first step toward mainnet. Unto Labs will be running structured developer programs, gathering feedback on the SDK and tooling, and iterating on the network based on what builders encounter in practice.

If you find something that doesn't work as expected, that is exactly the kind of signal the team needs. The testnet exists to surface friction before it becomes a production problem.

Get the CLI, deploy something, and tell the team what you find.`
};

// ─── BLOG POST ────────────────────────────────────────────────────────────────

function BlogPost({ item, onBack }) {
  const [displayed, setDisplayed] = useState("");
  const [loading, setLoading] = useState(true);
  const fullContent = BLOG_CONTENT[item.id] || "";

  useEffect(() => {
    window.scrollTo(0, 0);
    setDisplayed("");
    setLoading(true);
    // Simulate a brief loading moment then reveal content word by word
    const loadTimer = setTimeout(() => {
      setLoading(false);
      let i = 0;
      const words = fullContent.split(" ");
      const interval = setInterval(() => {
        i += 6; // reveal 6 words at a time
        setDisplayed(words.slice(0, i).join(" "));
        if (i >= words.length) {
          setDisplayed(fullContent);
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(loadTimer);
  }, [item.id]);

  // Simple markdown renderer — handles ##, **bold**, paragraphs
  function renderMarkdown(md) {
    const lines = md.split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={i} style={{ fontFamily: "Sora, sans-serif", fontSize: "20px", fontWeight: "800", color: "#0f0c29", margin: "32px 0 12px", letterSpacing: "-0.02em" }}>
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} style={{ fontFamily: "Sora, sans-serif", fontSize: "16px", fontWeight: "700", color: "#0f0c29", margin: "24px 0 8px" }}>
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: "#374151", lineHeight: "1.75", marginBottom: "6px", marginLeft: "20px" }}>
            {parseBold(line.replace(/^[-*] /, ""))}
          </li>
        );
      } else {
        elements.push(
          <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", color: "#374151", lineHeight: "1.8", margin: "0 0 20px" }}>
            {parseBold(line)}
          </p>
        );
      }
      i++;
    }
    return elements;
  }

  function parseBold(text) {
    // Handle both **bold** and [text](url) markdown
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: "700", color: "#0f0c29" }}>{p.slice(2, -2)}</strong>;
      }
      const linkMatch = p.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" style={{ color: "#e11d48", fontWeight: "600", textDecoration: "underline", textUnderlineOffset: "3px" }}>{linkMatch[1]}</a>;
      }
      return p;
    });
  }

  const tc = TAG_COLORS[item.tag] || {};

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#fff" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 40px" }}>

        {/* Meta */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: tc.bg, color: tc.text, padding: "4px 12px", borderRadius: "100px" }}>{item.tag}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#94a3b8" }}>{item.source} · {item.date}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", lineHeight: "1.2", margin: "0 0 16px" }}>
          {item.title}
        </h1>

        {/* Excerpt */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", color: "#64748b", lineHeight: "1.6", margin: "0 0 40px", borderBottom: "1px solid #f1f5f9", paddingBottom: "40px" }}>
          {item.excerpt}
        </p>

        {/* AI Content */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[100, 90, 95, 70, 85, 60].map((w, i) => (
              <div key={i} style={{ height: "16px", background: "#f1f5f9", borderRadius: "4px", width: `${w}%`, animation: "shimmer 1.4s ease infinite", animationDelay: `${i * 0.1}s` }} />
            ))}
            <p style={{ fontFamily: "Sora, sans-serif", fontSize: "12px", color: "#94a3b8", marginTop: "12px", textAlign: "center" }}>Loading article...</p>
          </div>
        )}

        {!loading && displayed && (
          <div>{renderMarkdown(displayed)}</div>
        )}

        {/* Back button */}
        {!loading && (
          <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid #f1f5f9" }}>
            <button onClick={onBack} style={{
              background: "linear-gradient(135deg, #4c0519, #e11d48)", color: "#fff",
              fontFamily: "Sora, sans-serif", fontSize: "13px", fontWeight: "700",
              padding: "12px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(225,29,72,0.25)",
            }}>← Back to News</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────────

function Home({ setSection, openPost }) {
  return (
    <div>
      {/* HERO */}
      <div style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden", background: "radial-gradient(ellipse 80% 60% at 50% 0%, #fff1f2 0%, #fff 65%)",
        paddingTop: "80px",
      }}>
        <NodeCanvas />
        <div style={{ position: "absolute", top: "12%", right: "8%", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(225,29,72,0.08), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "5%", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(225,29,72,0.06), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: "800px", padding: "0 32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(225,29,72,0.07)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: "100px", padding: "6px 16px", marginBottom: "32px", animation: "fadeDown 0.6s ease both" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#e11d48", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "Sora, sans-serif", fontSize: "12px", color: "#e11d48", fontWeight: "600" }}>Testnet Live · Unto Labs · $14.4M Raised</span>
          </div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontWeight: "800", fontSize: "clamp(44px, 7vw, 80px)", lineHeight: "1.05", color: "#0f0c29", letterSpacing: "-0.04em", margin: "0 0 20px", animation: "fadeDown 0.7s 0.1s ease both" }}>
            Built for<br /><RotatingWord />
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: "19px", lineHeight: "1.7", margin: "0 0 44px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto", animation: "fadeDown 0.7s 0.2s ease both" }}>
            Thru is a next-generation L1 blockchain — bigger accounts, bigger blocks, zero compromises. Powered by ThruVM and RISC-V.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", animation: "fadeDown 0.7s 0.3s ease both" }}>
            <button onClick={() => setSection("protocols")} style={{ background: "linear-gradient(135deg, #4c0519, #e11d48)", color: "#fff", fontFamily: "Sora, sans-serif", fontSize: "14px", fontWeight: "700", padding: "14px 30px", borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(225,29,72,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(225,29,72,0.35)"; }}
            >Explore Ecosystem →</button>
            <button onClick={() => setSection("news")} style={{ background: "#fff", color: "#0f0c29", fontFamily: "Sora, sans-serif", fontSize: "14px", fontWeight: "700", padding: "14px 30px", borderRadius: "12px", border: "1.5px solid #e2e8f0", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#fda4af"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >Latest News</button>
          </div>
          <div style={{ marginTop: "64px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", opacity: 0.4, animation: "fadeDown 1s 0.6s ease both" }}>
            <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase" }}>Scroll</span>
            <div style={{ width: "1px", height: "36px", background: "linear-gradient(to bottom, #64748b, transparent)" }} />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: "#0f0c29", padding: "48px 40px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {[
            { value: 14.4, prefix: "$", suffix: "M", dec: 1, label: "Total Raised", sub: "Electric Capital + Framework" },
            { value: 140, prefix: "$", suffix: "M", dec: 0, label: "Valuation", sub: "Combined round" },
            { value: 2, prefix: "", suffix: "", dec: 0, label: "Live Protocols", sub: "Growing ecosystem" },
            { value: 0, prefix: "~$", suffix: "", dec: 0, label: "Target TX Fee", sub: "Racing toward zero" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div style={{ textAlign: "center", padding: "16px 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: "36px", fontWeight: "800", color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  <Counter end={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.dec} />
                </div>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: "13px", fontWeight: "700", color: "#fb7185", marginTop: "8px" }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#475569", marginTop: "3px" }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* PILLARS */}
      <div style={{ padding: "100px 40px", background: "#fff" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "700", color: "#e11d48", letterSpacing: "0.14em", textTransform: "uppercase" }}>What makes Thru different</span>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", margin: "12px 0 0" }}>The end of the beginning<br />for blockchain.</h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "20px" }}>
            {[
              { n: "01", title: "ThruVM", body: "A RISC-V virtual machine. Works with Rust, C, C++ — no custom compilers, no DSLs." },
              { n: "02", title: "Performance Consensus", body: "Operators earn their spot with uptime and throughput, not stake. Fees race toward zero." },
              { n: "03", title: "Web2-Grade Scale", body: "Bigger accounts, bigger transactions, bigger blocks. Compete with global applications." },
              { n: "04", title: "Open Dev Experience", body: "Any language targeting RISC-V works out of the box. Mainstream adoption starts here." },
            ].map((f, i) => (
              <Reveal key={f.n} delay={i * 80}>
                <div style={{ background: "#fafafa", borderRadius: "18px", padding: "32px 28px", border: "1.5px solid #f1f5f9", position: "relative", transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#fda4af"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(79,70,229,0.1)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                >
                  <span style={{ position: "absolute", top: "16px", right: "20px", fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "800", color: "#fecdd3" }}>{f.n}</span>
                  <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "16px", fontWeight: "800", color: "#0f0c29", margin: "0 0 10px" }}>{f.title}</h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#64748b", lineHeight: "1.65", margin: 0 }}>{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* MANIFESTO */}
      <div style={{ background: "linear-gradient(135deg, #4c0519 0%, #881337 50%, #4c0519 100%)", padding: "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(225,29,72,0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(129,140,248,0.1), transparent 50%)", pointerEvents: "none" }} />
        <Reveal>
          <p style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(20px, 3.5vw, 32px)", fontWeight: "800", color: "#fff", lineHeight: "1.5", maxWidth: "720px", margin: "0 auto 32px", letterSpacing: "-0.02em" }}>
            "The crypto dark ages were built on isolation, distrust, and speculation. We're building for{" "}
            <span style={{ color: "#fb7185" }}>trust, utility, and scale.</span>"
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase" }}>— Unto Labs, Introducing Thru</p>
        </Reveal>
      </div>

      {/* LIVE PROTOCOLS */}
      <div style={{ padding: "100px 40px 0", background: "#fff" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "700", color: "#e11d48", letterSpacing: "0.14em", textTransform: "uppercase" }}>Ecosystem</span>
                <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "28px", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", margin: "8px 0 0" }}>Live protocols</h2>
              </div>
              <button onClick={() => setSection("protocols")} style={{ background: "transparent", border: "1.5px solid #e2e8f0", color: "#0f0c29", fontFamily: "Sora, sans-serif", fontSize: "13px", fontWeight: "700", padding: "9px 20px", borderRadius: "10px", cursor: "pointer" }}>View all →</button>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            {DAPPS.map((dapp, i) => {
              const sc = STATUS_COLORS[dapp.status] || {};
              return (
                <Reveal key={dapp.name} delay={i * 100}>
                  <a href={dapp.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ background: "linear-gradient(135deg, #fafafa 0%, #f0f4ff 100%)", border: "1.5px solid #fecdd3", borderRadius: "20px", padding: "32px", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.background = "linear-gradient(135deg, #fff 0%, #fff1f2 100%)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(225,29,72,0.13)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#fecdd3"; e.currentTarget.style.background = "linear-gradient(135deg, #fafafa 0%, #f0f4ff 100%)"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                    >
                      <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(225,29,72,0.06)", pointerEvents: "none" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #4c0519, #e11d48)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 4px 14px rgba(225,29,72,0.3)" }}>
                          {dapp.logo ? dapp.logo : <span style={{ fontFamily: "Sora, sans-serif", fontWeight: "800", fontSize: "16px", color: "#fff", letterSpacing: "-0.02em" }}>KEA</span>}
                        </div>
                        <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: sc.bg, color: sc.text, padding: "4px 12px", borderRadius: "100px" }}>{dapp.status}</span>
                      </div>
                      <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "20px", fontWeight: "800", color: "#0f0c29", margin: "0 0 6px", letterSpacing: "-0.02em" }}>{dapp.name}</h3>
                      <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", color: "#fb7185", textTransform: "uppercase", letterSpacing: "0.08em" }}>{dapp.category}</span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#64748b", lineHeight: "1.65", margin: "12px 0 20px" }}>{dapp.description}</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
                        {dapp.highlights.map(h => (
                          <span key={h} style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "600", background: "rgba(225,29,72,0.08)", color: "#e11d48", padding: "4px 10px", borderRadius: "6px" }}>{h}</span>
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "Sora, sans-serif", fontSize: "12px", fontWeight: "700", color: "#e11d48" }}>Open app →</span>
                      </div>
                    </div>
                  </a>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* NEWS TEASER */}
      <div style={{ padding: "100px 40px", background: "#fff" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "700", color: "#e11d48", letterSpacing: "0.14em", textTransform: "uppercase" }}>Latest coverage</span>
                <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "28px", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", margin: "8px 0 0" }}>In the news</h2>
              </div>
              <button onClick={() => setSection("news")} style={{ background: "transparent", border: "1.5px solid #e2e8f0", color: "#0f0c29", fontFamily: "Sora, sans-serif", fontSize: "13px", fontWeight: "700", padding: "9px 20px", borderRadius: "10px", cursor: "pointer" }}>All news →</button>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {NEWS.slice(0, 3).map((item, i) => {
              const tc = TAG_COLORS[item.tag] || {};
              return (
                <Reveal key={item.id} delay={i * 70}>
                  <div style={{ background: "#fafafa", border: "1.5px solid #f1f5f9", borderRadius: "16px", padding: "24px", cursor: "pointer", transition: "all 0.2s" }}
                    onClick={() => item.type === "blog" ? openPost(item) : window.open(item.url, "_blank")}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#fda4af"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(225,29,72,0.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: tc.bg, color: tc.text, padding: "3px 10px", borderRadius: "100px" }}>{item.tag}</span>
                      {item.type === "blog" && <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: "100px", marginLeft: "6px" }}>Blog post</span>}
                    </div>
                    <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "15px", fontWeight: "700", color: "#0f0c29", margin: "0 0 8px", lineHeight: "1.4" }}>{item.title}</h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: "0 0 16px" }}>{item.excerpt}</p>
                    <span style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", color: "#94a3b8" }}>{item.source} · {item.date}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* BUILD CTA */}
      <div style={{ padding: "0 40px 100px", background: "#fff" }}>
        <Reveal>
          <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg, #f8faff, #fff1f2)", border: "1.5px solid #fecdd3", borderRadius: "24px", padding: "56px 40px", boxShadow: "0 4px 40px rgba(225,29,72,0.07)" }}>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "26px", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", margin: "0 0 12px" }}>Ready to build on Thru?</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: "#64748b", lineHeight: "1.65", margin: "0 0 28px" }}>Deploy smart contracts with your existing Rust or C++ toolchain. No custom compilers. No domain-specific languages. Just ship.</p>
            <a href="https://docs.thru.org/" target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "linear-gradient(135deg, #4c0519, #e11d48)", color: "#fff", fontFamily: "Sora, sans-serif", fontSize: "14px", fontWeight: "700", padding: "14px 32px", borderRadius: "12px", textDecoration: "none", boxShadow: "0 4px 20px rgba(225,29,72,0.3)" }}>Read the Docs →</a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ─── PROTOCOLS ───────────────────────────────────────────────────────────────

function Protocols() {
  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#fff" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 40px" }}>
        <Reveal>
          <div style={{ marginBottom: "56px" }}>
            <span style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "700", color: "#e11d48", letterSpacing: "0.14em", textTransform: "uppercase" }}>Ecosystem</span>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "36px", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", margin: "10px 0 8px" }}>Protocol Explorer</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: "15px", margin: 0 }}>Native apps and protocols live on Thru right now.</p>
          </div>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {DAPPS.map((dapp, i) => {
            const sc = STATUS_COLORS[dapp.status] || {};
            return (
              <Reveal key={dapp.name} delay={i * 80}>
                <a href={dapp.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ background: "linear-gradient(135deg, #fafafa, #f4f6ff)", border: "1.5px solid #fecdd3", borderRadius: "20px", padding: "36px", display: "flex", gap: "28px", alignItems: "flex-start", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.background = "linear-gradient(135deg, #fff, #fff1f2)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(225,29,72,0.12)"; e.currentTarget.style.transform = "translateX(6px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#fecdd3"; e.currentTarget.style.background = "linear-gradient(135deg, #fafafa, #f4f6ff)"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                  >
                    <div style={{ width: "60px", height: "60px", borderRadius: "16px", flexShrink: 0, background: "linear-gradient(135deg, #4c0519, #e11d48)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: "0 4px 16px rgba(225,29,72,0.3)" }}>
                      {dapp.logo ? dapp.logo : <span style={{ fontFamily: "Sora, sans-serif", fontWeight: "800", fontSize: "18px", color: "#fff" }}>KEA</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "20px", fontWeight: "800", color: "#0f0c29", margin: 0 }}>{dapp.name}</h3>
                        <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: sc.bg, color: sc.text, padding: "3px 12px", borderRadius: "100px" }}>{dapp.status}</span>
                        <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", color: "#fb7185", textTransform: "uppercase", letterSpacing: "0.08em" }}>{dapp.category}</span>
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: "#475569", lineHeight: "1.65", margin: "0 0 16px" }}>{dapp.description}</p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {dapp.highlights.map(h => (
                          <span key={h} style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "600", background: "rgba(225,29,72,0.08)", color: "#e11d48", padding: "5px 12px", borderRadius: "8px" }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={200}>
          <div style={{ marginTop: "24px", background: "linear-gradient(135deg, #fff1f2, #f0f9ff)", border: "1.5px dashed #fda4af", borderRadius: "20px", padding: "40px", textAlign: "center" }}>
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "17px", fontWeight: "800", color: "#0f0c29", margin: "0 0 8px" }}>More protocols coming</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#64748b", margin: "0 0 16px" }}>The Thru ecosystem is early. As new protocols launch we'll add them here.</p>
            <a href="https://x.com/Thru_pulse" target="_blank" rel="noreferrer" style={{ fontFamily: "Sora, sans-serif", fontSize: "12px", fontWeight: "700", color: "#e11d48", textDecoration: "none" }}>Follow @thruPulse for updates →</a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ─── NEWS ────────────────────────────────────────────────────────────────────

function News({ openPost }) {
  const [tag, setTag] = useState("All");
  const filtered = tag === "All" ? NEWS : NEWS.filter(n => n.tag === tag);

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#fff" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "60px 40px" }}>
        <Reveal>
          <div style={{ marginBottom: "48px" }}>
            <span style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", fontWeight: "700", color: "#e11d48", letterSpacing: "0.14em", textTransform: "uppercase" }}>Coverage</span>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "36px", fontWeight: "800", color: "#0f0c29", letterSpacing: "-0.03em", margin: "10px 0 8px" }}>News & Updates</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748b", fontSize: "15px", margin: 0 }}>Everything happening in the Thru ecosystem. Thru Blog posts open as full articles.</p>
          </div>
        </Reveal>
        <div style={{ display: "flex", gap: "8px", marginBottom: "36px", flexWrap: "wrap" }}>
          {NEWS_TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)} style={{
              background: tag === t ? "#0f0c29" : "#fff", color: tag === t ? "#fff" : "#64748b",
              border: "1.5px solid", borderColor: tag === t ? "#0f0c29" : "#e2e8f0",
              fontFamily: "Sora, sans-serif", fontSize: "12px", fontWeight: "700",
              padding: "7px 16px", borderRadius: "100px", cursor: "pointer", transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map((item, i) => {
            const tc = TAG_COLORS[item.tag] || {};
            return (
              <Reveal key={item.id} delay={i * 60}>
                <div style={{ background: "#fafafa", border: "1.5px solid #f1f5f9", borderRadius: "16px", padding: "24px 28px", display: "flex", gap: "20px", alignItems: "flex-start", transition: "all 0.2s", cursor: "pointer" }}
                  onClick={() => item.type === "blog" ? openPost(item) : window.open(item.url, "_blank")}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#fda4af"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(225,29,72,0.08)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: tc.bg, color: tc.text, padding: "3px 10px", borderRadius: "100px" }}>{item.tag}</span>
                      {item.type === "blog" && <span style={{ fontFamily: "Sora, sans-serif", fontSize: "10px", fontWeight: "700", background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: "100px" }}>Blog post</span>}
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#94a3b8" }}>{item.source} · {item.date}</span>
                    </div>
                    <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "16px", fontWeight: "700", color: "#0f0c29", margin: "0 0 6px", lineHeight: "1.4" }}>{item.title}</h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#64748b", lineHeight: "1.65", margin: 0 }}>{item.excerpt}</p>
                  </div>
                  <span style={{ color: "#fda4af", fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>→</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [section, setSection] = useState("home");
  const [activePost, setActivePost] = useState(null);

  const openPost = (item) => { setActivePost(item); window.scrollTo(0, 0); };
  const closePost = () => { setActivePost(null); window.scrollTo(0, 0); };

  useEffect(() => { if (!activePost) window.scrollTo(0, 0); }, [section]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { background: #fff; min-height: 100vh; color: #0f0c29; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes scrollPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #f8fafc; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
      `}</style>

      <Nav
        section={section}
        setSection={(s) => { setActivePost(null); setSection(s); }}
        showBack={!!activePost}
        onBack={closePost}
      />

      {activePost ? (
        <BlogPost item={activePost} onBack={closePost} />
      ) : (
        <>
          {section === "home"      && <Home setSection={setSection} openPost={openPost} />}
          {section === "protocols" && <Protocols />}
          {section === "news"      && <News openPost={openPost} />}
        </>
      )}

      <footer style={{ borderTop: "1px solid #f1f5f9", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#fff" }}>
        <span style={{ fontFamily: "Sora, sans-serif", fontSize: "12px", color: "#94a3b8" }}>© 2026 thruPulse</span>
        <div style={{ display: "flex", gap: "20px" }}>
          {[{ l: "thru.xyz", u: "https://thru.xyz" }, { l: "thruPulse", u: "https://x.com/Thru_pulse" }, { l: "Unto Labs", u: "https://untolabs.com" }].map(x => (
            <a key={x.l} href={x.u} target="_blank" rel="noreferrer" style={{ fontFamily: "Sora, sans-serif", fontSize: "12px", color: "#64748b", textDecoration: "none" }}>{x.l}</a>
          ))}
        </div>
      </footer>
    </>
  );
}
