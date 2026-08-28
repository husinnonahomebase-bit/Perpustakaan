import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3MemberProgressBarProps {
  total: number;
  activeCount: number;
  inactiveCount: number; // suspended + expired
  suspendedCount: number;
  expiredCount: number;
  growthPercentage: number;
}

export const D3MemberProgressBar: React.FC<D3MemberProgressBarProps> = ({
  total,
  activeCount,
  inactiveCount,
  suspendedCount,
  expiredCount,
  growthPercentage,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 320;
    const height = 28;
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define gradients and filter
    const defs = svg.append('defs');

    // Emerald gradient for active members
    const activeGrad = defs
      .append('linearGradient')
      .attr('id', 'active-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    activeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    activeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Amber/Red gradient for inactive members
    const inactiveGrad = defs
      .append('linearGradient')
      .attr('id', 'inactive-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    inactiveGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
    inactiveGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444');

    // Scale
    const activePercent = total > 0 ? (activeCount / total) * 100 : 0;
    const inactivePercent = total > 0 ? (inactiveCount / total) * 100 : 0;

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    const activeWidth = xScale(activePercent);
    const inactiveWidth = xScale(inactivePercent);
    const cornerRadius = 8;

    // Background track
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('rx', cornerRadius)
      .attr('fill', '#1e293b') // Slate 800
      .attr('stroke', '#334155')
      .attr('stroke-width', 1);

    // Clip path for rounded container
    defs
      .append('clipPath')
      .attr('id', 'bar-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('rx', cornerRadius);

    const barContainer = g.append('g').attr('clip-path', 'url(#bar-clip)');

    // Active Bar with smooth D3 transition
    const activeBar = barContainer
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', innerHeight)
      .attr('fill', 'url(#active-bar-gradient)');

    activeBar
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('width', activeWidth);

    // Inactive Bar (if any)
    if (inactiveCount > 0) {
      const inactiveBar = barContainer
        .append('rect')
        .attr('x', activeWidth)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', innerHeight)
        .attr('fill', 'url(#inactive-bar-gradient)');

      inactiveBar
        .transition()
        .delay(200)
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr('width', inactiveWidth);
    }

    // Interactive divider line if both parts exist
    if (activeCount > 0 && inactiveCount > 0) {
      barContainer
        .append('line')
        .attr('x1', activeWidth)
        .attr('y1', 0)
        .attr('x2', activeWidth)
        .attr('y2', innerHeight)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);
    }

    // Active percentage text inside bar if wide enough
    if (activeWidth > 55) {
      g.append('text')
        .attr('x', Math.min(activeWidth / 2, innerWidth - 35))
        .attr('y', innerHeight / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#020617')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`${Math.round(activePercent)}%`);
    }

    // Inactive percentage text inside bar if wide enough
    if (inactiveWidth > 50) {
      g.append('text')
        .attr('x', activeWidth + inactiveWidth / 2)
        .attr('y', innerHeight / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`${Math.round(inactivePercent)}%`);
    }
  }, [total, activeCount, inactiveCount, suspendedCount, expiredCount, growthPercentage]);

  const activePercent = total > 0 ? ((activeCount / total) * 100).toFixed(1) : '0';
  const inactivePercent = total > 0 ? ((inactiveCount / total) * 100).toFixed(1) : '0';

  return (
    <div className="w-full space-y-2">
      {/* Visual D3 Canvas */}
      <div ref={containerRef} className="w-full relative">
        <svg ref={svgRef} className="w-full block overflow-visible" />
      </div>

      {/* Legend & Breakdown */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0"></div>
            <span className="text-slate-300 font-medium">Aktif:</span>
            <span className="font-mono text-emerald-400 font-bold">{activeCount}</span>
            <span className="text-slate-500">({activePercent}%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0"></div>
            <span className="text-slate-300 font-medium">Nonaktif:</span>
            <span className="font-mono text-amber-400 font-bold">{inactiveCount}</span>
            <span className="text-slate-500">({inactivePercent}%)</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          Suspended: {suspendedCount} • Expired: {expiredCount}
        </div>
      </div>
    </div>
  );
};
