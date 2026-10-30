# AtlasIB 前端开发规范与 Copilot 任务指引 (Frontend Dev Spec & Prompts)

> **致 AI 助手 (GitHub Copilot / Cursor):**
> 你是精通 **React 18/19 + Vite + Tailwind CSS + Axios + @tanstack/react-query** 的资深前端工程专家。
> 请严格根据本文档的架构规范、目录划分、API 契约及状态设计，进行模块化、高性能、类型健壮的移动端代码生成。
> 代码必须采用规范的 JSX 与 Hooks，兼顾小屏手机的视觉自适应与无障碍操作。

---

## 1. 技术栈与工程目录架构

### 1.1 技术选型
* **Runtime & Framework:** React (Vite 脚手架)
* **Styling:** Tailwind CSS + `clsx` (移动端仿真外壳与暗色科技风适配)
* **Icons:** `lucide-react`
* **Data Fetching & Caching:** Axios + `@tanstack/react-query`
* **State Management:** React Context (或轻量自定义 Hook Store)
* **API Base URL:** `http://127.0.0.1:8000/api/v1`

### 1.2 标准工程目录结构 (`src/`)
```text
atlasib-frontend/src/
├── api/
│   ├── client.js          # Axios 实例封装与统一错误拦截
│   ├── dictionary.js      # 国家、专业字典查询接口
│   ├── diagnose.js        # 智能问卷向导画像推导接口
│   └── harmonizer.js      # 多志愿排课倒推与冲突检测接口
├── context/
│   └── PlanContext.jsx    # 全局状态 (志愿车所选专业、向导画像、全局缓存)
├── components/
│   ├── common/
│   │   ├── Header.jsx     # 顶部导航、标题与避坑词典快捷入口
│   │   ├── BottomNav.jsx  # 底部 6 大 Tab 切换栏
│   │   ├── GlossaryModal.jsx # 留学黑话速查弹窗
│   │   └── ProgramDetailModal.jsx # 专业录取与工签详情弹窗
├── views/
│   ├── WizardView.jsx     # 智能问答向导 (第 1 站)
│   ├── ProgramsView.jsx   # 大学专业库与志愿车勾选 (第 2 站)
│   ├── HarmonizerView.jsx # 调和排课与冲突告警引擎 (核心，第 3 站)
│   ├── WikiView.jsx       # IB 深度科普与各国工签政策 (第 4 站)
│   ├── ExtraView.jsx      # 竞赛阶梯与 CAS 规划 (第 5 站)
│   └── TimelineView.jsx   # G9-G12 四年全周期时间线 (第 6 站)
├── App.jsx                # 根应用，组装 Layout 与 Tab 路由分发
├── index.css              # Tailwind 指令与全局滚动条美化
└── main.jsx               # React 根挂载与 QueryClientProvider 配置
```

---

## 2. API 接口对接契约与响应映射

后端服务运行在 `http://127.0.0.1:8000/api/v1`。

### 2.1 基础查询接口
* **`GET /countries`**: 获取支持 IB 申请的国家列表。
* **`GET /programs`**: 获取专业列表。
  - Query: `country_id` (可选), `faculty` (可选), `search` (可选), `offset` / `limit` (分页)。
  - 返回字段必须正确映射：`program_id`, `university_name`, `program_name`, `country_id`, `country_name`, `min_predicted`, `tuition_local_per_year`, `living_cost_per_year`, `est_total_rmb_per_year`, `coop_available`。
  - 学费显示仅使用 `tuition_local_per_year` 的原币金额，并按国家货币标识展示，不合并生活费；`est_total_rmb_per_year` 仅作人民币估算数据，不用于原币学费展示。

### 2.2 智能问卷推导
* **`POST /diagnose`**:
  - Request Body:
    ```json
    {
      "school_level": "top",
      "student_rank": "top25",
      "interest_track": "pure_cs",
      "country_pref": "any",
      "budget": "medium",
      "stay_plan": "must_stay",
      "primary_language": "Korean",
      "primary_lang_level": "native_a",
      "secondary_language": "Japanese",
      "secondary_lang_level": "beginner_ab_initio"
    }
    ```
  - 向导需收集主语言、主语言水平、第二语言与学习路径。语言名称允许自定义；水平枚举为 `native_a` / `proficient`，第二语言路径为 `fluent_b_hl` / `bilingual_a` / `standard_b_sl` / `beginner_ab_initio`。未提交时后端兼容默认 Chinese / English。
  - `country_pref` 可选值需与后端枚举一致：`any`、`USA`、`GBR`、`CAN`、`SGP`、`DEU`、`EUROPE`。`EUROPE` 表示英国以外的欧洲目的地，当前范围包括德国、法国、爱尔兰、瑞士和荷兰；后端需支持该区域值并映射到对应国家。
  - Response:
    ```json
    {
      "profile_id": "uuid-string",
      "calculated_ib_min": 39,
      "calculated_ib_max": 42,
      "reasoning_points": ["string"],
      "recommended_programs": [...]
    }
    ```

### 2.3 选课倒推与冲突检测 (核心)
* **`POST /harmonizer/calculate`**:
  - Request Body:
    ```json
    {
      "program_ids": ["waterloo_se", "oxford_cs", "tum_informatics"],
      "profile_id": "诊断接口返回的 profile_id"
    }
    ```
  - 请求必须传入诊断响应的 `profile_id`，或同时传入 `primary_language` 与 `secondary_language`；不可仅传 `program_ids`，以免语言偏好静默退回默认值。使用画像时，未显式传入的语言字段由后端读取。
  - Response:
    ```json
    {
      "target_ib_score": 42,
      "strictest_program": "牛津大学 (42分)",
      "hl_count": 3,
      "conflicts": [
        {
          "rule_code": "MAX_3_HL",
          "severity": "CRITICAL",
          "title": "...",
          "description": "...",
          "solution": "..."
        }
      ],
      "warnings": [...],
      "harmonized_subjects": [
        {
          "subject_code": "MATH_AA",
          "subject_name": "Mathematics: AA",
          "level": "HL",
          "target_grade": 7,
          "is_mandatory": true,
          "requested_by": ["..."]
        }
      ]
    }
    ```
  - 排课页必须以 `recommended_subject_matrix` 作为六门建议选课矩阵，按响应的 `group_number` / `group_name` 显示所属学科组，不得把 `harmonized_subjects` 的大学要求并集当成六门课直接渲染。
  - 展示 `course_validation` 的语言组完整性与第 4 组数量状态；若响应包含 `LANGUAGE_REQUIREMENT_CHECK`，突出显示为阻止提交/继续的严重冲突。
  - 推荐方案固定保留 Group 1 动态母语 A 与 Group 2 动态第二语言，且最多两门 Group 4 理科；页面应突出显示两门语言的官方合规提示及语言 HL 自动降级说明；TOK 和 EE 显示为六门学科之外的核心加分项。

---

## 3. 全局状态设计 (`PlanContext.jsx`)

提供全局单例状态，确保跨视图操作一致性：
1. **`selectedProgramIds` (string[])**: 用户志愿车勾选的专业 ID 列表（默认可预设 2~3 个示例，如 `['waterloo_se', 'oxford_cs']`）。
2. **`toggleProgram(id)`**: 加入/移除志愿车。如果列表只有 1 个专业时阻止清空，保证调和引擎始终有输入。
3. **`activeTab` (string)**: 当前激活的视图，可选：`wizard` | `programs` | `harmonizer` | `wiki` | `extra` | `timeline`。
4. **`wizardAnswers` (object)**: 记录向导答题状态。
5. **`diagnosisResult` (object | null)**: 缓存向导生成的推荐结果。
6. **`loadDiagnosisPrograms(ids)`**: 一键将向导推荐的专业列表替换或并入志愿车，并自动跳转至 `harmonizer` 视图。

---

## 4. UI 风格与视觉规范

* **设计基调**：移动端优先 (Mobile-First)，外层容器居中限宽（`max-w-md`），暗黑科技质感（`bg-slate-950` 底色，配合 `indigo` 与 `cyan` 强调色）。
* **冲突告警色彩规范**：
  - `CRITICAL`（严重冲突）：红底红边（`bg-red-950/40 border-red-800 text-red-200`）。
  - `WARNING`（避坑/精力提示）：黄橙底（`bg-amber-950/30 border-amber-800 text-amber-200`）。
  - 成功与达标：绿底绿字（`bg-emerald-950/30 text-emerald-300`）。
* **触控反馈**：按钮统一配置轻量过渡动画与点击反馈（`active:scale-95 transition`）。

---