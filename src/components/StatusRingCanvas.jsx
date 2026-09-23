import React, { useRef, useEffect, useState } from "react";
import { STATUS, STATUS_COLOR } from "../utils/constants";
import { fmtDate, isOverdue, avgProgress } from "../utils/formatting";

const pieSlices = (counts) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  let angle = -Math.PI / 2;
  return STATUS.map((st) => {
    const slice = (counts[st] || 0) / total;
    const start = angle;
    const end = angle + slice * Math.PI * 2;
    angle = end;
    return { st, start, end, count: counts[st] || 0 };
  });
};

const drawPie = (canvas, counts, highlight = null) => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 8;
  const inner = r * 0.58;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pieSlices(counts).forEach((s) => {
    if (!s.count && totalCount) return;
    ctx.beginPath();
    const grow = highlight === s.st ? 6 : 0;
    ctx.arc(cx, cy, r + grow, s.start, s.end);
    ctx.arc(cx, cy, inner - grow * 0.3, s.end, s.start, true);
    ctx.closePath();
    ctx.fillStyle = STATUS_COLOR[s.st];
    ctx.globalAlpha = highlight && highlight !== s.st ? 0.38 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = "#e8f1fb";
  ctx.font = "700 22px Plus Jakarta Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(totalCount), cx, cy - 8);
  ctx.fillStyle = "#8aa3bf";
  ctx.font = "600 11px Plus Jakarta Sans, sans-serif";
  ctx.fillText("TASKS", cx, cy + 12);
};

const StatusRingCanvas = ({ tasks = [], counts = {}, onSliceClick }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: "" });

  useEffect(() => {
    drawPie(canvasRef.current, counts, activeHighlight);
  }, [counts, activeHighlight]);

  const hitTest = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = Math.min(cx, cy) - 8;
    const inner = r * 0.58;

    if (dist < inner * 0.72) return "center";
    if (dist < inner - 4 || dist > r + 8) return null;

    let ang = Math.atan2(dy, dx);
    if (ang < -Math.PI / 2) ang += Math.PI * 2;
    const slices = pieSlices(counts);
    const found = slices.find((s) => ang >= s.start && ang <= s.end);
    return found ? found.st : slices[slices.length - 1]?.st;
  };

  const handleMouseMove = (ev) => {
    const key = hitTest(ev.clientX, ev.clientY);
    if (!key) {
      hideTip();
      return;
    }
    showTip(key, ev);
  };

  const showTip = (key, ev) => {
    setActiveHighlight(key === "center" ? null : key);
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const left = Math.min(ev.clientX - wrapRect.left + 14, wrapRect.width - 270);
    const top = Math.min(ev.clientY - wrapRect.top + 14, wrapRect.height - 60);

    setTooltip({
      show: true,
      x: left,
      y: top,
      key,
    });
  };

  const hideTip = () => {
    setActiveHighlight(null);
    setTooltip({ show: false, x: 0, y: 0, key: null });
  };

  const handleClick = (ev) => {
    const key = hitTest(ev.clientX, ev.clientY);
    if (onSliceClick && key) {
      onSliceClick(key);
    }
  };

  const renderTooltipContent = (key) => {
    if (key === "center") {
      const late = tasks.filter(isOverdue);
      return (
        <div>
          <div className="tip-h">Studio snapshot</div>
          <div className="tip-meta">
            {tasks.length} tasks · {avgProgress(tasks)}% avg progress · {late.length} overdue
          </div>
          {STATUS.map((st) => (
            <div key={st} className="tip-row">
              <i style={{ background: STATUS_COLOR[st] }}></i>
              {st} · {counts[st] || 0}
            </div>
          ))}
        </div>
      );
    }
    const list = tasks.filter((t) => t.status === key);
    const late = list.filter(isOverdue);
    return (
      <div>
        <div className="tip-h">
          {key} · {list.length}
        </div>
        <div className="tip-meta">
          {avgProgress(list)}% avg progress{late.length ? ` · ${late.length} overdue` : ""}
        </div>
      </div>
    );
  };

  return (
    <div className="chart-wrap ring-host" ref={wrapRef} style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width="240"
        height="240"
        onMouseMove={handleMouseMove}
        onMouseLeave={hideTip}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      />
      <div className="legend">
        {STATUS.map((st) => (
          <div
            key={st}
            className={`leg-item ${activeHighlight === st ? "on" : ""}`}
            onMouseEnter={(ev) => showTip(st, ev)}
            onMouseLeave={hideTip}
            onClick={() => onSliceClick && onSliceClick(st)}
          >
            <i style={{ background: STATUS_COLOR[st] }}></i>
            {st} · {counts[st] || 0}
          </div>
        ))}
      </div>

      {tooltip.show && (
        <div
          className="ring-tip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            position: "absolute",
          }}
        >
          {renderTooltipContent(tooltip.key)}
        </div>
      )}
    </div>
  );
};

export default StatusRingCanvas;
