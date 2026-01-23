import React, { useRef, useEffect } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';

const Graph = () => {
  const fgRef = useRef<ForceGraphMethods>(undefined);

  // 家庭关系图谱数据
  const graphData = {
    nodes: [
      { id: '爷爷', name: '张大明', group: 1 },
      { id: '奶奶', name: '李秀英', group: 1 },
      { id: '爸爸', name: '张建国', group: 2 },
      { id: '妈妈', name: '王芳', group: 2 },
      { id: '叔叔', name: '张建军', group: 2 },
      { id: '婶婶', name: '刘梅', group: 2 },
      { id: '我', name: '张小明', group: 3 },
      { id: '妹妹', name: '张小红', group: 3 },
      { id: '堂弟', name: '张小强', group: 3 },
    ],
    links: [
      { source: '爷爷', target: '奶奶', label: '夫妻', color: '#ff6b6b' },
      { source: '爷爷', target: '爸爸', label: '父子', color: '#4ecdc4' },
      { source: '爷爷', target: '叔叔', label: '父子', color: '#4ecdc4' },
      { source: '奶奶', target: '爸爸', label: '母子', color: '#95e1d3' },
      { source: '奶奶', target: '叔叔', label: '母子', color: '#95e1d3' },
      { source: '爸爸', target: '妈妈', label: '夫妻', color: '#ff6b6b' },
      { source: '叔叔', target: '婶婶', label: '夫妻', color: '#ff6b6b' },
      { source: '爸爸', target: '我', label: '父子', color: '#4ecdc4' },
      { source: '爸爸', target: '妹妹', label: '父女', color: '#4ecdc4' },
      { source: '妈妈', target: '我', label: '母子', color: '#95e1d3' },
      { source: '妈妈', target: '妹妹', label: '母女', color: '#95e1d3' },
      { source: '叔叔', target: '堂弟', label: '父子', color: '#4ecdc4' },
      { source: '婶婶', target: '堂弟', label: '母子', color: '#95e1d3' },
      { source: '我', target: '妹妹', label: '兄妹', color: '#ffd93d' },
      { source: '我', target: '堂弟', label: '堂兄弟', color: '#ffd93d' },
    ]
  };

  useEffect(() => {
    // 自动缩放适应画布
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  }, []);

  return (
    <div style={{background: '#f5f5f5' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeAutoColorBy="group"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 14 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // 绘制圆形节点
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = node.group === 1 ? '#ff6b6b' : node.group === 2 ? '#4ecdc4' : '#ffd93d';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();
          
          // 绘制文字
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#333';
          ctx.fillText(label, node.x, node.y + 15);
        }}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const start = link.source;
          const end = link.target;
          
          // 计算连线的角度和长度
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const angle = Math.atan2(dy, dx);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 节点半径（与绘制节点时的半径一致）
          const nodeRadius = 8;
          // 箭头长度
          const arrowLength = 10 / globalScale;
          const arrowWidth = 6 / globalScale;
          
          // 计算箭头的起始和结束点（从节点边缘开始和结束）
          const startX = start.x + nodeRadius * Math.cos(angle);
          const startY = start.y + nodeRadius * Math.sin(angle);
          const endX = end.x - nodeRadius * Math.cos(angle);
          const endY = end.y - nodeRadius * Math.sin(angle);
          
          // 绘制连线
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = link.color || '#999';
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();
          
          // 绘制箭头
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-arrowLength, arrowWidth);
          ctx.lineTo(-arrowLength, -arrowWidth);
          ctx.closePath();
          ctx.fillStyle = link.color || '#999';
          ctx.fill();
          ctx.restore();
          
          // 计算中点位置
          const textPos = {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2
          };
          
          // 绘制关系标签
          const label = link.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // 添加背景
          const textWidth = ctx.measureText(label).width;
          const padding = 4 / globalScale;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            textPos.x - textWidth / 2 - padding,
            textPos.y - fontSize / 2 - padding,
            textWidth + padding * 2,
            fontSize + padding * 2
          );
          
          // 绘制文字
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, textPos.x, textPos.y);
        }}
        linkCanvasObjectMode={() => 'replace'}
        nodeCanvasObjectMode={() => 'replace'}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
      />
    </div>
  )
}

export default Graph