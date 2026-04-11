import type { Edge, Node } from 'reactflow'
import type { AgentMessage, AgentNodeData, AgentTool, ChatMessage } from './types'

const lineLevelModels = [
  { value: 'deepseek-r1', label: 'DeepSeek-R1' },
  { value: 'claude-3', label: 'Claude 3' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
]

const moduleLevelModels = [
  { value: 'deepseek-v1', label: 'DeepSeek-V1' },
  { value: 'qwen-14b', label: 'Qwen-14B' },
  { value: 'deepseek-7b', label: 'DeepSeek-7B' },
]

const unitLevelModels = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'yi-6b', label: 'Yi-6B' },
  { value: 'phi-2', label: 'Phi-2' },
]

export const agentToolsByRole: Record<string, AgentTool[]> = {
  '分拣产线智能体': [
    { id: 'global-scheduling', name: '全局调度', color: 'blue' },
    { id: 'task-dispatch', name: '任务分配', color: 'purple' },
  ],
  '进料模块智能体': [
    { id: 'feeding-control', name: '上料控制', color: 'orange' },
    { id: 'material-tracking', name: '物料追踪', color: 'cyan' },
  ],
  '检测模块智能体': [
    { id: 'quality-inspection', name: '质量检测', color: 'green' },
    { id: 'defect-identification', name: '缺陷识别', color: 'red' },
  ],
  '分拣模块智能体': [
    { id: 'sorting-decision', name: '分类决策', color: 'blue' },
    { id: 'trajectory-planning', name: '轨迹规划', color: 'purple' },
  ],
  '出料模块智能体': [
    { id: 'material-diversion', name: '物料分流', color: 'orange' },
    { id: 'packaging-control', name: '包装控制', color: 'cyan' },
  ],
  '振动盘单元智能体': [
    { id: 'vibration-control', name: '振动控制', color: 'blue' },
    { id: 'material-alignment', name: '物料整列', color: 'green' },
  ],
  '机械臂单元智能体': [
    { id: 'grasp-planning', name: '抓取规划', color: 'purple' },
    { id: 'pose-control', name: '位姿控制', color: 'orange' },
  ],
  '相机单元智能体': [
    { id: 'image-acquisition', name: '图像采集', color: 'cyan' },
    { id: 'parameter-adjustment', name: '参数调节', color: 'blue' },
  ],
  '传送带单元智能体': [
    { id: 'speed-control', name: '速度控制', color: 'green' },
    { id: 'spacing-control', name: '间距调节', color: 'purple' },
  ],
  '包装单元智能体': [
    { id: 'package-control', name: '包装控制', color: 'orange' },
    { id: 'package-quality-check', name: '质量检验', color: 'red' },
  ],
}

export const agentNodesData: AgentNodeData[] = [
  {
    id: '9',
    role: '分拣产线智能体',
    avatarId: '1',
    backstory: '负责协调整条分拣产线的运行状态，监控各模块执行情况，并保障任务高效完成。',
    modelUrl: '/models/factory.glb',
  },
  {
    id: '10',
    role: '进料模块智能体',
    avatarId: '2',
    backstory: '负责进料模块运行管理，控制零件上料精度与效率，保障后续模块稳定供料。',
    modelUrl: '/models/feeder.glb',
  },
  {
    id: '11',
    role: '检测模块智能体',
    avatarId: '3',
    backstory: '负责检测模块运行监控，保障图像采集质量与缺陷识别精度，输出稳定检测结果。',
    modelUrl: '/models/camera.glb',
  },
  {
    id: '12',
    role: '分拣模块智能体',
    avatarId: '4',
    backstory: '负责分拣模块运行管理，控制机械臂执行分类动作，提升分拣效率与准确率。',
    modelUrl: '/models/robot_arm.glb',
  },
  {
    id: '13',
    role: '出料模块智能体',
    avatarId: '5',
    backstory: '负责出料模块状态控制，协调合格品与不合格品输出路径，保障出料规范有序。',
    modelUrl: '/models/conveyor.glb',
  },
  {
    id: '14',
    role: '振动盘单元智能体',
    avatarId: '6',
    backstory: '负责振动盘运行控制，调节振动频率与幅度，实现零件有序输出。',
    modelUrl: '/models/vibratory_bowl_feeder.glb',
  },
  {
    id: '15',
    role: '机械臂单元智能体',
    avatarId: '7',
    backstory: '负责上料机械臂运动轨迹与姿态控制，执行精准抓取与放置动作。',
    modelUrl: '/models/industrial_robot_arm.glb',
  },
  {
    id: '16',
    role: '相机单元智能体',
    avatarId: '8',
    backstory: '负责工业相机运行状态与采集参数控制，保障检测图像清晰可靠。',
    modelUrl: '/models/industrial_camera.glb',
  },
  {
    id: '17',
    role: '传送带单元智能体A',
    avatarId: '9',
    backstory: '负责分拣模块传送带运行控制，调节速度与物料间距，保障分拣动作协同。',
    modelUrl: '/models/conveyor.glb',
  },
  {
    id: '18',
    role: '机械臂单元智能体B',
    avatarId: '10',
    backstory: '负责分拣机械臂动作执行，完成抓取、搬运与分类放置。',
    modelUrl: '/models/industrial_robot_arm.glb',
  },
  {
    id: '19',
    role: '视觉单元智能体',
    avatarId: '11',
    backstory: '负责分拣视觉系统图像处理与分析，为分类决策提供实时依据。',
    modelUrl: '/models/camera.glb',
  },
  {
    id: '20',
    role: '传送带单元智能体B',
    avatarId: '12',
    backstory: '负责出料模块传送带状态控制，执行分类输送与物料缓存。',
    modelUrl: '/models/conveyor.glb',
  },
  {
    id: '21',
    role: '包装单元智能体',
    avatarId: '13',
    backstory: '负责包装单元运行控制，协调包装过程与质量检查。',
    modelUrl: '/models/packaging.glb',
  },
]

export const initialNodes: Node<AgentNodeData>[] = [
  { id: '9', type: 'agentNode', position: { x: 1260, y: 80 }, data: agentNodesData[0] },
  { id: '10', type: 'agentNode', position: { x: 180, y: 500 }, data: agentNodesData[1] },
  { id: '11', type: 'agentNode', position: { x: 900, y: 500 }, data: agentNodesData[2] },
  { id: '12', type: 'agentNode', position: { x: 1620, y: 500 }, data: agentNodesData[3] },
  { id: '13', type: 'agentNode', position: { x: 2340, y: 500 }, data: agentNodesData[4] },
  { id: '14', type: 'agentNode', position: { x: 0, y: 920 }, data: agentNodesData[5] },
  { id: '15', type: 'agentNode', position: { x: 360, y: 920 }, data: agentNodesData[6] },
  { id: '16', type: 'agentNode', position: { x: 720, y: 920 }, data: agentNodesData[7] },
  { id: '17', type: 'agentNode', position: { x: 1440, y: 920 }, data: agentNodesData[8] },
  { id: '18', type: 'agentNode', position: { x: 1800, y: 920 }, data: agentNodesData[9] },
  { id: '19', type: 'agentNode', position: { x: 1080, y: 920 }, data: agentNodesData[10] },
  { id: '20', type: 'agentNode', position: { x: 2160, y: 920 }, data: agentNodesData[11] },
  { id: '21', type: 'agentNode', position: { x: 2520, y: 920 }, data: agentNodesData[12] },
]

export const initialEdges: Edge[] = [
  { id: 'e9-10', source: '9', target: '10', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e9-11', source: '9', target: '11', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e9-12', source: '9', target: '12', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e9-13', source: '9', target: '13', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e10-14', source: '10', target: '14', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e10-15', source: '10', target: '15', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e11-16', source: '11', target: '16', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e12-17', source: '12', target: '17', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e12-18', source: '12', target: '18', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e11-19', source: '11', target: '19', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e13-20', source: '13', target: '20', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e13-21', source: '13', target: '21', type: 'agentEdge', sourceHandle: 'bottom', targetHandle: 'top' },
]

export const defaultModelByRole = {
  line: lineLevelModels[0].value,
  module: moduleLevelModels[0].value,
  unit: unitLevelModels[0].value,
}

export const modelOptionsByLevel = {
  line: lineLevelModels,
  module: moduleLevelModels,
  unit: unitLevelModels,
}

export const agentInteractionTimes: Record<string, string> = {
  '9': '1 minute ago',
  '10': '5 minutes ago',
  '11': '3 minutes ago',
  '12': 'just now',
  '13': '7 minutes ago',
  '14': '10 minutes ago',
  '15': '4 minutes ago',
  '16': '2 minutes ago',
  '17': '6 minutes ago',
  '18': '8 minutes ago',
  '19': '1 minute ago',
  '20': '9 minutes ago',
  '21': '3 minutes ago',
}

export const agentConversationMessages: AgentMessage[] = [
  { from: '产线智能体', to: '产线', content: '收到新批次零件分拣任务：批次 #20240801-01，共 10000 件。', timestamp: '08:00' },
  { from: '产线智能体', to: '精密上料模块智能体', content: '请启动上料程序，准备接收新批次零件。', timestamp: '08:00' },
  { from: '精密上料模块智能体', to: '产线智能体', content: '已接收指令，上料模块已启动，振动盘开始工作，上料机械臂就绪。', timestamp: '08:01' },
  { from: '精密上料模块智能体', to: '高精度振动盘#1智能单元', content: '启动零件振动上料，频率设置为 60Hz。', timestamp: '08:01' },
  { from: '高精度振动盘#1智能单元', to: '精密上料模块智能体', content: '已接收指令，振动盘 #1 已启动，当前频率 60Hz。', timestamp: '08:02' },
  { from: '精密上料模块智能体', to: '六轴上料机械臂#1智能单元', content: '启动上料程序，从振动盘取料并放置到检测工位。', timestamp: '08:02' },
  { from: '六轴上料机械臂#1智能单元', to: '精密上料模块智能体', content: '已接收指令，六轴机械臂 #1 已就绪，开始上料。', timestamp: '08:03' },
  { from: '产线智能体', to: '多视角高速检测模块智能体', content: '上料模块已就绪，请启动检测程序。', timestamp: '08:03' },
  { from: '多视角高速检测模块智能体', to: '产线智能体', content: '已接收指令，检测模块已启动，等待零件进入检测工位。', timestamp: '08:04' },
  { from: '多视角高速检测模块智能体', to: '顶部高速工业相机#1智能单元', content: '启动图像采集，曝光时间 8ms，增益 2.0。', timestamp: '08:04' },
  { from: '顶部高速工业相机#1智能单元', to: '多视角高速检测模块智能体', content: '已接收指令，相机 #1 已启动，参数配置完成。', timestamp: '08:05' },
  { from: '多视角高速检测模块智能体', to: '高性能图像处理单元#1智能单元', content: '接收图像数据并启动缺陷检测算法，阈值 60，最小缺陷距离 2mm。', timestamp: '08:05' },
  { from: '高性能图像处理单元#1智能单元', to: '多视角高速检测模块智能体', content: '已接收指令，图像处理单元 #1 已启动，开始缺陷检测。', timestamp: '08:06' },
  { from: '多视角高速检测模块智能体', to: '产线智能体', content: '检测模块完成单件零件检测，结果：合格。', timestamp: '08:07' },
  { from: '产线智能体', to: '柔性分拣执行模块智能体', content: '检测模块已完成检测，请启动分拣程序。', timestamp: '08:07' },
  { from: '柔性分拣执行模块智能体', to: '产线智能体', content: '已接收指令，分拣执行模块已启动，等待检测结果。', timestamp: '08:08' },
  { from: '柔性分拣执行模块智能体', to: '高速分拣机械臂#1智能单元', content: '接收检测结果，准备执行零件分拣。', timestamp: '08:08' },
  { from: '高速分拣机械臂#1智能单元', to: '柔性分拣执行模块智能体', content: '已接收指令，分拣机械臂 #1 已就绪。', timestamp: '08:09' },
  { from: '柔性分拣执行模块智能体', to: '高速分拣机械臂#1智能单元', content: '执行分拣动作，合格品送至 OK 传送带，不合格品送至 NG 滑槽。', timestamp: '08:09' },
  { from: '高速分拣机械臂#1智能单元', to: '柔性分拣执行模块智能体', content: '分拣机械臂 #1 已完成分拣。', timestamp: '08:10' },
  { from: '柔性分拣执行模块智能体', to: '产线智能体', content: '分拣模块完成单件零件分类，结果已回传。', timestamp: '08:10' },
  { from: '产线智能体', to: 'OK/NG 品分类下料模块智能体', content: '分拣模块已完成分类，请启动下料流程。', timestamp: '08:11' },
  { from: 'OK/NG 品分类下料模块智能体', to: '产线智能体', content: '已接收指令，下料模块已启动，准备执行下料。', timestamp: '08:11' },
  { from: 'OK/NG 品分类下料模块智能体', to: 'OK 品高速传送带#1智能单元', content: '启动传送带，将合格品输送至收集工位。', timestamp: '08:12' },
  { from: 'OK 品高速传送带#1智能单元', to: 'OK/NG 品分类下料模块智能体', content: 'OK 品传送带 #1 已启动，开始输送合格品。', timestamp: '08:12' },
  { from: 'OK/NG 品分类下料模块智能体', to: 'NG 品下料漏斗#1智能单元', content: '打开下料漏斗，引导不合格品进入 NG 收集箱。', timestamp: '08:13' },
  { from: 'NG 品下料漏斗#1智能单元', to: 'OK/NG 品分类下料模块智能体', content: 'NG 品下料漏斗 #1 已开启。', timestamp: '08:13' },
  { from: 'OK/NG 品分类下料模块智能体', to: '产线智能体', content: '下料模块完成单件零件下料。', timestamp: '08:14' },
  { from: '产线智能体', to: '产线', content: '单件零件分拣完成，继续执行后续批次任务。', timestamp: '08:14' },
  { from: '产线智能体', to: '数据分析与监控模块智能体', content: '请更新产线实时运行数据，并分析本批次质量结果。', timestamp: '08:15' },
  { from: '数据分析与监控模块智能体', to: '产线智能体', content: '实时数据已更新，质量分析完成，当前合格率 99.96%。', timestamp: '08:16' },
  { from: '产线智能体', to: '产线', content: '批次 #20240801-01 首件流程完成，产线继续稳定执行任务。', timestamp: '08:17' },
]

// export const agentConversationMessages: AgentMessage[] = [
//   { from: '产线级规划智能体', to: '数字孪生产线', content: '启动锂电池模组装配产线重构流程，当前进入单元级布局装配阶段。', timestamp: '08:30' },
//   { from: '产线级规划智能体', to: '厂房地面单元', content: '优先装配基础场景，加载地面参考模型并建立全局坐标原点。', timestamp: '08:31' },
//   { from: '厂房地面单元', to: '产线级规划智能体', content: '厂房地面装配完成，基准位置校准至 (-0.57, -9.05, 0.76)，可继续挂载生产单元。', timestamp: '08:31' },
//   { from: '产线级规划智能体', to: '厂房模型单元', content: '装配厂房主体结构，校验与地面基准的空间对齐关系。', timestamp: '08:32' },
//   { from: '厂房模型单元', to: '产线级规划智能体', content: '厂房主体已布置至 (0.00, 12.20, 10.80)，空间包络匹配正常。', timestamp: '08:32' },
//   { from: '产线级规划智能体', to: '围栏安全单元', content: '装配外围安全围栏，形成产线边界并预留上料与检修通道。', timestamp: '08:33' },
//   { from: '围栏安全单元', to: '产线级规划智能体', content: '围栏单元已完成部署，关键节点坐标包含 (-10.16, 0.00, -17.91) 与 (-11.63, 0.00, -1.92)。', timestamp: '08:33' },
//   { from: '产线级规划智能体', to: '电芯上料工作站', content: '装配上料起始单元，作为模组产线入口工位接入主线。', timestamp: '08:34' },
//   { from: '电芯上料工作站', to: '产线级规划智能体', content: '上料工作站已布置至 (4.54, -0.02, -8.23)，与前段通道连接完成。', timestamp: '08:34' },
//   { from: '产线级规划智能体', to: '倍速链线体', content: '装配主输送骨架，建立各工作站之间的连续流转路径。', timestamp: '08:35' },
//   { from: '倍速链线体', to: '产线级规划智能体', content: '倍速链线体已固定在 (2.39, 0.40, 4.66)，主线方向与布局规划一致。', timestamp: '08:35' },
//   { from: '产线级规划智能体', to: '端板输送线', content: '接入辅料输送支线，与主线保持节拍同步。', timestamp: '08:36' },
//   { from: '端板输送线', to: '产线级规划智能体', content: '端板输送线已布置至 (7.79, 0.00, 3.97)，与倍速链接口对接完成。', timestamp: '08:36' },
//   { from: '产线级规划智能体', to: '电芯大面清洗极性检测读码单元', content: '装配检测识别单元，位于上料后段，用于清洗、极性识别与读码。', timestamp: '08:37' },
//   { from: '电芯大面清洗极性检测读码单元', to: '产线级规划智能体', content: '检测读码单元已放置至 (8.41, 7.17, 11.79)，视觉检测视场覆盖正常。', timestamp: '08:37' },
//   { from: '产线级规划智能体', to: '导热壳供料打码读码及涂胶A', content: '装配壳体供料与涂胶工位，并校验与主装配区的相对位置。', timestamp: '08:38' },
//   { from: '导热壳供料打码读码及涂胶A', to: '产线级规划智能体', content: '导热壳工位已布置至 (13.85, 0.00, -1.17)，供料方向与下游装配工位匹配。', timestamp: '08:38' },
//   { from: '产线级规划智能体', to: '单体装配工作站', content: '装配单体装配工作站，作为模组核心装配单元接入主线中段。', timestamp: '08:39' },
//   { from: '单体装配工作站', to: '产线级规划智能体', content: '单体装配工作站已布置至 (-0.72, 0.00, 17.45)，与上游检测、下游贴胶位置关系正常。', timestamp: '08:39' },
//   { from: '产线级规划智能体', to: '跨接片组装工作站', content: '装配跨接片组装工位，确保与主装配站形成连续作业路径。', timestamp: '08:40' },
//   { from: '跨接片组装工作站', to: '产线级规划智能体', content: '跨接片组装工作站已布置至 (6.69, 0.00, -9.91)，工位姿态校正完成。', timestamp: '08:40' },
//   { from: '产线级规划智能体', to: '贴胶工作站', content: '装配贴胶工作站，并校验末端执行空间与维护空间。', timestamp: '08:41' },
//   { from: '贴胶工作站', to: '产线级规划智能体', content: '贴胶工作站已布置至 (11.00, 0.00, 17.66)，操作侧与检修侧预留满足要求。', timestamp: '08:41' },
//   { from: '产线级规划智能体', to: '模组堆叠总装单元', content: '装配模组堆叠总装单元，建立中后段总装核心节点。', timestamp: '08:42' },
//   { from: '模组堆叠总装单元', to: '产线级规划智能体', content: '模组堆叠总装已布置至 (-3.70, 0.00, -0.04)，与周边单元间距满足装配约束。', timestamp: '08:42' },
//   { from: '产线级规划智能体', to: '激光加工模块', content: '装配激光相关单元，包括激光器模块、五轴激光加工站及配套电源柜。', timestamp: '08:43' },
//   { from: '激光加工模块', to: '产线级规划智能体', content: '激光器模块位于 (-1.67, 0.00, -7.33)，五轴激光加工站区域坐标为 (7.87, -3.93, -7.74) 与 (12.47, -3.04, -3.37)，激光加工区域建模完成。', timestamp: '08:44' },
//   { from: '产线级规划智能体', to: '激光打标机', content: '补充装配打标单元，接入激光加工后段。', timestamp: '08:45' },
//   { from: '激光打标机', to: '产线级规划智能体', content: '激光打标机已布置至 (-11.58, 0.00, 13.93)，与检测路径无干涉。', timestamp: '08:45' },
//   { from: '产线级规划智能体', to: '检测单元', content: '装配末端检测单元，作为产线闭环校验节点。', timestamp: '08:46' },
//   { from: '检测单元', to: '产线级规划智能体', content: '检测单元已布置至 (-14.80, 0.00, 7.53)，检测视角与上下游物流通道已完成校核。', timestamp: '08:46' },
//   { from: '产线级规划智能体', to: '模组线下组件', content: '装配线下缓存与下线单元，形成产线末端收尾结构。', timestamp: '08:47' },
//   { from: '模组线下组件', to: '产线级规划智能体', content: '线下组件已布置至 (16.02, 9.57, 6.17)，下线缓存路径建立完成。', timestamp: '08:47' },
//   { from: '产线级规划智能体', to: '数字孪生产线', content: '本轮生产线单元交互式装配完成，关键工位、输送单元与检测节点均已完成空间映射。', timestamp: '08:48' },
// ]

export const userConversationMessages: ChatMessage[] = [
  {
    id: 1,
    prompt: '请概述当前分拣产线协同状态。',
    response: '当前产线由产线、模块和单元三级智能体协同执行，任务已经进入稳定流转阶段。',
    createdAt: '2024-03-20T10:00:00Z',
  },
  {
    id: 2,
    prompt: '当前系统包含哪些核心能力？',
    response: '系统支持任务分解、节点协同、执行监控、流程可视化和状态回溯。',
    createdAt: '2024-03-20T10:01:00Z',
  },
  {
    id: 3,
    prompt: '检测完成后如何进入分拣流程？',
    response: '检测模块将结果回传至产线智能体，再由产线智能体调度分拣模块执行分类动作。',
    createdAt: '2024-03-20T10:02:00Z',
  },
]

export function getAgentLevel(role: string) {
  if (role.includes('产线')) {
    return 'line' as const
  }

  if (role.includes('模块')) {
    return 'module' as const
  }

  return 'unit' as const
}

export function getModelOptions(role: string) {
  return modelOptionsByLevel[getAgentLevel(role)]
}

export function getDefaultModel(role: string) {
  return defaultModelByRole[getAgentLevel(role)]
}

export function getAgentTools(role: string) {
  if (role.includes('振动盘')) {
    return agentToolsByRole['振动盘单元智能体']
  }

  if (role.includes('机械臂')) {
    return agentToolsByRole['机械臂单元智能体']
  }

  if (role.includes('相机') || role.includes('视觉')) {
    return agentToolsByRole['相机单元智能体']
  }

  if (role.includes('传送带')) {
    return agentToolsByRole['传送带单元智能体']
  }

  if (role.includes('包装')) {
    return agentToolsByRole['包装单元智能体']
  }

  return agentToolsByRole[role] ?? agentToolsByRole['分拣产线智能体']
}
