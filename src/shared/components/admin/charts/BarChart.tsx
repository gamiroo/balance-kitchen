// components/admin/charts/BarChart.tsx
"use client";

import { useEffect, useRef } from "react";

interface BarChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
}

export default function BarChart({ data, title, color = "blue" }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value), 1);

    // Draw bars
    const barWidth = chartWidth / data.length - 10;
    const barSpacing = 10;

    data.forEach((item, index) => {
      const x = padding + index * (barWidth + barSpacing);
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = height - padding - barHeight;

      // Draw bar
      ctx.fillStyle = color === "blue" ? "#3b82f6" : color === "green" ? "#10b981" : "#8b5cf6";
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value label
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);

      // Draw date label
      ctx.fillStyle = "#9ca3af";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x + barWidth / 2,
        height - 10
      );
    });

    // Draw title
    ctx.fillStyle = "#1f2937";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(title, 10, 20);
  }, [data, title, color]);

  return (
    <div className="w-full">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={300}
        className="w-full h-64"
      />
    </div>
  );
}
