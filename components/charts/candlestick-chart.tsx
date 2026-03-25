"use client";

import { createChart, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { useEffect, useRef } from "react";

import type { Candle } from "@/lib/market/types";

export function CandlestickChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "#08131d" },
        textColor: "rgba(255,255,255,0.7)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.16)" },
        horzLine: { color: "rgba(255,255,255,0.16)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#2ce89a",
      downColor: "#ff6a3d",
      wickUpColor: "#2ce89a",
      wickDownColor: "#ff6a3d",
      borderVisible: false,
    });

    series.setData(
      candles.map((candle) => ({
        time: Math.floor(new Date(candle.time).getTime() / 1000) as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [candles]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-[1.75rem] border border-white/10 bg-ink-950/80" />;
}
