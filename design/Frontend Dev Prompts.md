在 VS Code 中通过 Copilot Chat，按照以下 6 个步骤依次执行代码生成：

### 阶段 1：网络请求与基础上下文搭建
> **Prompt to Copilot:**
> "参考 `FRONTEND_DEV_SPEC.md`，帮我编写 `src/api/client.js`，基于 Axios 创建实例，配置基地址为 `http://127.0.0.1:8000/api/v1`，增加请求超时与响应拦截器。同时在 `src/api/` 下创建 `dictionary.js`, `diagnose.js`, `harmonizer.js`，分别封装获取专业列表、提交向导诊断、以及多志愿排课倒推的异步请求函数。"

### 阶段 2：全局状态上下文编写
> **Prompt to Copilot:**
> "基于 `FRONTEND_DEV_SPEC.md` 的状态设计，编写 `src/context/PlanContext.jsx`。实现 `selectedProgramIds` 志愿车管理、向导状态 `wizardAnswers`、活动 Tab 控制，并导出 `usePlan` 自定义 Hook。在 `src/main.jsx` 中用 `PlanProvider` 和 React Query 的 `QueryClientProvider` 包裹根节点。"

### 阶段 3：通用布局与导航组件开发
> **Prompt to Copilot:**
> "参考原型（src/prototype_reference.tsx），编写 `src/components/common/Header.jsx`、`BottomNav.jsx` 和 `GlossaryModal.jsx`。
> - `Header` 包含品牌标题、已选志愿计数徽标和‘避坑词典’按钮；
> - `BottomNav` 包含 6 个 Tab 的底部导航，切换时联动全局 `activeTab`，并在存在冲突时展示红点提示；
> - `GlossaryModal` 支持查看 IB、HL/SL、Math AA/AI、预估分等专业名词白话解释。"

### 阶段 4：专业库与志愿车视图开发 (`ProgramsView.jsx`)
> **Prompt to Copilot:**
> "编写 `src/views/ProgramsView.jsx`。使用 React Query 调用 `getPrograms()`。
> - 顶部提供搜索输入框与国家水平筛选横条；
> - 列表渲染每个专业的中文名、所属大学、门槛预估分、必修科目标签、折合年开销及工签概览；
> - 卡片右上角支持点击 '+' / '✓' 将专业加入或移除出全局志愿车；
> - 底部悬浮快捷栏展示当前勾选数量与直达排课调和页按钮。"

### 阶段 5：核心排课倒推与冲突检测视图 (`HarmonizerView.jsx`)
> **Prompt to Copilot:**
> "编写 `src/views/HarmonizerView.jsx`，这是核心视图。
> 1. 监听 `selectedProgramIds`，调用 `calculateHarmonizedPlan` 接口；
> 2. 展示统筹后的最高预估分基准（`target_ib_score`）；
> 3. 若 `conflicts` 存在数据，优先渲染红色严重冲突面板，并醒目展示解冲突方案；
> 4. 若 `warnings` 存在数据，渲染黄色院校特殊要求避坑卡片；
> 5. 渲染推荐的 6 门 IB 选课矩阵（包含各科目目标分与提出该要求的大学来源标签）；
> 6. 下方附带单科保姆级提分指南卡片。"

### 阶段 6：问卷向导、百科与时间线视图集成
> **Prompt to Copilot:**
> "完成剩余 3 个视图并组装 `src/App.jsx`：
> 1. `WizardView.jsx`：6 步卡片式白话向导问答，提交后调用 `/diagnose` 接口渲染推导报告，并支持‘一键载入并排课’；
> 2. `WikiView.jsx`：分段展示 IB 45 分制拆解与主流留学国家（加、英、美、新、德、澳）工签永居政策；
> 3. `ExtraView.jsx` 与 `TimelineView.jsx`：展示竞赛阶梯、CAS 项目建议及 G9-G12 里程碑时间线；
> 4. 在 `App.jsx` 中组装上述视图并适配手机端容器居中布局。"