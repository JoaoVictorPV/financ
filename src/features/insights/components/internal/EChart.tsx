"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function EChart({ option }: { option: echarts.EChartsOption }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    chartRef.current = echarts.init(ref.current, undefined, {
      renderer: "canvas",
    });

    const ro = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={ref} className="h-full w-full" />;
}
