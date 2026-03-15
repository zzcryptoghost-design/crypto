import { useState, useCallback } from "react";

const TABS = ["倉位管理", "進場點位"];

// Fibonacci levels
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_LABELS = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];
const FIB_COLORS = ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6b7280"];

// Vegas Channel EMAs
const VEGAS_EMAS = [
  { period: 144, color: "#3b82f6", label: "EMA 144" },
  { period: 169, color: "#60a5fa", label: "EMA 169" },
  { period: 576, color: "#ef4444", label: "EMA 576" },
  { period: 676, color: "#f87171", label: "EMA 676" },
];

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
  const [riskPct, setRiskPct] = useState(2);
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [direction, setDirection] = useState("long");

  const calc = useCallback(() => {
    const b = parseFloat(balance);
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    if (!b || !e || !sl || b <= 0 || e <= 0 || sl <= 0) return null;

    const riskAmount = b * (riskPct / 100);
    const slDistance = Math.abs(e - sl);
    const slPct = (slDistance / e) * 100;
    if (slDistance === 0) return null;

    const positionSize = riskAmount / (slDistance / e);
    const contracts = positionSize / e;
    const leverage = positionSize / b;

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
      leverage,
      slPct,
      rrRatio,
      tpPnl,
      slDistance,
    };
  }, [balance, riskPct, entry, stopLoss, takeProfit, direction]);

  const result = calc();

  const riskLevel =
    result && result.leverage > 20
      ? "extreme"
      : result && result.leverage > 10
      ? "high"
      : result && result.leverage > 5
      ? "medium"
      : "low";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Direction Toggle */}
      <div style={{ display: "flex", gap: 8 }}>
        {["long", "short"].map((d) => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                direction === d
                  ? d === "long"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "rgba(255,255,255,0.04)",
              color: direction === d ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: direction === d ? `0 4px 20px ${d === "long" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` : "none",
            }}
          >
            {d === "long" ? "做多 LONG" : "做空 SHORT"}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputField label="帳戶餘額 (USDT)" value={balance} onChange={setBalance} placeholder="10000" />
        <InputField label="進場價格" value={entry} onChange={setEntry} placeholder="95000" />
        <InputField label="止損價格" value={stopLoss} onChange={setStopLoss} placeholder="93000" />
        <InputField label="止盈價格 (選填)" value={takeProfit} onChange={setTakeProfit} placeholder="100000" />
      </div>

      {/* Risk Slider */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            單筆風險
          </span>
          <span
            style={{
              color: riskPct > 5 ? "#ef4444" : riskPct > 3 ? "#f59e0b" : "#22c55e",
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {riskPct}%
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={10}
          step={0.5}
          value={riskPct}
          onChange={(e) => setRiskPct(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: riskPct > 5 ? "#ef4444" : riskPct > 3 ? "#f59e0b" : "#22c55e" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>0.5%</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>保守 1-2%</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>10%</span>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ResultCard label="最大虧損金額" value={formatUSD(result.riskAmount)} color="#ef4444" />
            <ResultCard label="建議倉位大小" value={formatUSD(result.positionSize)} color="#3b82f6" />
            <ResultCard label="合約數量" value={formatNum(result.contracts, 4)} color="#a78bfa" />
            <ResultCard
              label="所需槓桿"
              value={formatNum(result.leverage, 1) + "x"}
              color={riskLevel === "extreme" ? "#ef4444" : riskLevel === "high" ? "#f59e0b" : "#22c55e"}
            />
            <ResultCard label="止損距離" value={result.slPct.toFixed(2) + "%" } color="#f59e0b" />
            {result.rrRatio && <ResultCard label="風報比 (R:R)" value={"1 : " + formatNum(result.rrRatio, 1)} color="#22c55e" />}
          </div>

          {result.tpPnl && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "rgba(34,197,94,0.08)",
                borderRadius: 10,
                border: "1px solid rgba(34,197,94,0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>預計止盈利潤</span>
              <span style={{ color: "#22c55e", fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                +{formatUSD(result.tpPnl)}
              </span>
            </div>
          )}

          {/* Risk Warning Bar */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 12,
              background:
                riskLevel === "extreme"
                  ? "rgba(239,68,68,0.1)"
                  : riskLevel === "high"
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(34,197,94,0.08)",
              color:
                riskLevel === "extreme" ? "#fca5a5" : riskLevel === "high" ? "#fcd34d" : "#86efac",
              border: `1px solid ${
                riskLevel === "extreme"
                  ? "rgba(239,68,68,0.2)"
                  : riskLevel === "high"
                  ? "rgba(245,158,11,0.2)"
                  : "rgba(34,197,94,0.15)"
              }`,
            }}
          >
            {riskLevel === "extreme"
              ? "⚠️ 槓桿超過 20x — 極高風險，建議降低倉位或放寬止損"
              : riskLevel === "high"
              ? "⚡ 槓桿 10-20x — 高風險區間，注意資金管理"
              : riskLevel === "medium"
              ? "📊 槓桿 5-10x — 中等風險，注意盤面波動"
              : "✅ 槓桿 < 5x — 風險可控"}
          </div>
        </div>
      )}

      {/* Quick Reference */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 10,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 600 }}>
          倉位管理黃金法則
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["單筆風險", "不超過帳戶的 1-2%"],
            ["總曝險", "同時持倉風險不超過 5-6%"],
            ["槓桿", "新手 ≤5x｜熟手 ≤10x｜高手自行判斷"],
            ["風報比", "至少 1:2 以上才值得進場"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 8, fontSize: 12 }}>
              <span style={{ color: "#f59e0b", fontWeight: 700, minWidth: 68 }}>{k}</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Entry Point Calculator ───
function EntryCalc() {
  const [swingHigh, setSwingHigh] = useState("");
  const [swingLow, setSwingLow] = useState("");
  const [trend, setTrend] = useState("up"); // up = retracement from rally, down = retracement from drop
  const [srLevels, setSrLevels] = useState([{ price: "", type: "support" }]);

  const addSR = () => {
    if (srLevels.length < 6) setSrLevels([...srLevels, { price: "", type: "support" }]);
  };
  const removeSR = (i) => setSrLevels(srLevels.filter((_, idx) => idx !== i));
  const updateSR = (i, field, val) => {
    const next = [...srLevels];
    next[i] = { ...next[i], [field]: val };
    setSrLevels(next);
  };

  const high = parseFloat(swingHigh);
  const low = parseFloat(swingLow);
  const valid = high > 0 && low > 0 && high !== low;

  const fibLevels = valid
    ? FIB_LEVELS.map((ratio, i) => {
        const price = trend === "up" ? high - (high - low) * ratio : low + (high - low) * ratio;
        return { ratio, label: FIB_LABELS[i], price, color: FIB_COLORS[i] };
      })
    : [];

  // Find confluence zones (Fib levels near S/R)
  const parsedSR = srLevels.filter((s) => parseFloat(s.price) > 0).map((s) => ({ ...s, price: parseFloat(s.price) }));

  const confluenceZones = [];
  if (valid && parsedSR.length > 0) {
    const range = Math.abs(high - low);
    const threshold = range * 0.02; // 2% of range
    fibLevels.forEach((fib) => {
      parsedSR.forEach((sr) => {
        if (Math.abs(fib.price - sr.price) < threshold) {
          confluenceZones.push({
            fibLabel: fib.label,
            fibPrice: fib.price,
            srPrice: sr.price,
            srType: sr.type,
            avgPrice: (fib.price + sr.price) / 2,
            strength: fib.ratio === 0.618 || fib.ratio === 0.5 ? "強" : "中",
          });
        }
      });
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Trend Toggle */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { val: "up", label: "上漲回撤 (找做多)", icon: "📈" },
          { val: "down", label: "下跌反彈 (找做空)", icon: "📉" },
        ].map((t) => (
          <button
            key={t.val}
            onClick={() => setTrend(t.val)}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                trend === t.val
                  ? t.val === "up"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "rgba(255,255,255,0.04)",
              color: trend === t.val ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: trend === t.val ? `0 4px 20px ${t.val === "up" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` : "none",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Swing Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputField label="波段高點" value={swingHigh} onChange={setSwingHigh} placeholder="100000" />
        <InputField label="波段低點" value={swingLow} onChange={setSwingLow} placeholder="90000" />
      </div>

      {/* Fib Results */}
      {valid && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14, fontWeight: 600 }}>
            斐波那契回撤位
          </div>

          {/* Visual Fib Bar */}
          <div style={{ position: "relative", height: 280, marginBottom: 16 }}>
            {fibLevels.map((fib, i) => {
              const pct = ((fib.price - Math.min(high, low)) / Math.abs(high - low)) * 100;
              const yPos = 100 - pct;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: `${(yPos / 100) * 260}px`,
                    left: 0,
                    right: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: `${fib.color}55`,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: -1,
                        width: fib.ratio === 0.618 || fib.ratio === 0.5 ? "100%" : "60%",
                        height: 3,
                        background: fib.color,
                        borderRadius: 2,
                        opacity: fib.ratio === 0.618 ? 1 : fib.ratio === 0.5 ? 0.8 : 0.5,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 180 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: fib.color,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        minWidth: 42,
                      }}
                    >
                      {fib.label}
                    </span>
                    <span
                      style={{
                        fontSize: fib.ratio === 0.618 || fib.ratio === 0.5 ? 16 : 13,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: fib.ratio === 0.618 || fib.ratio === 0.5 ? 800 : 500,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {formatNum(fib.price)}
                    </span>
                    {fib.ratio === 0.618 && (
                      <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, background: "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: 4 }}>
                        黃金比例
                      </span>
                    )}
                    {fib.ratio === 0.5 && (
                      <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, background: "rgba(245,158,11,0.15)", padding: "2px 6px", borderRadius: 4 }}>
                        重要
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Support / Resistance Inputs */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 14,
          padding: 20,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>支撐 / 壓力位</span>
          <button
            onClick={addSR}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "#f59e0b",
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + 新增
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {srLevels.map((sr, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={sr.type}
                onChange={(e) => updateSR(i, "type", e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: sr.type === "support" ? "#22c55e" : "#ef4444",
                  borderRadius: 8,
                  padding: "10px 8px",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value="support">支撐</option>
                <option value="resistance">壓力</option>
              </select>
              <input
                type="number"
                value={sr.price}
                onChange={(e) => updateSR(i, "price", e.target.value)}
                placeholder="價格"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              {srLevels.length > 1 && (
                <button
                  onClick={() => removeSR(i)}
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "none",
                    color: "#ef4444",
                    borderRadius: 6,
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confluence Zones */}
      {confluenceZones.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))",
            borderRadius: 14,
            padding: 20,
            border: "1px solid rgba(245,158,11,0.15)",
          }}
        >
          <div style={{ fontSize: 14, color: "#f59e0b", marginBottom: 14, fontWeight: 700 }}>
            🎯 共振區間 — 高概率進場點
          </div>
          {confluenceZones.map((cz, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(0,0,0,0.2)",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  Fib {cz.fibLabel} × {cz.srType === "support" ? "支撐" : "壓力"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  Fib: {formatNum(cz.fibPrice)} ≈ S/R: {formatNum(cz.srPrice)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {formatNum(cz.avgPrice)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: cz.strength === "強" ? "#22c55e" : "#f59e0b",
                    fontWeight: 700,
                  }}
                >
                  {cz.strength === "強" ? "★★★ 強共振" : "★★ 中共振"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vegas Channel Reference */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 10,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 600 }}>
          維加斯通道參考（需配合圖表確認）
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {VEGAS_EMAS.map((ema) => (
            <div
              key={ema.period}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ema.color }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
                {ema.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, lineHeight: 1.6 }}>
          短通道 (144/169) 與長通道 (576/676) 的位置關係判斷趨勢方向。
          價格在短通道上方且短通道在長通道上方 = 強多頭。
          回踩短通道是順勢做多的理想進場區。
        </div>
      </div>

      {/* Entry Checklist */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 10,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 600 }}>
          進場 Checklist（SMC + 傳統 TA）
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "確認市場結構方向 (HH/HL 或 LH/LL)",
            "辨識 Order Block / FVG 區間",
            "斐波那契回撤 0.5–0.786 黃金進場區",
            "維加斯通道方向確認趨勢",
            "固定成交量分佈 (FRVP) 確認 POC 位置",
            "多重時間框架確認 (HTF 方向 + LTF 進場)",
            "風報比 ≥ 1:2 才進場",
          ].map((item, i) => (
            <label
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              <input type="checkbox" style={{ marginTop: 2, accentColor: "#f59e0b" }} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ───
function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff",
          borderRadius: 10,
          padding: "12px 14px",
          fontSize: 16,
          fontWeight: 600,
          outline: "none",
          fontFamily: "'JetBrains Mono', monospace",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(245,158,11,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </div>
  );
}

function ResultCard({ label, value, color }) {
  return (
    <div
      style={{
        background: `${color}10`,
        borderRadius: 10,
        padding: "14px 16px",
        border: `1px solid ${color}20`,
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Main App ───
export default function TradingToolkit() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0b0f",
        color: "#fff",
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: "0 0 40px 0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="range"] { height: 6px; }
        select option { background: #1a1b23; color: #fff; }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "28px 20px 20px",
          background: "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>交易工具箱</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
              CRYPTO TRADING TOOLKIT
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "0 16px",
          marginBottom: 20,
        }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === i ? "rgba(245,158,11,0.12)" : "transparent",
              color: activeTab === i ? "#f59e0b" : "rgba(255,255,255,0.35)",
              borderBottom: activeTab === i ? "2px solid #f59e0b" : "2px solid transparent",
            }}
          >
            {i === 0 ? "📐 " : "🎯 "}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px" }}>{activeTab === 0 ? <PositionCalc /> : <EntryCalc />}</div>

      {/* LINE CTA */}
      <div
        style={{
          margin: "32px 16px 0",
          padding: 20,
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(6,199,85,0.1), rgba(6,199,85,0.03))",
          border: "1px solid rgba(6,199,85,0.15)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginBottom: 6 }}>
          想看實戰怎麼用？
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.6 }}>
          每天分享交易觀點 + 實單操作，加入社群一起交流
        </div>
        <a
          href="https://LINE_COMMUNITY_LINK"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "12px 32px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #06c755, #05a847)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(6,199,85,0.3)",
            transition: "transform 0.2s",
          }}
        >
          加入 LINE 社群
        </a>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: 20,
          padding: "16px",
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        僅供參考，不構成任何投資建議
      </div>
    </div>
  );
}
