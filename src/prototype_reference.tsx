import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Search, 
  Info, 
  HelpCircle, 
  Lightbulb, 
  RefreshCw, 
  Target, 
  Check, 
  X, 
  AlertOctagon, 
  ShoppingCart, 
  Plus, 
  SlidersHorizontal,
  ChevronLeft,
  Globe,
  BookMarked,
  Briefcase,
  FileText,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';

// 专门为零基础家长设计的“白话留学黑话词典”
const NOVICE_GLOSSARY = {
  ib: {
    title: '什么是 IB (国际文凭)？',
    summary: '国际公认含金量最高、难度最大的高中课程体系。总分45分，考到38分就算优秀，42分以上可冲刺世界顶级名校。',
    detail: '要求学生修读6门学科（通常为3门高难度HL + 3门基础SL），外加3门核心任务（知识理论TOK、扩展长论文EE、课外活动CAS，合计3分附加分）。'
  },
  hl_sl: {
    title: 'HL 和 SL 是什么区别？',
    summary: 'HL（Higher Level，高难度），SL（Standard Level，标准难度）。',
    detail: '大学具体专业会强制要求特定核心学科必须选 HL 并达到6-7分（例如顶尖CS专业必须选 Math AA HL 并考到7分）。普通选课仅支持3门HL（极少数4门），选多无法兼顾。'
  },
  math_stream: {
    title: 'Math AA 与 Math AI 的巨大陷阱！',
    summary: 'Math AA（分析与方法，偏纯数学推导与微积分）；Math AI（应用与解释，偏统计计算）。',
    detail: '重点避坑：牛津、剑桥、帝国理工、滑铁卢、CMU等绝大多数顶尖大学计算机与工程系，严禁或极其不推荐使用 Math AI 申请！必须选 Math AA HL。'
  },
  predicted: {
    title: '为什么说“预估分 (Predicted Grade)”决定生死？',
    summary: '海外大学在高三上学期（大考前大半年）就开始录取，他们看的不是高考成绩，而是学校老师根据平时成绩给出的预估分。',
    detail: '如果高二期末预估分不高，连牛剑或美本Top30的初审门槛都过不了，甚至没有资格去考笔试或面试。'
  }
};

// 细化至【大学 + 具体专业项目】维度，具备明确硬性录取条件、必修IB科目与附加考核
const PROGRAM_DATABASE = [
  {
    id: 'cmu_cs',
    uniName: '卡耐基梅隆大学 (CMU)',
    programName: '计算机科学学士 (School of Computer Science - BSCS)',
    category: 'Computer Science',
    country: 'USA',
    countryName: '美国',
    city: '匹兹堡',
    badge: '全球CS顶级神殿',
    tuitionYear: '约 $65,000 / 年 (约合47万人民币)',
    livingCostYear: '约 $20,000 / 年 (约合14万人民币)',
    totalAnnualRmb: '约 60 - 65 万人民币',
    graduationDifficulty: '极高 (5/5 课业极其高压，硬核代码量巨大)',
    jobMarket: '硅谷与华尔街最高直推声誉，毕业起薪全美第一梯队 ($140k+)',
    visaWork: 'STEM OPT 3年合法工作，需抽H-1B工作签',
    prPath: '排期较长，通常走大厂外派(L1)或技术积累走EB-1/EB-2',
    admissionReqs: {
      minPredicted: 43,
      predictedText: '预估建议 42-44+ (极度激烈，录取率<4%)',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 7, label: 'Mathematics AA HL (必须7分)' },
        { code: 'PHYSICS', level: 'HL', minGrade: 7, label: 'Physics HL (必须7分)' }
      ],
      preferredCourses: [
        { code: 'CS', level: 'HL', minGrade: 6, label: 'Computer Science HL (建议6-7分)' }
      ],
      forbiddenCourses: ['Math AI SL', 'Math AI HL (极不推荐)'],
      extraExams: ['无官方笔试，但看重 USACO Platinum/Gold 或 AMC12/AIME 极高分', '需硬核 GitHub 项目证明']
    },
    fitReasons: [
      '全球代码能力与计算机学术的顶峰，代码写得好且数理极其扎实的天才首选',
      '在硅谷大厂和高频量化基金(Quant)拥有免简历初筛的绝对特权'
    ]
  },
  {
    id: 'oxford_cs',
    uniName: '牛津大学 (Oxford)',
    programName: '计算机科学学士 (BA/MCompSci in Computer Science)',
    category: 'Computer Science',
    country: 'UK',
    countryName: '英国',
    city: '牛津',
    badge: '纯理论数理天花板',
    tuitionYear: '约 £50,000 / 年 (约合47万人民币)',
    livingCostYear: '约 £16,000 / 年 (约合15万人民币)',
    totalAnnualRmb: '约 60 - 62 万人民币',
    graduationDifficulty: '极高 (4.8/5 每周纯正导师制Tutorial，高强度离散数学推导)',
    jobMarket: '伦敦金融城顶级对冲基金（Jane Street、Citadel）及顶尖AI研究室直通车',
    visaWork: 'Graduate Route (PSW) 2年工签，高薪技术人才留用稳定',
    prPath: '工签满5年可申请英国永居(ILR)',
    admissionReqs: {
      minPredicted: 42,
      predictedText: '官方底线39分，实际CS录取平均预估 43-44分 (HL 776/777)',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 7, label: 'Mathematics AA HL (必须7分满分，拒收Math AI)' }
      ],
      preferredCourses: [
        { code: 'PHYSICS', level: 'HL', minGrade: 7, label: 'Physics HL 或 Further Math HL (建议7分)' },
        { code: 'CS', level: 'HL', minGrade: 7, label: 'Computer Science HL' }
      ],
      forbiddenCourses: ['Math AI SL (直接拒)', 'Math AI HL (不接受)'],
      extraExams: ['必须参加牛津统一入学附加机考 MAT (Mathematics Admissions Test)', '入围后需参加多轮学术面试']
    },
    fitReasons: [
      '不看复杂的课外活动，只看极致的数学逻辑天赋、MAT附加考试成绩与面试表现',
      '学术底蕴最纯正，极其适合喜欢钻研理论算法、性格严谨专注的学生'
    ]
  },
  {
    id: 'waterloo_se',
    uniName: '滑铁卢大学 (Waterloo)',
    programName: '软件工程 (Software Engineering - BSE with Co-op)',
    category: 'Software Engineering',
    country: 'Canada',
    countryName: '加拿大',
    city: '滑铁卢',
    badge: '北美实习与就业之王',
    tuitionYear: '约 CAD $68,000 / 年 (约合36万人民币)',
    livingCostYear: '约 CAD $18,000 / 年 (约合9万人民币)',
    totalAnnualRmb: '约 45 - 48 万人民币 (Co-op带薪实习可收回20万+)',
    graduationDifficulty: '高 (4.5/5 必须兼顾工程院高压物理+硬件+编程课，且每4个月轮换找工)',
    jobMarket: '北美顶尖Co-op系统，本科期间累积2年顶级科技大厂工作经验，毕业起薪领跑加拿大',
    visaWork: '毕业无条件拿3年开放式工签(PGWP)，不强制捆绑单一雇主',
    prPath: '安省省提名(OINP)与EE通道极高分，移民确定性位列全球第一梯队',
    admissionReqs: {
      minPredicted: 40,
      predictedText: '建议预估 41-43分 (工程院SE审核极其严苛)',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 7, label: 'Mathematics AA HL (建议7分，不收Math AI)' },
        { code: 'PHYSICS', level: 'HL', minGrade: 6, label: 'Physics HL 或 SL (必须包含物理，建议HL 6-7分)' },
        { code: 'CHEMISTRY', level: 'SL', minGrade: 6, label: 'Chemistry (工程院强制必须修读化学，HL或SL均可)' }
      ],
      preferredCourses: [
        { code: 'CS', level: 'HL', minGrade: 6, label: 'Computer Science HL (有加分)' }
      ],
      forbiddenCourses: ['Math AI SL', '未修物理或未修化学将直接失去SE工程资格'],
      extraExams: ['强烈要求参加 Euclid 欧几里得数学竞赛 (建议85分+) 与 CCC 计算机竞赛', '提交 AIF (入学申请补充表) 文书']
    },
    fitReasons: [
      '最放心的“就业/留存兜底王牌”，北美科技企业认可度极高',
      '适合追求带薪实习、目标留加拿身份、能承受工科课业压力的家庭'
    ]
  },
  {
    id: 'waterloo_cs',
    uniName: '滑铁卢大学 (Waterloo)',
    programName: '计算机科学学士 (Computer Science - BCS with Co-op)',
    category: 'Computer Science',
    country: 'Canada',
    countryName: '加拿大',
    city: '滑铁卢',
    badge: '纯CS+带薪实习首选',
    tuitionYear: '约 CAD $66,000 / 年 (约合35万人民币)',
    livingCostYear: '约 CAD $18,000 / 年 (约合9万人民币)',
    totalAnnualRmb: '约 45 万人民币',
    graduationDifficulty: '中高 (4/5 纯数学院CS，不强制修物理化学，编程和数学为主)',
    jobMarket: '与SE共享Co-op资源，北美大厂直聘率最高',
    visaWork: '毕业获3年工签(PGWP)',
    prPath: '技术移民确定性极高',
    admissionReqs: {
      minPredicted: 39,
      predictedText: '预估建议 40-42分 (数学院录取比SE稍具弹性，但数学要求顶格)',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 7, label: 'Mathematics AA HL (必须7分，Math AI不可替代)' }
      ],
      preferredCourses: [
        { code: 'CS', level: 'HL', minGrade: 6, label: 'Computer Science HL' },
        { code: 'PHYSICS', level: 'SL', minGrade: 6, label: 'Physics SL 或 HL' }
      ],
      forbiddenCourses: ['Math AI SL'],
      extraExams: ['Euclid 竞赛成绩直接作为数学院奖学金与录取的重大加分项']
    },
    fitReasons: [
      '相比软件工程(SE)，不强制要求同时修读化学和物理，选课负担显著减轻',
      '纯粹强化算法与数学，同样享受滑铁卢王牌 Co-op 就业资源'
    ]
  },
  {
    id: 'nus_cs',
    uniName: '新加坡国立大学 (NUS)',
    programName: '计算学院 计算机科学学士 (School of Computing - BComp CS)',
    category: 'Computer Science',
    country: 'SG',
    countryName: '新加坡',
    city: '新加坡',
    badge: '亚洲计算机第1',
    tuitionYear: '约 S$40,000 / 年 (签服务减免后约16万人民币)',
    livingCostYear: '约 S$16,000 / 年 (约合8-9万人民币)',
    totalAnnualRmb: '约 25 - 32 万人民币',
    graduationDifficulty: '高 (4/5 相对严酷的钟形曲线分流)',
    jobMarket: '东南亚金融科技中心与欧美大厂亚太研发中心枢纽',
    visaWork: '毕业获签发工作准证(EP)，签署学费减免者自带3年在新工作合同',
    prPath: '在新加坡高科技岗位纳税2-3年申请永久居民(PR)胜率极高',
    admissionReqs: {
      minPredicted: 42,
      predictedText: '对IB裸分极其死板，官方最低录取线通常在 42-44分',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 7, label: 'Mathematics AA HL (极度看重，必须7分)' },
        { code: 'PHYSICS', level: 'HL', minGrade: 6, label: 'Physics HL 或 Chemistry HL (必须有一门自然科学HL)' }
      ],
      preferredCourses: [
        { code: 'CS', level: 'HL', minGrade: 7, label: 'Computer Science HL' }
      ],
      forbiddenCourses: ['Math AI SL', '缺少物理或化学HL将严重减分'],
      extraExams: ['无强制笔试，但极其偏好国际数理奥林匹克或 NOI/APIO 奖项']
    },
    fitReasons: [
      '学费极具性价比（享受助学金签约后开销友好），亚洲顶尖声誉',
      '适合数理硬实力极强、偏好亚洲文化圈且追求高薪就业与快速绿卡的家庭'
    ]
  },
  {
    id: 'ucb_eecs',
    uniName: '加州大学伯克利分校 (UC Berkeley)',
    programName: '电气工程与计算机科学 (EECS - College of Engineering)',
    category: 'Computer Science & Engineering',
    country: 'USA',
    countryName: '美国',
    city: '伯克利',
    badge: '硅谷工程师摇篮',
    tuitionYear: '约 $52,000 / 年 (约合38万人民币)',
    livingCostYear: '约 $24,000 / 年 (约合17万人民币)',
    totalAnnualRmb: '约 55 - 60 万人民币',
    graduationDifficulty: '高 (4.7/5 大课竞争激烈，淘汰与曲线给分严酷)',
    jobMarket: '背靠硅谷湾区，科技巨头与前沿初创团队核心直聘基地',
    visaWork: 'STEM OPT 3年合法工作，需抽H-1B工作签',
    prPath: '通常通过EB-2/EB-3技术移民或高技术人才通道',
    admissionReqs: {
      minPredicted: 42,
      predictedText: '建议预估 42-44分 (公立工程学院顶尖竞争)',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 7, label: 'Mathematics AA HL (必须7分)' },
        { code: 'PHYSICS', level: 'HL', minGrade: 7, label: 'Physics HL (必须7分)' }
      ],
      preferredCourses: [
        { code: 'CS', level: 'HL', minGrade: 6, label: 'Computer Science HL' }
      ],
      forbiddenCourses: ['Math AI SL'],
      extraExams: ['UC系统不看SAT，全看校内GPA硬核程度、科研黑客松及多元化领导力文书']
    },
    fitReasons: [
      '顶尖公立工程学院，创业氛围浓厚，硅谷校友网络遍布全球',
      '适合自驱力极强、耐抗压且渴望在科技前沿领域大展身手的学生'
    ]
  },
  {
    id: 'tum_informatics',
    uniName: '慕尼黑工业大学 (TUM)',
    programName: '信息学学士 (B.Sc. in Informatics)',
    category: 'Computer Science',
    country: 'EU',
    countryName: '德国',
    city: '慕尼黑',
    badge: '欧陆工科顶流 & 超高性价比',
    tuitionYear: '约 €4,000 - 6,000 / 年 (约合3-5万人民币)',
    livingCostYear: '约 €14,000 / 年 (约合11万人民币)',
    totalAnnualRmb: '约 15 - 18 万人民币',
    graduationDifficulty: '极高 (4.9/5 宽进严出，大一数学和算法筛人率高达30%+)',
    jobMarket: '德国及欧盟工业4.0领头羊，宝马、西门子、SAP核心人才库',
    visaWork: '毕业自带18个月找工作签证，欧陆无雇主抽签障碍',
    prPath: '工作纳税满21个月(德语B1)即可直接申领德国永久居留(蓝卡通道)',
    admissionReqs: {
      minPredicted: 38,
      predictedText: '按德国KMK换算约1.2-1.5以内 (IB 38-40分稳过初审)',
      mandatoryCourses: [
        { code: 'MATH_AA', level: 'HL', minGrade: 6, label: 'Mathematics AA HL (必须HL，德国KMK硬性规定)' },
        { code: 'PHYSICS', level: 'HL', minGrade: 6, label: 'Physics HL (KMK自然科学认证)' }
      ],
      preferredCourses: [
        { code: 'CS', level: 'HL', minGrade: 6, label: 'Computer Science HL' }
      ],
      forbiddenCourses: ['Math AI (德国教育部不认可换取全科大学资格)'],
      extraExams: ['部分国际生需通过第一阶段材料初筛后参加学术能力倾向测试或面试']
    },
    fitReasons: [
      '极致工薪友好，年预算不到20万即可享受世界一流工程教育',
      '欧洲绿卡确定性最高，适合务实沉稳、数理扎实且能适应德式严谨学术考核的学生'
    ]
  }
];

// IB 核心学科保姆级提分指南
const COURSE_DETAILED_GUIDES = {
  MATH_AA: {
    name: 'Mathematics: Analysis & Approaches (AA HL)',
    targetScore: 7,
    role: '顶尖计算机/工程专业的定海神针，全科目中权重最高。',
    pitfall: '切勿贪图省事选择 Math AI；不可忽视内部评估(IA)，IA低于16分极易丢失7分。',
    roadmap: [
      { grade: 'G10 预备期', step: '提前夯实代数变换、三角函数与初等微积分，熟练操作图形计算器。' },
      { grade: 'G11 冲刺期', step: '主攻导数应用、积分技巧与复数向量，平时题库以Past Paper难题为主。' },
      { grade: 'IA 选题建议', step: '选择与密码学(如RSA算法)、图像变换或物理运动建模相关的纯数课题。' },
      { grade: 'G12 模拟考', step: '掐表限时完成 Paper 1 (无计算器) 与 Paper 3 (探究长题)，确保容错率<10%。' }
    ]
  },
  PHYSICS: {
    name: 'Physics (物理 HL / SL)',
    targetScore: 7,
    role: '工程学院(SE/EECS)与牛剑理工面试最核心的物理直觉支撑。',
    pitfall: '死记公式无法应对新大纲多情境题；简答题需准确使用专业物理术语。',
    roadmap: [
      { grade: 'G10 预备期', step: '构建经典力学与电路模型直觉，理解矢量分解与微积分物理意义。' },
      { grade: 'G11 冲刺期', step: '攻克电磁感应、波与粒子波动性等抽象高阶单元，强化实验数据不确定度分析。' },
      { grade: 'IA 选题建议', step: '设计真实物理传感器实验（如阻尼振动探究或电容充放电实验），强调误差论证。' },
      { grade: 'G12 模拟考', step: '专项整理 Paper 2 问答题标准得分关键词与公式链条推导规范。' }
    ]
  },
  CHEMISTRY: {
    name: 'Chemistry (化学 SL / HL)',
    targetScore: 6,
    role: '满足滑铁卢工程院等特定工科大学的前置自然科学刚性要求。',
    pitfall: '选修纯CS项目通常不需要化学HL，强行选HL容易分散数学精力，选SL即可。',
    roadmap: [
      { grade: 'G11 学习期', step: '掌握化学计量学、热力学与反应速率核心逻辑，梳理平衡移动规律。' },
      { grade: 'IA 选题建议', step: '开展酸碱滴定曲线影响因素或活化能测定，数据处理保持高精度。' },
      { grade: 'G12 考前复习', step: '记忆有机反应官能团转化路径及光谱解析规律，确保稳拿6分。' }
    ]
  },
  CS: {
    name: 'Computer Science (计算机科学 HL)',
    targetScore: 7,
    role: '直接展现编程实操、系统架构与算法落地能力的关键展示学科。',
    pitfall: '很多学校CS IA被判定不合格是因为缺少真实用户(Client)的明确需求与测试反馈。',
    roadmap: [
      { grade: 'G10 预备期', step: '精通 Java/Python 核心面向对象（类、继承、多态）及队列、栈、链表、树。' },
      { grade: 'IA 实战开发', step: '为真实社团或外部用户开发完整软件系统，提交规范严谨的软件开发生命周期文档。' },
      { grade: 'Case Study', step: '精研当年最新考题前沿案例分析（例如人脸识别伦理或边缘计算技术）。' },
      { grade: 'G12 模拟考', step: '限时刷透 Paper 1 系统原理与 Paper 2 专项选项题（OOP），保7分满分。' }
    ]
  }
};

// IB 深度科普全景指南数据
const IB_ENCYCLOPEDIA = {
  scoreStructure: {
    title: 'IB 45分制计分全景拆解',
    description: 'IB DP（大学预科项目）满分为 45 分。由【6门学科（每门1-7分，满分42分）】加上【核心三要素（TOK + EE，合计最高3分附加分）】组成。',
    tiers: [
      { range: '42 - 45分', badge: '全球前 2-3%', desc: '冲刺牛剑、常春藤、CMU SCS、伯克利 EECS、新加坡国立的绝对王牌分。' },
      { range: '38 - 41分', badge: '全球前 10%', desc: '主流世界前50名校（滑铁卢、帝国理工、UCL、多伦多、麦吉尔）的稳妥门槛。' },
      { range: '34 - 37分', badge: '全球前 25%', desc: '英国红砖大学、澳洲八大、欧陆顶尖理工（TUM）的录取主流区间。' },
      { range: '24 - 33分', badge: '文凭通过线 (≥24分)', desc: '24分为拿到国际文凭的及格底线（要求CAS完成且各科无严重不及格）。' }
    ]
  },
  sixGroups: [
    { group: '第一组：母语研究', note: '通常为 Chinese A 或 English A (文学/语言文学)，锻炼高阶批判性阅读与母语深度写作。' },
    { group: '第二组：习得第二语言', note: '通常为 English B (HL/SL) 或二外入门 (Ab Initio)，是大学直接免考托福/雅思的重要依据。' },
    { group: '第三组：个人与社会', note: '包含经济学 (Economics)、历史、心理学、商业管理等，理工生通常首选经济或心理学拉高均分。' },
    { group: '第四组：实验科学', note: '核心硬课：物理 (Physics)、化学 (Chemistry)、生物或计算机科学，工程类大学通常强制要求1-2门理科。' },
    { group: '第五组：数学', note: '分流为 Math AA (分析与方法) 与 Math AI (应用与解释)。顶尖计算机与工程专业只认可 Math AA HL。' },
    { group: '第六组：艺术或自由选修', note: '可修读音乐/视觉艺术，亦可放弃艺术在第3或第4组中多选一门理科（如同时选物理+化学+CS）。' }
  ],
  coreElements: [
    {
      code: 'TOK',
      name: '知识理论 (Theory of Knowledge)',
      highlight: '考查“我们如何知道我们所知道的”，偏认识论哲学思辨。',
      detail: '需提交一份由10幅物证与3张图文构成的展览(Exhibition)和一篇1600字大论文。与 EE 组合矩阵换算最高获得 3 分附加分。'
    },
    {
      code: 'EE',
      name: '扩展长论文 (Extended Essay)',
      highlight: '高中阶段独立学术研读的天花板（4000字英文论文）。',
      detail: '在导师指导下对特定学科进行长达半年的深度研究（如计算机算法效率对比、物理阻尼模型建模），是大学申请文书核心亮点。'
    },
    {
      code: 'CAS',
      name: '创新·行动·服务 (Creativity, Activity, Service)',
      highlight: '不计入45分裸分，但不完成则一票否决无法获得 IB 文凭。',
      detail: '要求高中两年持续记录150小时左右的真实社团、运动与社区公益服务，注重自省反思报告与领导力积累。'
    }
  ],
  assessments: [
    {
      title: '内部评估 IA (Internal Assessment)',
      ratio: '占单科总分的 20% - 30%',
      desc: '由本校科任老师在校内指导并打分，随后将样本封存寄往瑞士/英国由 IB 官方考官进行随机抽样审核（Moderation），若学校打分虚高会被全校同批次扣分降等。'
    },
    {
      title: '全球外部大考 EA (External Assessment)',
      ratio: '占单科总分的 70% - 80%',
      desc: '每年 5 月（北半球）或 11 月（南半球）进行全球统考。试卷全英文闭卷，由全球独立考官双盲流水阅卷，防作弊与学术诚信极严。'
    }
  ],
  faqs: [
    {
      q: '为什么说偏科的学生读 IB 会极其痛苦？',
      a: 'IB 要求必须跨 6 大组兼顾文理，就算数学物理满分，如果母语语文或第二外语只有 3-4 分，总分就会直接被拖至 35 分以下，错失顶级名校。偏科极端的孩子更适合以自由组合选课为主的 A-Level 或 AP 体系。'
    },
    {
      q: '选 4 门 HL 相比选 3 门 HL 更有优势吗？',
      a: '极少数大学（如牛津/剑桥/帝国理工部分专业）对 4 门 HL 有微弱加分好感，但大多数海外大学录取只看 3 门最佳 HL 小分（如 7, 7, 6）。多修 1 门 HL 意味着每周多出近 4 小时的高压授课与独立课业，极易因精力透支拖垮所有科目，一般不建议普通学生硬冲 4HL。'
    },
    {
      q: '学校平时给的预估分 (PG) 如果虚高，会有什么严重后果？',
      a: '如果老师给的预估分是 43 分拿到了帝国理工的条件录取 (Conditional Offer)，而 5 月全球大考真实成绩只有 37 分，未能达到大学给出的录取底线（通常要求 39-40 分），大学将直接撤销录取资格，导致学生无学可上。'
    }
  ]
};

// 主流国家工签与永居身份政策库
const VISA_IMMIGRATION_POLICIES = {
  Canada: {
    countryName: '加拿大 (Canada)',
    flag: '🇨🇦',
    visaBadge: '3年免担保开放工签 (PGWP)',
    prStability: '极高 (全球技术移民透明度第一梯队)',
    postStudyVisa: {
      name: '毕业后工作签证 (PGWP - Post-Graduation Work Permit)',
      duration: '本科4年毕业无条件获签 3 年',
      employerBond: '开放式工签 (Open Work Permit)，不强制绑定单一雇主，可自由换公司或跨省工作。',
      notes: '无需加拿大雇主提前开具 LMIA 劳工批文，只要在正规公立大学（如滑铁卢、多伦多等 DLI 院校）完成全日制学位即可直接申领。'
    },
    prPathway: {
      name: '快速通道 Express Entry (EE - CEC) 与省提名 (OINP / BCPNP)',
      timeframe: '毕业工作满 1-2 年即可进入池子捞人，最快毕业第 3 年拿枫叶卡',
      requirements: [
        '加拿大经验类 (CEC)：在加拿大本地大厂或企业合法工作满 1 年（NOC TEER 0/1/2/3 类别，包括软件工程师、数据分析师等）。',
        '语言要求：英语思培 (CELPIP) 或雅思 G 类达到 CLB 7-9 级。',
        '安省省提名 (OINP Tech Draw)：滑铁卢所在的安大略省针对 STEM 计算机技术人才有定期定向邀请加分，确定性极高。'
      ]
    },
    techAdvice: '滑铁卢大学自带 5-6 次带薪实习 (Co-op)，虽然实习期不全算入 CEC，但能确保毕业前就拿到顶级科技大厂的 Return Offer，毕业即上岗，是全世界留学生肉身拿绿卡最稳路径。'
  },
  UK: {
    countryName: '英国 (United Kingdom)',
    flag: '🇬🇧',
    visaBadge: '2年毕业生签证 (Graduate Route / PSW)',
    prStability: '中等 (需5年雇主工签积累)',
    postStudyVisa: {
      name: '毕业生工签 (Graduate Route，原 PSW 签证)',
      duration: '本科/硕士毕业可直接获签 2 年 (博士生3年)',
      employerBond: '不绑定雇主，允许留英找工作、创业或自由职业。',
      notes: '此 2 年签证不可直接计入 5 年技术移民永居年限，但可作为衔接正式工作签证 (Skilled Worker Visa) 的黄金跳板。'
    },
    prPathway: {
      name: '技术工人签证 (Skilled Worker Visa) 转永居 (ILR)',
      timeframe: '转为合规技术工签后连续工作纳税满 5 年可申请永久居留 (Indefinite Leave to Remain)',
      requirements: [
        '必须获得具有内政部赞助资质 (Sponsor Licence) 的合规雇主发放合法工签。',
        '年薪底线要求：需满足英国内政部对特定工种制定的薪资门槛（2024新政大幅调高技术工签最低年薪至 £38,700，但对于刚毕业的新人/新进入者 New Entrant 可享受 70% 折扣）。',
        '计算机顶尖名校（牛津、剑桥、帝国）在伦敦金融城量化对冲基金或科技外企起薪普遍超标，赞助门槛对拔尖生影响相对有限。'
      ]
    },
    techAdvice: '如果在英国目标留英，牛津/帝国理工 CS 毕业进伦敦金融城（如 Citadel、Jane Street、高盛）或欧美大厂研发中心是最佳策略，高薪岗位雇主赞助稳定。'
  },
  USA: {
    countryName: '美国 (United States)',
    flag: '🇺🇸',
    visaBadge: '3年 STEM OPT (需抽 H-1B)',
    prStability: '难度极大 (中国大陆出生排期长达数年)',
    postStudyVisa: {
      name: '选择性实习训练 (STEM OPT - Optional Practical Training)',
      duration: '1 年初始 OPT + 24 个月 STEM 延期 = 最长 3 年合法全职工作',
      employerBond: '必须就职于与所学专业严格相关的 E-Verify 认证雇主。',
      notes: '计算机科学 (CS)、软件工程 (SE) 与数据科学均属于合规 STEM 专业，享有总计 3 次抽取 H-1B 工作签证的机会。'
    },
    prPathway: {
      name: 'H-1B 抽签 → 雇主赞助 EB-2 / EB-3 职业移民绿卡 (PERM)',
      timeframe: '由于中国大陆出生人口存在严重排期 (Retrogression)，从递交到真正拿到绿卡通常需要 5 - 8 年以上。',
      requirements: [
        '抽签概率：每年 3 月由移民局进行电脑随机抽签，硕士及以上学历中签率略高于本科（近年单次中签率约 20%-25%）。',
        '绿卡申请：大厂（Google/Meta/Apple等）通常在入职 1-2 年后协助启动 PERM 劳工证与 I-140 申请以锁定优先日 (Priority Date)。',
        '备选路径：若抽签未中，常通过外派至加拿大或欧洲办公室 1 年后，凭 L-1 跨国派遣签证重新调回美国。'
      ]
    },
    techAdvice: '来美读 CS 的首要目标是高薪（年薪 $140k+ 跑赢全球）与顶级工程视野；若家庭核心诉求是“必须 3 年内稳拿海外护照/绿卡”，美国绝非优选项，建议考虑加拿大或德国。'
  },
  SG: {
    countryName: '新加坡 (Singapore)',
    flag: '🇸🇬',
    visaBadge: 'EP就业准证 / 政府助学金绑约3年',
    prStability: '中高 (科技紧缺人才获批率高)',
    postStudyVisa: {
      name: '就业准证 (Employment Pass - EP) & 助学金契约',
      duration: 'EP 首次签发通常为 2 年，续签 3 年',
      employerBond: '签署新加坡教育部 Tuition Grant 学费减免协议的国际生，毕业后必须留在新加坡注册企业合法工作 3 年以履约。',
      notes: '无需担心工签配额抽签问题；自2023年9月起，新加坡实行 COMPASS 互补专才评估框架，国大 (NUS)/南洋理工 (NTU) 毕业生在名校学历项直接拿满分 20 分。'
    },
    prPathway: {
      name: '专业/技术人员及技术工人计划 (PTS PR Scheme)',
      timeframe: '持 EP 准证在新加坡连续合法纳税工作 1 - 2 年即可递交永久居民 (PR) 申请，审批周期约 6-12 个月',
      requirements: [
        '科技紧缺人才：新加坡将 AI、网络安全、云计算与金融科技列为国家战略紧缺清单。',
        '薪资与纳税记录：月薪建议达到 S$6,000 - S$9,000 以上更有竞争力。',
        '文化融入度：新加坡对华人员工亲和度极高，无语言障碍，高薪留存率突出。'
      ]
    },
    techAdvice: '新加坡适合既希望享受顶尖科技研发平台、又希望生活环境离中国近（航班4-5小时、无时差）且追求快速拿到身份的家庭。'
  },
  EU: {
    countryName: '德国 / 欧陆 (Germany / EU)',
    flag: '🇩🇪',
    visaBadge: '18个月找工签 / 欧盟蓝卡 (EU Blue Card)',
    prStability: '极高 (法案明确，满21个月即可申永居)',
    postStudyVisa: {
      name: '找工作签证 (Jobseeker Visa) & 欧盟蓝卡',
      duration: '毕业直接签发 18 个月找工作签证，找到专业对口工作即换蓝卡',
      employerBond: '自由兼职或全职找工，蓝卡持有人工作满 1 年后可自由转换欧盟雇主。',
      notes: '德国工业 4.0 与 IT 工程师长期严重短缺，针对紧缺工种 (MINT) 的蓝卡年薪要求仅需约 €41,000 - €45,000，TUM 应届生轻松达标。'
    },
    prPathway: {
      name: '德国永久居留权 (Niederlassungserlaubnis) 蓝卡快速通道',
      timeframe: '持有蓝卡并按规定缴纳养老保险满 21 个月 (需德语 B1) 或满 27 个月 (德语 A1) 即可直接拿到德国永居',
      requirements: [
        '持有德国受认可的正规大学（如慕尼黑工业大学 TUM）本科学历。',
        '从事与所学专业匹配的高技能岗位（软件开发、系统架构、工业自动化）。',
        '2024年德国正式实施全新《国籍法改革》，允许双重国籍并将合法居留入籍年限缩短至最快 3-5 年。'
      ]
    },
    techAdvice: '欧陆高福利且工作生活平衡（年假30天、不卷加班），学费接近于零。只要孩子愿意跨越德语日常沟通关卡，德国是全欧洲拿到绿卡最快且最稳健的目的地。'
  },
  AU: {
    countryName: '澳大利亚 (Australia)',
    flag: '🇦🇺',
    visaBadge: '2-4年毕业生工签 (Subclass 485)',
    prStability: '中等 (需通过 EOI 技术移民打分)',
    postStudyVisa: {
      name: '485 毕业生工作签证 (Temporary Graduate Visa)',
      duration: '本科学历通常签发 2 年（偏远地区院校可额外续签 1-2 年）',
      employerBond: '全开放式工签，允许在全澳范围内全职工作、不限雇主。',
      notes: '申请要求雅思总分 6.5 (单科不低于5.5)，毕业后 6 个月内必须递交。'
    },
    prPathway: {
      name: '独立技术移民 (189) / 州担保移民 (190 / 491)',
      timeframe: '通过 SkillSelect 系统进行 EOI 打分排序，分数达标获邀后批复 PR（绿卡）',
      requirements: [
        '职业评估：需通过澳大利亚计算机协会 (ACS) 技能评估（通常需相关学位+1年工作经验或完成 PY 职业年）。',
        '年龄、学历、英语（PTE 4个79以上可加20分）、NAATI 翻译等综合打分。',
        '由于近年澳洲收紧配额，纯 189 独立技术移民竞争白热化，多推荐走新州/维州等紧缺 IT 州政府担保通道。'
      ]
    },
    techAdvice: '澳洲适合偏好宜居气候、相对宽松学习节奏的家庭，若目标紧盯永居身份，建议选择有偏远地区加分资格的名校校区或配合高分英语刷分。'
  }
};

// 5步诊断向导的通俗化题库
const WIZARD_QUESTIONS = [
  {
    step: 1,
    title: '第一步：孩子目前就读学校的过往历史表现？',
    subtitle: '国外大学非常看重学生所在高中的学术声誉和往年均分',
    key: 'schoolLevel',
    options: [
      { value: 'top', label: '🔥 顶级公立/顶级名校', desc: '学校历届 IB 平均分在 38 - 40分以上 (如部分知名顶尖外籍学校/公办国际部)' },
      { value: 'middle', label: '🏫 稳健主流学校', desc: '学校历届 IB 平均分在 34 - 37分左右 (多数成熟正规国际学校)' },
      { value: 'emerging', label: '🌱 新办学校 / 均分普通', desc: '学校历届 IB 平均分在 30 - 33分，或新办校暂无大量过往毕业生' }
    ]
  },
  {
    step: 2,
    title: '第二步：孩子在年级或班里的平时成绩排位？',
    subtitle: '海外大学高三录取主要参考高二老师给的“预估分(Predicted Grade)”',
    key: 'studentRank',
    options: [
      { value: 'top5', label: '🏆 年级前 5% - 10%', desc: '数理逻辑极强，各科几乎无短板，预估总分有望冲刺 42 - 44+ 分' },
      { value: 'top25', label: '⭐ 年级前 15% - 25%', desc: '主科稳定优秀，部分科目稍有波动，预估总分有望稳定在 39 - 41 分' },
      { value: 'middle', label: '📈 年级中游 40% - 60%', desc: '有偏科现象或适应中，预估总分预计在 35 - 38 分区间' }
    ]
  },
  {
    step: 3,
    title: '第三步：孩子的兴趣爱好与学科特长倾向？',
    subtitle: '决定报读纯计算机(CS)、软件工程(SE)还是交叉应用方向',
    key: 'interestTrack',
    options: [
      { value: 'pure_cs', label: '💻 纯代码/算法/数学天才型', desc: '自学过编程，数学成绩顶尖，热爱钻研算法与深层逻辑 (首选纯计算机CS)' },
      { value: 'engineering', label: '🛠️ 喜欢工程落地、带薪实习与动手', desc: '兼顾物理/硬件，追求毕业即就业与企业实习 (首选软件工程SE/EECS)' },
      { value: 'balanced', label: '⚖️ 文理兼修，注重综合性价比', desc: '不想过早被超负荷工科物理绑死，希望课业压力适中且好就业' }
    ]
  },
  {
    step: 4,
    title: '第四步：是否有明确的目标留学国家/地区倾向？',
    subtitle: '不同国家的教育体制、录取标准、学费开销与移民政策各不相同',
    key: 'countryPref',
    options: [
      { value: 'any', label: '🌐 全球统筹 / 开放不设限', desc: '根据孩子实力、专业适配度、预算与未来发展由系统综合匹配最优国家' },
      { value: 'USA', label: '🇺🇸 美国为主', desc: '全球计算机学术与硅谷生态天花板，看重综合领导力与课外竞赛，预算较充裕' },
      { value: 'UK', label: '🇬🇧 英国为主', desc: '学术底蕴最纯正，3年学制紧凑，极度看重纯数学(Math AA)、MAT机考与面试' },
      { value: 'Canada', label: '🇨🇦 加拿大为主', desc: '带薪实习(Co-op)领跑北美，毕业即发3年开放工签免雇主担保，就业与永居极稳' },
      { value: 'SG', label: '🇸🇬 新加坡为主', desc: '亚洲计算机第1高地，治安极佳且文化亲近，有政府助学金减免与高PR获批率' },
      { value: 'EU', label: '🇩🇪 德国/欧洲为主', desc: '超高性价比低学费(年15-18万)，德式严谨工业4.0底蕴，蓝卡永居通道极快' }
    ]
  },
  {
    step: 5,
    title: '第五步：家庭每年的留学学费+生活费预算？',
    subtitle: '不同国家的本科教育开销差异巨大，必须提前规划家庭现金流',
    key: 'budget',
    options: [
      { value: 'economy', label: '💰 亲民工薪 (每年 15 - 25 万人民币)', desc: '免学费或极低学费（如德国公立/新加坡政府助学金签约项目）' },
      { value: 'medium', label: '💵 主流稳健 (每年 35 - 50 万人民币)', desc: '加拿大(含Co-op带薪实习补贴返还)、英国公立大学主流区间' },
      { value: 'abundant', label: '💎 充裕无压力 (每年 60 万人民币以上)', desc: '美国顶级私立名校(CMU等)或伦敦核心区顶尖学府' }
    ]
  },
  {
    step: 6,
    title: '第六步：本科毕业后是否有留在国外工作的规划？',
    subtitle: '不同国家的工签政策(OPT/PSW/PGWP)与绿卡永居难易度直接挂钩',
    key: 'stayPlan',
    options: [
      { value: 'must_stay', label: '🌍 必须留在当地工作/拿永居身份', desc: '优先选择移民通道极稳定、毕业直接给3年开放工签的国家 (首选加拿大/德国)' },
      { value: 'work_few_years', label: '💼 工作2-3年积累海外大厂经验再看', desc: '看重高薪回报与国际视野，对身份不强求 (首选美/英/新)' },
      { value: 'return', label: '🇨🇳 本科毕业即回国发展 / 纯看名校光环', desc: '重视国内知名度与综合排名 (首选牛剑、伯克利等世界名校)' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('wizard'); // 默认进入零基础向导
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);
  const [selectedGlossaryKey, setSelectedGlossaryKey] = useState('ib');
  const [detailModalProgram, setDetailModalProgram] = useState(null);

  // 科普与政策中心专属状态
  const [wikiSubTab, setWikiSubTab] = useState('ib_guide'); // 'ib_guide' | 'visa_guide'
  const [selectedVisaCountry, setSelectedVisaCountry] = useState('Canada');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  // 向导当前步数与表单结果
  const [wizardStep, setWizardStep] = useState(0); // 0-5 表示6道题，6表示诊断结果页
  const [wizardAnswers, setWizardAnswers] = useState({
    schoolLevel: 'middle',
    studentRank: 'top25',
    interestTrack: 'pure_cs',
    countryPref: 'any',
    budget: 'medium',
    stayPlan: 'must_stay'
  });

  // 用户志愿车（多选的大学与专业列表 ID 数组）
  const [selectedProgramIds, setSelectedProgramIds] = useState(['cmu_cs', 'oxford_cs', 'waterloo_se']);
  
  // 过滤与搜索状态
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterSearch, setFilterSearch] = useState('');

  // 切换选中状态
  const toggleProgramSelection = (id) => {
    if (selectedProgramIds.includes(id)) {
      if (selectedProgramIds.length === 1) {
        return; // 至少保留一个
      }
      setSelectedProgramIds(selectedProgramIds.filter(item => item !== id));
    } else {
      setSelectedProgramIds([...selectedProgramIds, id]);
    }
  };

  // 零基础向导推导引擎：根据问卷动态推算出推荐大学与IB基准分
  const diagnosticResult = useMemo(() => {
    // 1. 推算预估分基准
    let estimatedIBMin = 36;
    let estimatedIBMax = 40;

    if (wizardAnswers.studentRank === 'top5') {
      estimatedIBMin = wizardAnswers.schoolLevel === 'top' ? 42 : 41;
      estimatedIBMax = 44;
    } else if (wizardAnswers.studentRank === 'top25') {
      estimatedIBMin = wizardAnswers.schoolLevel === 'top' ? 39 : 38;
      estimatedIBMax = 42;
    } else {
      estimatedIBMin = 35;
      estimatedIBMax = 38;
    }

    // 2. 匹配推荐的大学及专业
    const matched = [];
    const reasoning = [];

    // 国家偏好优先级判断
    if (wizardAnswers.countryPref === 'Canada') {
      matched.push('waterloo_se', 'waterloo_cs');
      reasoning.push('【目标国家锁定：加拿大】滑铁卢大学是北美大厂实习就业天花板，且毕业无条件发3年开放工签(PGWP)，带薪实习 Co-op 可冲抵大量开销，移民通道确定性最高。');
    } else if (wizardAnswers.countryPref === 'USA') {
      matched.push('cmu_cs', 'ucb_eecs');
      reasoning.push('【目标国家锁定：美国】卡耐基梅隆(CMU)与加州伯克利(UC Berkeley)代表全球计算机与工程最高学术与产业声誉，硅谷科技大厂直推率全美第一梯队。');
    } else if (wizardAnswers.countryPref === 'UK') {
      matched.push('oxford_cs');
      reasoning.push('【目标国家锁定：英国】牛津大学计算机科学拥有世界顶级纯数与理论算法底蕴，不看繁复课外活动，只看极致的Math AA小分、MAT机考与高强度学术面试。');
    } else if (wizardAnswers.countryPref === 'SG') {
      matched.push('nus_cs');
      reasoning.push('【目标国家锁定：新加坡】新加坡国立大学(NUS)计算学院位居亚洲第1，享受政府助学金签约后年开销仅需约25-32万，毕业获EP且拿PR概率极高。');
    } else if (wizardAnswers.countryPref === 'EU') {
      matched.push('tum_informatics');
      reasoning.push('【目标国家锁定：德国/欧洲】慕尼黑工业大学(TUM)在欧陆工科首屈一指，年学费与生活费仅15-18万人民币，毕业21个月即可申领德国永居。');
    }

    // 若未限定国家（全球统筹），或补充辅助判断
    if (wizardAnswers.countryPref === 'any') {
      // 移民与工签诉求优先判定
      if (wizardAnswers.stayPlan === 'must_stay') {
        matched.push('waterloo_se', 'waterloo_cs', 'tum_informatics');
        reasoning.push('毕业留外永居诉求优先：加拿大（滑铁卢 Co-op 获3年开放工签）与德国（TUM毕业满21个月即可拿永居）是全球移民确定性最强梯队。');
      }

      // 预算筛选
      if (wizardAnswers.budget === 'economy') {
        if (!matched.includes('tum_informatics')) matched.push('tum_informatics');
        if (!matched.includes('nus_cs')) matched.push('nus_cs');
        reasoning.push('考虑年预算在25万内：极力推荐慕尼黑工大（低学费高质量）与新加坡国立大学（享受助学金减免后年开销仅约25万）。');
      } else if (wizardAnswers.budget === 'abundant' || wizardAnswers.studentRank === 'top5') {
        if (estimatedIBMax >= 42) {
          matched.push('oxford_cs', 'cmu_cs', 'ucb_eecs');
          reasoning.push('孩子成绩排在年级前列且预算充裕：具备冲刺世界顶级计算机神殿（CMU、牛津、伯克利EECS）的潜力。');
        }
      }
    } else {
      // 国家限定下的附加提醒
      if (wizardAnswers.countryPref === 'USA' && wizardAnswers.budget === 'economy') {
        reasoning.push('⚠️ 预算提醒：美国顶尖名校年开销通常需55-65万人民币以上，若家庭考虑控制成本，可注意大学奖助学金政策或考虑加德等高性价比方向作为双申后备。');
      }
    }

    // 确保至少有推荐
    if (matched.length === 0) {
      matched.push('waterloo_cs', 'tum_informatics');
    }

    // 去重保留前3-4个最优匹配
    const uniqueMatchedIds = Array.from(new Set(matched));
    const matchedPrograms = PROGRAM_DATABASE.filter(p => uniqueMatchedIds.includes(p.id));

    return {
      estimatedIBMin,
      estimatedIBMax,
      matchedProgramIds: uniqueMatchedIds,
      matchedPrograms,
      reasoning
    };
  }, [wizardAnswers]);

  // 获取当前已选中的项目详情对象数组
  const selectedPrograms = useMemo(() => {
    return PROGRAM_DATABASE.filter(p => selectedProgramIds.includes(p.id));
  }, [selectedProgramIds]);

  const harmonizedPlan = useMemo(() => {
    if (selectedPrograms.length === 0) return null;

    // 1. 最高预估分门槛
    let maxPredicted = 0;
    let strictestPredictedProgram = '';
    selectedPrograms.forEach(p => {
      if (p.admissionReqs.minPredicted > maxPredicted) {
        maxPredicted = p.admissionReqs.minPredicted;
        strictestPredictedProgram = `${p.uniName} (${p.admissionReqs.minPredicted}分)`;
      }
    });

    // 2. 统计各科目的最高要求 (HL or SL, minGrade)
    const subjectMap = {
      MATH_AA: { level: 'SL', minGrade: 0, requestedBy: [], name: 'Mathematics AA' },
      PHYSICS: { level: 'NONE', minGrade: 0, requestedBy: [], name: 'Physics' },
      CHEMISTRY: { level: 'NONE', minGrade: 0, requestedBy: [], name: 'Chemistry' },
      CS: { level: 'NONE', minGrade: 0, requestedBy: [], name: 'Computer Science' }
    };

    selectedPrograms.forEach(p => {
      // 遍历必修科目
      p.admissionReqs.mandatoryCourses.forEach(req => {
        const item = subjectMap[req.code];
        if (item) {
          if (req.level === 'HL') item.level = 'HL';
          else if (item.level !== 'HL' && req.level === 'SL') item.level = 'SL';
          item.minGrade = Math.max(item.minGrade, req.minGrade);
          item.requestedBy.push(`${p.uniName} [硬性必修: ${req.level} ${req.minGrade}分]`);
        }
      });
      // 遍历偏好科目
      p.admissionReqs.preferredCourses.forEach(req => {
        const item = subjectMap[req.code];
        if (item) {
          if (item.level === 'NONE') item.level = req.level;
          item.minGrade = Math.max(item.minGrade, req.minGrade);
          item.requestedBy.push(`${p.uniName} [强烈推荐: ${req.level} ${req.minGrade}分]`);
        }
      });
    });

    // 3. 冲突与矛盾诊断逻辑 (Conflict Detection)
    const conflicts = [];
    const warnings = [];

    // 冲突 A: 检查总 HL 门槛是否超负荷 (超过3门 HL)
    const hlSubjects = Object.keys(subjectMap).filter(k => subjectMap[k].level === 'HL');
    if (hlSubjects.length > 3) {
      conflicts.push({
        type: 'HL_OVERLOAD',
        severity: 'CRITICAL',
        title: '高难度科目 (HL) 超额冲突：超出标准 3 门上限',
        description: `您选中的专业组合共同强制要求了 ${hlSubjects.length} 门学科选修 HL（${hlSubjects.map(k => subjectMap[k].name).join('、')}）。IB 标准体系通常只允许修读 3 门 HL。修读 4 门 HL 课业负荷极大，极易导致期末均分崩盘。`,
        solution: '建议优化策略：例如将 Physics 降为 SL（若所选大学接受），或放弃部分对双理科均硬性要求 HL 的极限重叠工程学院，将精力集中保 3 门 HL 拿到 7 分。'
      });
    }

    // 冲突 B: 滑铁卢工程 (SE) 对化学的强制要求 vs 纯CS项目的科目争夺
    const hasWaterlooSE = selectedPrograms.some(p => p.id === 'waterloo_se');
    const hasOxfordCS = selectedPrograms.some(p => p.id === 'oxford_cs');
    const hasTUM = selectedPrograms.some(p => p.id === 'tum_informatics');

    if (hasWaterlooSE) {
      warnings.push({
        type: 'SCIENCE_PREREQ',
        title: '滑铁卢软件工程(SE) 特殊必修要求：必须选修化学 (Chemistry)',
        description: '滑铁卢大学属于工程院(BSE)，硬性要求高中成绩必须包含物理与化学。而牛津/CMU等纯CS不强制化学。',
        solution: '调和方案：建议化学选择【Chemistry SL】，以满足滑铁卢工程院的硬性前置，同时腾出精力冲击 Math AA HL 与 Physics HL 拿到 7 分。'
      });
    }

    // 冲突 C: 附加笔试与大考时间精力冲突
    if (hasOxfordCS && (hasWaterlooSE || selectedPrograms.some(p => p.id === 'cmu_cs'))) {
      warnings.push({
        type: 'EXAM_PREPARATION_SPLIT',
        title: '英美申请逻辑与考核模式精力冲突 (牛津 MAT vs 美加竞赛科研)',
        description: '牛津大学需要高三上学期 (10-11月) 备战高难度的 MAT 纯数学机考与高密度学术面试；而北美名校 (CMU/伯克利) 则看重课外工程作品、黑客松及多轮申请文书。',
        solution: '调和方案：G11 阶段必须以 USACO 与 Euclid 竞赛作为共同抓手；高三开学前务必完成文书初稿，以在 10 月将全部火力留给牛津 MAT 题库。'
      });
    }

    // 冲突 D: 德国 KMK 教育部特殊学制认证要求
    if (hasTUM) {
      warnings.push({
        type: 'GERMAN_KMK_RULE',
        title: '德国 TUM 特殊认证规则：严禁使用 Math AI 且必须有母语 Language A',
        description: '德国教育部规定 IB 文凭必须具备 Math AA HL，且必须包含一门自然科学 (Physics 或 Chemistry HL)，否则无法换取德国大学入学资格 (HZB)。',
        solution: '调和方案：坚定选择 Math AA HL，并搭配一门理科 HL，切勿因侥幸心理降低数学难度。'
      });
    }

    return {
      maxPredicted,
      strictestPredictedProgram,
      subjectMap,
      hlCount: hlSubjects.length,
      conflicts,
      warnings
    };
  }, [selectedPrograms]);

  // 打开名词解释
  const openGlossary = (key) => {
    setSelectedGlossaryKey(key);
    setShowGlossaryModal(true);
  };

  // 过滤后的专业列表
  const filteredPrograms = useMemo(() => {
    return PROGRAM_DATABASE.filter(p => {
      if (filterCountry !== 'ALL' && p.country !== filterCountry) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        return p.uniName.toLowerCase().includes(q) || 
               p.programName.toLowerCase().includes(q) || 
               p.countryName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterCountry, filterSearch]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center selection:bg-indigo-500 selection:text-white font-sans">
      {/* 手机仿真外壳容器 */}
      <div className="w-full max-w-md bg-slate-950 flex flex-col min-h-screen shadow-2xl relative border-x border-slate-800">
        
        {/* 顶部通栏 */}
        <header className="px-4 pt-4 pb-3 bg-gradient-to-b from-indigo-950/80 to-slate-950/40 backdrop-blur-md sticky top-0 z-30 border-b border-indigo-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  智径升学 <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">零基础向导版</span>
                </h1>
                <p className="text-[11px] text-slate-400">白话提问诊断 · 多目标倒推IB排课</p>
              </div>
            </div>

            {/* 留学黑话小词典快捷按钮 */}
            <button 
              onClick={() => openGlossary('math_stream')}
              className="px-2 py-1 rounded-lg bg-indigo-950 border border-indigo-800/80 text-[11px] text-indigo-300 flex items-center gap-1 hover:bg-indigo-900 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>避坑词典</span>
            </button>
          </div>

          {/* 顶部快捷多选进度栏 */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
              <span>已选志愿：</span>
              <span className="font-bold text-white px-1.5 py-0.2 rounded bg-indigo-600/60 text-[11px]">
                {selectedPrograms.length} 所专业
              </span>
            </div>

            <button
              onClick={() => setActiveTab('harmonizer')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/50"
            >
              <span>查看多选IB排课倒推</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* 主体滚动内容区 */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
          
          {/* TAB 0: 零基础向导式诊断流程 (Wizard) */}
          {activeTab === 'wizard' && (
            <div className="space-y-4 animate-fadeIn">
              {wizardStep < WIZARD_QUESTIONS.length ? (
                /* 答题阶段 */
                <div className="space-y-4">
                  {/* 进度指示条 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> 零基础智能问答向导
                      </span>
                      <span>第 {wizardStep + 1} / {WIZARD_QUESTIONS.length} 步</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${((wizardStep + 1) / WIZARD_QUESTIONS.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 问题卡片 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/50 to-slate-900 border border-indigo-900/50 space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-white leading-snug">
                        {WIZARD_QUESTIONS[wizardStep].title}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {WIZARD_QUESTIONS[wizardStep].subtitle}
                      </p>
                    </div>

                    {/* 选项列表 */}
                    <div className="space-y-2 pt-1">
                      {WIZARD_QUESTIONS[wizardStep].options.map(opt => {
                        const currentKey = WIZARD_QUESTIONS[wizardStep].key;
                        const isSelected = wizardAnswers[currentKey] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setWizardAnswers({
                                ...wizardAnswers,
                                [currentKey]: opt.value
                              });
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                              isSelected
                                ? 'bg-indigo-600/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold">{opt.label}</div>
                              <div className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 上一步/下一步控制 */}
                  <div className="flex items-center justify-between pt-1">
                    {wizardStep > 0 ? (
                      <button
                        onClick={() => setWizardStep(wizardStep - 1)}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 hover:bg-slate-800"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> 上一步
                      </button>
                    ) : (
                      <div></div>
                    )}

                    <button
                      onClick={() => setWizardStep(wizardStep + 1)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-indigo-500/20 hover:opacity-95"
                    >
                      {wizardStep === WIZARD_QUESTIONS.length - 1 ? '完成诊断生成战略' : '下一步'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* 诊断结果生成页 */
                <div className="space-y-4 animate-fadeIn">
                  {/* 核心结论大卡片 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950/70 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-300" /> 零基础专属诊断报告
                      </span>
                      <button
                        onClick={() => setWizardStep(0)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" /> 重新答题
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-white">
                        推荐瞄准预估分区间：<span className="text-cyan-300">{diagnosticResult.estimatedIBMin} - {diagnosticResult.estimatedIBMax} 分</span>
                      </h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        结合您孩子所在的【{wizardAnswers.schoolLevel === 'top' ? '高均分名校' : wizardAnswers.schoolLevel === 'middle' ? '主流稳健学校' : '新办/普通高中'}】以及【{wizardAnswers.studentRank === 'top5' ? '年级前5-10%' : wizardAnswers.studentRank === 'top25' ? '年级前15-25%' : '年级中游'}】推算，高二预估分冲刺此区间成功率最高。
                      </p>
                    </div>

                    {/* 诊断理由阐述 */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="font-semibold text-indigo-300 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> 系统战略推荐依据：
                      </div>
                      {diagnosticResult.reasoning.map((r, i) => (
                        <p key={i} className="text-[11px] text-slate-300 leading-relaxed">
                          • {r}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* 推荐给您的专属大学与专业方案 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-400" />
                        系统为您智能匹配的大学专业方案
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedProgramIds(diagnosticResult.matchedProgramIds);
                          setActiveTab('harmonizer');
                        }}
                        className="text-[11px] text-cyan-400 hover:underline font-bold"
                      >
                        一键载入并排课 &gt;
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {diagnosticResult.matchedPrograms.map(prog => (
                        <div 
                          key={prog.id}
                          className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{prog.uniName}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded text-slate-300">
                                  {prog.countryName}
                                </span>
                              </div>
                              <div className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                                {prog.programName}
                              </div>
                            </div>

                            <button
                              onClick={() => toggleProgramSelection(prog.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                                selectedProgramIds.includes(prog.id)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                              }`}
                            >
                              {selectedProgramIds.includes(prog.id) ? (
                                <>
                                  <Check className="w-3 h-3" /> 已在志愿车
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" /> 加入志愿
                                </>
                              )}
                            </button>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-950 text-[11px] text-slate-300 space-y-1">
                            <div><strong>门槛要求：</strong><span className="text-emerald-400">{prog.admissionReqs.predictedText}</span></div>
                            <div><strong>必修科目：</strong>{prog.admissionReqs.mandatoryCourses.map(c => c.label).join('、')}</div>
                            <div><strong>毕业前景：</strong>{prog.visaWork} | 年开销 {prog.totalAnnualRmb.split(' (')[0]}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 快捷跳转按钮 */}
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProgramIds(diagnosticResult.matchedProgramIds);
                          setActiveTab('harmonizer');
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 hover:opacity-95"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>查看所选专业的 IB 排课与冲突分析</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('programs')}
                        className="px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-800"
                      >
                        逛全部大学
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: 大学与专业库多选 (Programs Database & Selection) */}
          {activeTab === 'programs' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* 搜索与国家筛选条 */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text"
                    placeholder="搜索大学、专业或城市 (如: 牛津, 滑铁卢SE, 慕尼黑)..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {[
                    { id: 'ALL', name: '全部国家' },
                    { id: 'USA', name: '🇺🇸 美国' },
                    { id: 'UK', name: '🇬🇧 英国' },
                    { id: 'Canada', name: '🇨🇦 加拿大' },
                    { id: 'SG', name: '🇸🇬 新加坡' },
                    { id: 'EU', name: '🇩🇪 德国/欧洲' }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setFilterCountry(c.id)}
                      className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition font-medium ${
                        filterCountry === c.id 
                          ? 'bg-indigo-600 border-indigo-400 text-white' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 多选使用说明引导 */}
              <div className="p-3 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-300 leading-snug">
                  可<strong>同时勾选多所</strong>目标大学与专业（如同时选择牛津CS + 滑铁卢SE）。系统将自动合并算出一套能<strong>同时兼顾所有目标的最优IB选课方案</strong>，并自动检测是否有课程冲突！
                </div>
              </div>

              {/* 专业项目列表流 */}
              <div className="space-y-3">
                {filteredPrograms.map(program => {
                  const isChecked = selectedProgramIds.includes(program.id);
                  return (
                    <div 
                      key={program.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isChecked 
                          ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* 顶部标题与多选勾选框 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-white">{program.uniName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-medium">
                              {program.countryName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                              {program.badge}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-semibold mt-1">
                            {program.programName}
                          </div>
                        </div>

                        {/* 多选按钮 */}
                        <button
                          onClick={() => toggleProgramSelection(program.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                            isChecked 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-800 border border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          {isChecked ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* 明确的入学条件要点 */}
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">IB录取门槛要求:</span>
                          <span className="text-emerald-400 font-bold text-[11px]">{program.admissionReqs.predictedText}</span>
                        </div>
                        <div className="text-slate-300 text-[11px] leading-relaxed">
                          <strong className="text-indigo-300">必修科目：</strong>
                          {program.admissionReqs.mandatoryCourses.map((c, i) => (
                            <span key={i} className="inline-block mr-1 text-slate-200">
                              • {c.label}
                            </span>
                          ))}
                        </div>
                        {program.admissionReqs.extraExams.length > 0 && (
                          <div className="text-[10px] text-amber-300 pt-0.5">
                            📌 附加考试/竞赛：{program.admissionReqs.extraExams[0]}
                          </div>
                        )}
                      </div>

                      {/* 底部指标与展开详情按钮 */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>总开销: {program.totalAnnualRmb.split(' (')[0]}</span>
                          <span>•</span>
                          <span>工签: {program.country === 'USA' ? '3年OPT' : program.country === 'Canada' ? '3年免担保' : '2年PSW/蓝卡'}</span>
                        </div>

                        <button 
                          onClick={() => setDetailModalProgram(program)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-medium"
                        >
                          <span>查看完整报告</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 底部悬浮快捷栏：跳转至多选调和结果 */}
              <div className="sticky bottom-16 bg-slate-900/95 backdrop-blur-md border border-indigo-700/60 p-3 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>已选组合：{selectedPrograms.length} 个专业</span>
                    {harmonizedPlan && harmonizedPlan.conflicts.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-red-950 text-red-300 border border-red-800 rounded text-[10px]">
                        存在冲突!
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    倒推IB总分目标：{harmonizedPlan?.maxPredicted}分+
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('harmonizer')}
                  className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-lg shadow-indigo-500/20"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>生成多目标调和方案</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: 多目标IB选课倒推与冲突检测引擎 (Harmonizer & Conflict Engine) */}
          {activeTab === 'harmonizer' && harmonizedPlan && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* 顶部目标总览卡片 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/40 border border-indigo-600/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                    <Target className="w-4 h-4 text-cyan-400" />
                    已多选 {selectedPrograms.length} 个大学专业志愿倒推
                  </span>
                  <button 
                    onClick={() => setActiveTab('programs')}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    增减志愿
                  </button>
                </div>

                {/* 选中的标签列表 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedPrograms.map(p => (
                    <span 
                      key={p.id}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      <span>{p.uniName} - {p.programName.split(' (')[0]}</span>
                      <button 
                        onClick={() => toggleProgramSelection(p.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* 统一基准分建议 */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs mt-2">
                  <div className="text-slate-400">
                    统筹兼顾各校的最高预估分门槛：
                  </div>
                  <div className="text-emerald-400 font-bold">
                    必须达到 {harmonizedPlan.maxPredicted} 分+
                  </div>
                </div>
              </div>

              {/* 核心冲突与无法兼顾告警区域 (CONFLICT & WARNINGS DETECTOR) */}
              {harmonizedPlan.conflicts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
                    <span>检测到严重选课超载 / 规则冲突（无法直接兼顾）</span>
                  </div>

                  {harmonizedPlan.conflicts.map((conf, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-red-950/30 border border-red-800/80 space-y-2 text-xs">
                      <div className="font-bold text-red-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{conf.title}</span>
                      </div>
                      <p className="text-red-200 text-[11px] leading-relaxed">
                        {conf.description}
                      </p>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-red-900/60 text-slate-200 text-[11px] leading-relaxed">
                        <strong className="text-emerald-400">💡 系统调和解决方案：</strong>{conf.solution}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 细部避坑与要求差异提醒 (WARNINGS) */}
              {harmonizedPlan.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>特定院校的前置必修与考核差异说明</span>
                  </div>

                  {harmonizedPlan.warnings.map((warn, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-1.5 text-xs">
                      <div className="font-semibold text-amber-300 text-[11px]">
                        {warn.title}
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {warn.description}
                      </p>
                      <div className="text-[11px] text-cyan-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                        <strong>建议应对策略：</strong>{warn.solution}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 统筹倒推的 6 门 IB 最佳组合 (HARMONIZED 6-SUBJECT MATRIX) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    统筹各校后的 6 门 IB 选课推荐方案
                  </h3>
                  <span className="text-[10px] text-slate-400">并集最优取向</span>
                </div>

                {/* 必修与统筹建议展示 */}
                <div className="space-y-2">
                  {/* 数学 (绝对无争议) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-indigo-900/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">1. Mathematics: Analysis & Approaches (AA)</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold text-[11px]">
                        建议: HL 7分满分
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      已选的所有计算机/工程专业一致严格要求 Math AA HL（严禁 Math AI）。这是任何一所大学都不接受妥协的底线科目。
                    </p>
                  </div>

                  {/* 物理 (理科核心) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">2. Physics (物理)</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[11px]">
                        建议: HL 6-7分
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      CMU、伯克利EECS、滑铁卢与新加坡国立共同高度认可的科目，同时为英国牛剑 MAT/面试提供坚实的物理建模逻辑。
                    </p>
                  </div>

                  {/* 计算机科学 or 化学 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">3. Computer Science 或 第三门 HL</span>
                      <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold text-[11px]">
                        建议: HL 6-7分
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      若学生代码基础好，选 CS HL；若报考滑铁卢SE或德国，可将第三门HL给自然科学，或者选 CS HL + Chemistry SL 达成双赢。
                    </p>
                  </div>

                  {/* SL 组合配置 */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <span className="font-semibold text-slate-300 text-[11px]">4-6 门 SL 课程（负责拉高总GPA与平衡文理）：</span>
                    <ul className="text-[11px] text-slate-400 space-y-0.5">
                      <li>• <strong>Chemistry SL</strong> (按需满足滑铁卢工程院等前置条件，保6争7)</li>
                      <li>• <strong>English A / B SL</strong> (满足语言要求，目标6分)</li>
                      <li>• <strong>Economics SL</strong> (相对易拿高分，经济社科视野，目标6-7分)</li>
                    </ul>
                  </div>

                  {/* TOK + EE */}
                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 text-[11px] font-medium">核心任务 TOK + EE (拓展论文)：</span>
                    <span className="font-bold text-white bg-emerald-800/60 px-2 py-0.5 rounded text-[11px]">+3 满分目标</span>
                  </div>
                </div>
              </div>

              {/* 保姆级单科提分动作指南展开 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  所选核心科目的保姆级提分 SOP
                </h3>

                {['MATH_AA', 'PHYSICS', 'CHEMISTRY', 'CS'].map((code) => {
                  const guide = COURSE_DETAILED_GUIDES[code];
                  return (
                    <div key={code} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-indigo-300">{guide.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                          目标: {guide.targetScore} 分
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-slate-300">学科定位：</strong>{guide.role}
                      </p>
                      <div className="p-2 bg-red-950/20 border border-red-900/30 rounded-lg text-[11px] text-red-200">
                        ⚠️ <strong>避坑要点：</strong>{guide.pitfall}
                      </div>
                      <div className="space-y-1 pt-1">
                        {guide.roadmap.map((r, i) => (
                          <div key={i} className="p-1.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 flex items-start gap-1.5">
                            <span className="font-bold text-indigo-400 shrink-0">{r.grade}:</span>
                            <span>{r.step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: 竞赛与CAS智能推导 (Extracurricular & Competitions) */}
          {activeTab === 'extra' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">基于所选大学梯队的竞赛进阶推导</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  系统已整合您选中的【{selectedPrograms.map(p => p.uniName).join('、')}】招生偏好，推荐以下兼顾率最高的竞赛组合：
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-indigo-900/50 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-400">1. USACO 计算机奥赛 (美/加/英通用通货)</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded">G10-G11</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      目标升入 Gold(黄金) 或 Platinum(白金组)。对于 CMU SCS、牛津以及滑铁卢均有降维打击式的算法能力证明效果。
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/50 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-cyan-400">2. Euclid 欧几里得数学竞赛 + CCC (滑铁卢主办)</span>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded">每年4月</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      若申请滑铁卢大学（无论SE还是CS），85分以上证书是入围最高奖学金与录取的最大权重加分项；英国院校同样高度认可。
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/50 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-400">3. 女性STEM专项竞赛 / Technovation 全球挑战赛</span>
                      <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded">女生差异化优势</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      针对女生申请计算机工程，主导移动App开发并解决当地社区实际问题，是牛津与美本录取文书中最具说服力的“科技领导力”线索。
                    </p>
                  </div>
                </div>
              </div>

              {/* CAS 设计 */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <h3 className="text-sm font-bold text-white">CAS 项目设计（直接转化为文书素材）</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border-l-4 border-l-indigo-500 border border-slate-800">
                    <span className="font-bold text-indigo-300">Creativity (创新): 搭建校内AI或开源助手</span>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      例如为国际学校开发“社团活动场地预约排课系统”，证明代码落地能力与用户思维。
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border-l-4 border-l-emerald-500 border border-slate-800">
                    <span className="font-bold text-emerald-300">Service (服务): 面向初中/小学的编程义教工坊</span>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      发起“Girls in Code”公益编程项目，帮助初中低年级女生掌握 Scratch/Python，展现科技同理心。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 四年时间规划器 (Timeline) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">G9 - G12 全周期关键节点 (按所选组合排期)</h3>
                </div>

                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-white">G9 - G10 基础积累期</span>
                      <ul className="mt-1 space-y-1 text-slate-300 text-[11px]">
                        <li>• 攻克托福 (105+) 或雅思 (7.5+) 语言底座</li>
                        <li>• 提前自学微积分基础，熟练使用 TI-Nspire 图形计算器</li>
                        <li>• USACO 开启铜组/银组题库日常刷题练习</li>
                      </ul>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-amber-300">G11 (IB DP1) 预估分生死战</span>
                      <ul className="mt-1 space-y-1 text-slate-300 text-[11px]">
                        <li>• 确保平时各次考试稳在 6-7 分，锚定 42+ 预估分基准</li>
                        <li>• 参加 4 月 Euclid 竞赛并力拼 Distinction 奖项</li>
                        <li>• 完成 SAT 首考 (冲刺 1530+)；确定 CS/Math IA 选题初稿</li>
                      </ul>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-emerald-400">G12 (IB DP2) 递交与考试冲刺</span>
                      <ul className="mt-1 space-y-1 text-slate-300 text-[11px]">
                        <li>• 9-10月：牛津 CS / 美本 ED 申请递交</li>
                        <li>• 10-11月：参加牛津 MAT 附加机考及模拟学术面试</li>
                        <li>• 12月-次年1月：滑铁卢 AIF 文书递交与常规申请 (RD)</li>
                        <li>• 次年5月：IB全球大考稳定发挥接盘 Offer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IB 深度科普与主流国家工签永居政策中心 (Wiki & Policies) */}
          {activeTab === 'wiki' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* 二级功能顶部分段切换器 */}
              <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-2 gap-1">
                <button
                  onClick={() => setWikiSubTab('ib_guide')}
                  className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    wikiSubTab === 'ib_guide'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-cyan-300" />
                  <span>IB 课程体系大揭秘</span>
                </button>
                <button
                  onClick={() => setWikiSubTab('visa_guide')}
                  className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    wikiSubTab === 'visa_guide'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 text-amber-300" />
                  <span>各国工签与永居政策</span>
                </button>
              </div>

              {/* 子板块 A: IB 课程深度科普 (IB DP Full Guide) */}
              {wikiSubTab === 'ib_guide' && (
                <div className="space-y-3.5">
                  {/* 45分架构解剖 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-700/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        {IB_ENCYCLOPEDIA.scoreStructure.title}
                      </h3>
                      <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800">
                        满分45分 = 42 + 3
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {IB_ENCYCLOPEDIA.scoreStructure.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      {IB_ENCYCLOPEDIA.scoreStructure.tiers.map((t, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs gap-2">
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-[11px]">{t.range}</span>
                              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                                {t.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">{t.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 核心三要素 TOK / EE / CAS */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        核心三大支柱 (Core: TOK + EE + CAS)
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      除 6 门学科外，所有学生必须通过这 3 门必修核心考核，也是世界名校考察学生批判性思维的基石。
                    </p>

                    <div className="space-y-2">
                      {IB_ENCYCLOPEDIA.coreElements.map(core => (
                        <div key={core.code} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-300">{core.code} - {core.name}</span>
                            <span className="text-[10px] text-amber-300 font-semibold">{core.highlight}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {core.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 6 大选课组图谱 */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-white">IB 六大选课学科组图谱</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {IB_ENCYCLOPEDIA.sixGroups.map((g, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                          <strong className="text-purple-300 block mb-0.5">{g.group}</strong>
                          <span className="text-slate-400 leading-snug">{g.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IA 与全球统考对比 */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white">平时评估 (IA) 与全球大考 (EA) 构成</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {IB_ENCYCLOPEDIA.assessments.map((a, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="font-bold text-emerald-300 text-[11px]">{a.title}</div>
                            <div className="text-[10px] text-amber-300 font-semibold mt-0.5">{a.ratio}</div>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{a.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 家长高频问答与避坑指南 (Accordion) */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-white">零基础家长高频避坑 Q&A</h3>
                    </div>

                    <div className="space-y-1.5">
                      {IB_ENCYCLOPEDIA.faqs.map((faq, i) => (
                        <div key={i} className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                          <button
                            onClick={() => setExpandedFaqIndex(expandedFaqIndex === i ? null : i)}
                            className="w-full p-2.5 text-left text-xs font-bold text-slate-200 flex items-center justify-between hover:text-white"
                          >
                            <span>{faq.q}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              expandedFaqIndex === i ? 'rotate-180 text-cyan-400' : ''
                            }`} />
                          </button>
                          {expandedFaqIndex === i && (
                            <div className="px-2.5 pb-2.5 text-[11px] text-slate-300 leading-relaxed border-t border-slate-850 pt-1.5">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 子板块 B: 主流国家工签与永居身份政策库 (Global Work Visas & PR Hub) */}
              {wikiSubTab === 'visa_guide' && (
                <div className="space-y-3.5">
                  {/* 国家快捷筛选横向滑块 */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                    {Object.keys(VISA_IMMIGRATION_POLICIES).map(cKey => {
                      const item = VISA_IMMIGRATION_POLICIES[cKey];
                      return (
                        <button
                          key={cKey}
                          onClick={() => setSelectedVisaCountry(cKey)}
                          className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition font-bold text-[11px] flex items-center gap-1.5 ${
                            selectedVisaCountry === cKey
                              ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span>{item.flag}</span>
                          <span>{item.countryName.split(' (')[0]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 选中国家的完整政策解读卡片 */}
                  {(() => {
                    const countryData = VISA_IMMIGRATION_POLICIES[selectedVisaCountry];
                    return (
                      <div className="space-y-3 animate-fadeIn">
                        {/* 概览大卡片 */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 border border-cyan-700/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{countryData.flag}</span>
                              <h3 className="text-sm font-bold text-white">{countryData.countryName}</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px]">
                              {countryData.visaBadge}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                            <span className="text-slate-400">永居身份(绿卡)确定性：</span>
                            <span className="font-bold text-emerald-400">{countryData.prStability}</span>
                          </div>
                        </div>

                        {/* 毕业工签详解 (Post-Study Work Visa) */}
                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                            <Briefcase className="w-4 h-4 text-cyan-400" />
                            <span>1. 毕业工签机制：{countryData.postStudyVisa.name}</span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-[11px] text-slate-300">
                            <div><strong>有效时长：</strong><span className="text-emerald-400 font-semibold">{countryData.postStudyVisa.duration}</span></div>
                            <div><strong>雇主绑定要求：</strong>{countryData.postStudyVisa.employerBond}</div>
                            <div className="text-slate-400 pt-0.5 leading-relaxed">
                              💡 <strong>核心规则：</strong>{countryData.postStudyVisa.notes}
                            </div>
                          </div>
                        </div>

                        {/* 永居与技术移民路径 (PR Pathway) */}
                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                            <BadgeCheck className="w-4 h-4 text-emerald-400" />
                            <span>2. 永居身份/绿卡通道：{countryData.prPathway.name}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                            <div>
                              <strong className="text-slate-200">预估拿永居时间线：</strong>
                              <span className="text-cyan-300">{countryData.prPathway.timeframe}</span>
                            </div>

                            <div className="space-y-1 pt-1">
                              <span className="font-semibold text-slate-400 block">核心申请条件清单：</span>
                              {countryData.prPathway.requirements.map((req, rIdx) => (
                                <div key={rIdx} className="pl-2 border-l-2 border-indigo-500 text-slate-300 leading-relaxed">
                                  • {req}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 计算机工程留学生专属避坑与策略 (Tech Advice) */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-800/50 space-y-1.5 text-xs">
                          <div className="font-bold text-amber-300 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span>给理工科/计算机留学生的战略建议：</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {countryData.techAdvice}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

        </main>

        {/* 底部导航栏 */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-1 py-1.5 z-40">
          <div className="grid grid-cols-6 gap-0.5">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeTab === 'wizard' 
                  ? 'text-cyan-400 bg-cyan-500/10 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px]">智能向导</span>
            </button>

            <button
              onClick={() => setActiveTab('programs')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeTab === 'programs' 
                  ? 'text-cyan-400 bg-cyan-500/10 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px]">大学专业</span>
            </button>

            <button
              onClick={() => setActiveTab('harmonizer')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition relative ${
                activeTab === 'harmonizer' 
                  ? 'text-indigo-400 bg-indigo-500/10 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {harmonizedPlan && harmonizedPlan.conflicts.length > 0 && (
                <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-red-500"></span>
              )}
              <SlidersHorizontal className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px]">调和排课</span>
            </button>

            <button
              onClick={() => setActiveTab('wiki')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeTab === 'wiki' 
                  ? 'text-cyan-300 bg-cyan-500/15 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
              <span className="text-[9px]">科普与签证</span>
            </button>

            <button
              onClick={() => setActiveTab('extra')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeTab === 'extra' 
                  ? 'text-indigo-400 bg-indigo-500/10 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px]">竞赛/CAS</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeTab === 'timeline' 
                  ? 'text-indigo-400 bg-indigo-500/10 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px]">时间规划</span>
            </button>
          </div>
        </nav>

        {/* 院校专业深度详情弹窗 */}
        {detailModalProgram && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 space-y-3.5 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">{detailModalProgram.uniName}</h3>
                  <div className="text-xs text-indigo-400 font-semibold">{detailModalProgram.programName}</div>
                </div>
                <button 
                  onClick={() => setDetailModalProgram(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 明确的入学条件 */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>官方硬性录取门槛与要求：</span>
                </div>
                <p className="text-slate-300">
                  • 预估分指标：<strong className="text-emerald-400">{detailModalProgram.admissionReqs.predictedText}</strong>
                </p>
                <div className="space-y-1">
                  <div className="text-slate-400">强制必修科目：</div>
                  {detailModalProgram.admissionReqs.mandatoryCourses.map((c, i) => (
                    <div key={i} className="pl-2 text-slate-200 font-medium">
                      ✓ {c.label}
                    </div>
                  ))}
                </div>
                {detailModalProgram.admissionReqs.forbiddenCourses.length > 0 && (
                  <div className="text-red-300 text-[11px] bg-red-950/30 p-2 rounded-lg border border-red-900/40">
                    ❌ 严禁/不接受科目：{detailModalProgram.admissionReqs.forbiddenCourses.join('，')}
                  </div>
                )}
                {detailModalProgram.admissionReqs.extraExams.length > 0 && (
                  <div className="text-amber-300 text-[11px]">
                    📝 附加考核：{detailModalProgram.admissionReqs.extraExams.join('；')}
                  </div>
                )}
              </div>

              {/* 学费与生活费 */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="font-bold text-slate-200 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> 费用开销与带薪政策:
                </div>
                <div>学费：{detailModalProgram.tuitionYear}</div>
                <div>生活费：{detailModalProgram.livingCostYear}</div>
                <div className="text-emerald-400 font-semibold">折合年总开销：{detailModalProgram.totalAnnualRmb}</div>
              </div>

              {/* 就业与签证 */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="font-bold text-slate-200 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> 就业市场与签证永居路径:
                </div>
                <p><span className="text-slate-400">就业行情：</span>{detailModalProgram.jobMarket}</p>
                <p><span className="text-cyan-400">毕业工签：</span>{detailModalProgram.visaWork}</p>
                <p><span className="text-emerald-400">永居身份：</span>{detailModalProgram.prPath}</p>
              </div>

              {/* 操作按钮 */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    toggleProgramSelection(detailModalProgram.id);
                    setDetailModalProgram(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    selectedProgramIds.includes(detailModalProgram.id)
                      ? 'bg-red-900/40 border border-red-700 text-red-300 hover:bg-red-900/60'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {selectedProgramIds.includes(detailModalProgram.id) ? '从已选组合中移除' : '加入多选调和车'}
                </button>
                <button
                  onClick={() => setDetailModalProgram(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 留学黑话翻译弹窗 */}
        {showGlossaryModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold text-white">留学与IB“避坑”字典</span>
                </div>
                <button 
                  onClick={() => setShowGlossaryModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
                >
                  关闭
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: 'ib', label: 'IB总览' },
                  { key: 'hl_sl', label: 'HL与SL' },
                  { key: 'math_stream', label: 'Math AA/AI' },
                  { key: 'predicted', label: '预估分' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedGlossaryKey(item.key)}
                    className={`py-1.5 text-[11px] rounded-lg font-medium border text-center transition ${
                      selectedGlossaryKey === item.key 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-indigo-300">
                  {NOVICE_GLOSSARY[selectedGlossaryKey].title}
                </h4>
                <div className="p-2 rounded-xl bg-indigo-950/30 border border-indigo-800/30 text-xs text-slate-200 font-medium leading-relaxed">
                  💡 <strong>一句话人话：</strong>{NOVICE_GLOSSARY[selectedGlossaryKey].summary}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {NOVICE_GLOSSARY[selectedGlossaryKey].detail}
                </p>
              </div>

              <button
                onClick={() => setShowGlossaryModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
              >
                我明白了
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}