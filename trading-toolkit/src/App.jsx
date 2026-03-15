import { useState, useCallback } from "react";

const TABS = ["倉位管理", "進場點位"];

// Fibonacci levels
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_LABELS = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];
const FIB_COLORS = ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6b7280"];

function formatNum(n, decimals = 2) {
  if (isNaN(n) || !isFinite(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatUSD(n) {
  if (isNaN(n) || !isFinite(n)) return "—";
  return "$" + formatNum(n);
}

// ─── Position Sizing Calculator ───
function PositionCalc() {
  const [balance, setBalance] = useState("");
  const [currentLeverage, setCurrentLeverage] = useState("10"); 
  const [riskPct, setRiskPct] = useState(2);
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [direction, setDirection] = useState("long");

  const calc = useCallback(() => {
    const b = parseFloat(balance);
    const lev = parseFloat(currentLeverage) || 1; 
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    
    if (!b || !e || !sl || b <= 0 || e <= 0 || sl <= 0) return null;

    const riskAmount = b * (riskPct / 100);
    const slDistance = Math.abs(e - sl);
    if (slDistance === 0) return null;

    const positionSize = riskAmount / (slDistance / e);
    const contracts = positionSize / e;
    const requiredMargin = positionSize / lev; 
    
    // 關鍵風險指標計算
    const slPct = (slDistance / e) * 100; // 止損距離 %
    const marginLossPct = slPct * lev; // 保證金虧損 %
    const maxSafeLeverage = Math.floor(90 / slPct); // 建議安全槓桿 (預留 10% 空間防插針)

    let rrRatio = null;
    let tpPnl = null;
    if (tp > 0) {
      const tpDistance = Math.abs(tp - e);
      rrRatio = tpDistance / slDistance;
      tpPnl = contracts * tpDistance;
    }

    return {
      riskAmount,
      positionSize,
      contracts,
      requiredMargin,
      slPct,
      marginLossPct,
      maxSafeLeverage,
      rrRatio,
      tpPnl,
      slDistance,
    };
  }, [balance, currentLeverage, riskPct, entry, stopLoss, takeProfit, direction]);

  const result = calc();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["long", "short"].map((d) => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            style={{
              flex: 1, padding: "12px 0", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              background: direction === d ? (d === "long" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #ef4444, #dc2626)") : "rgba(255,255,255,0.04)",
              color: direction === d ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          >
            {d === "long" ? "做多 LONG" : "做空 SHORT"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputField label="帳戶餘額 (USDT)" value={balance} onChange={setBalance} placeholder="10000" />
        <InputField label="你開的槓桿 (x)" value={currentLeverage} onChange={setCurrentLeverage} placeholder="10" />
        <InputField label="進場價格" value={entry} onChange={setEntry} placeholder="95000" />
        <InputField label="止損價格" value={stopLoss} onChange={setStopLoss} placeholder="93000" />
        <InputField label="止盈價格 (選填)" value={takeProfit} onChange={setTakeProfit} placeholder="100000" />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>單筆總資金風險 (想賠帳戶的幾%)</span>
          <span style={{ color: riskPct > 5 ? "#ef4444" : riskPct > 3 ? "#f59e0b" : "#22c55e", fontSize: 18, fontWeight: 800 }}>{riskPct}%</span>
        </div>
        <input type="range" min={0.5} max={10} step={0.5} value={riskPct} onChange={(e) => setRiskPct(parseFloat(e.target.value))} style={{ width: "100%" }} />
      </div>

      {result && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          
          {/* 基礎計算結果 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ResultCard label="最大虧損金額" value={formatUSD(result.riskAmount)} color="#ef4444" />
            <ResultCard label="建議倉位大小" value={formatUSD(result.positionSize)} color="#3b82f6" />
            <ResultCard label="合約數量 (單位)" value={formatNum(result.contracts, 4)} color="#a78bfa" />
            <ResultCard label="所需開倉保證金" value={formatUSD(result.requiredMargin)} color="#f59e0b" />
          </div>

          {/* 💡 交易教練診斷區塊 - 移除標題，保留數據與警告 */}
          <div style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 12,
            background: result.marginLossPct >= 100 ? "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))" : 
                        result.marginLossPct >= 60 ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.05))" : 
                        "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.05))",
            border: `1px solid ${result.marginLossPct >= 100 ? "rgba(239,68,68,0.3)" : result.marginLossPct >= 60 ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`
          }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                • 你的止損距離為 <span style={{ color: "#3b82f6", fontWeight: 700 }}>{formatNum(result.slPct, 2)}%</span>。
              </div>
              <div>
                • 以你設定的 <span style={{ color: "#f59e0b", fontWeight: 700 }}>{currentLeverage}x</span> 槓桿，若打到止損，單筆保證金將虧損 <span style={{ color: result.marginLossPct >= 100 ? "#ef4444" : "#fff", fontWeight: 700 }}>{formatNum(result.marginLossPct, 1)}%</span>。
              </div>

              <div style={{ 
                marginTop: 8, padding: "10px 14px", borderRadius: 8, 
                background: result.marginLossPct >= 100 ? "rgba(239,68,68,0.15)" : result.marginLossPct >= 60 ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                color: result.marginLossPct >= 100 ? "#fca5a5" : result.marginLossPct >= 60 ? "#fde68a" : "#bbf7d0",
                fontWeight: 600
              }}>
                {result.marginLossPct >= 100 
                  ? `【強烈警告】這單會爆倉！你的槓桿太高了，還沒碰到止損價就會被強制平倉。建議將槓桿降至 ${result.maxSafeLeverage < 1 ? 1 : result.maxSafeLeverage}x 以下。` 
                  : result.marginLossPct >= 60 
                  ? `【建議調整】槓桿稍高，打到止損會損耗極大比例的保證金。為防插針，建議將槓桿控制在 ${result.maxSafeLeverage}x 左右。` 
                  : "【狀況良好】槓桿與止損配置安全，保證金足以扛住正常波動。"}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Entry Point Calculator ───
function EntryCalc() {
  const [swingHigh, setSwingHigh] = useState("");
  const [swingLow, setSwingLow] = useState("");
  const [trend, setTrend] = useState("up");

  const high = parseFloat(swingHigh);
  const low = parseFloat(swingLow);
  const valid = high > 0 && low > 0 && high !== low;

  const fibLevels = valid
    ? FIB_LEVELS.map((ratio, i) => {
        const price = trend === "up" ? high - (high - low) * ratio : low + (high - low) * ratio;
        return { label: FIB_LABELS[i], price, color: FIB_COLORS[i], ratio };
      })
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setTrend("up")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: trend === "up" ? "#22c55e" : "rgba(255,255,255,0.04)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700 }}>📈 上漲回撤 (找多點)</button>
        <button onClick={() => setTrend("down")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: trend === "down" ? "#ef4444" : "rgba(255,255,255,0.04)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700 }}>📉 下跌反彈 (找空點)</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputField label="波段高點" value={swingHigh} onChange={setSwingHigh} placeholder="100000" />
        <InputField label="波段低點" value={swingLow} onChange={setSwingLow} placeholder="90000" />
      </div>
      {valid && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 20 }}>
          {fibLevels.map((fib, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: fib.color, fontWeight: 700 }}>{fib.label}</span>
              <span style={{ color: "#fff" }}>{formatNum(fib.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ───
function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", borderRadius: 10, padding: "12px", outline: "none" }} />
    </div>
  );
}

function ResultCard({ label, value, color }) {
  return (
    <div style={{ background: `${color}10`, borderRadius: 10, padding: "14px", border: `1px solid ${color}20` }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", fontFamily: "sans-serif", paddingBottom: 40 }}>
      <div style={{ padding: "28px 20px", background: "linear-gradient(180deg, rgba(245,158,11,0.1) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>⚡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>SM Crypto 交易工具箱</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>CRYPTO TRADING TOOLKIT</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 16px", marginBottom: 20 }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: 10, background: activeTab === i ? "rgba(245,158,11,0.15)" : "transparent", color: activeTab === i ? "#f59e0b" : "rgba(255,255,255,0.35)", fontWeight: 700, cursor: "pointer" }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: "0 16px" }}>{activeTab === 0 ? <PositionCalc /> : <EntryCalc />}</div>

      {/* LINE CTA */}
      <div style={{ margin: "32px 16px 0", padding: 20, borderRadius: 14, background: "rgba(6,199,85,0.05)", border: "1px solid rgba(6,199,85,0.15)", textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>想看實戰怎麼用？</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>加入「SM浪潮」社群，分享實單操作與交易觀點</div>
        <a
          href="https://line.me/ti/g2/M_9m9D66Mhoo68166zCHrXYu75A7awBbgcekPA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", padding: "12px 32px", borderRadius: 10, background: "#06c755", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
        >
          立即加入「SM浪潮」社群
        </a>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>入群申請：你的名字/GH</div>
      </div>
    </div>
  );
}
