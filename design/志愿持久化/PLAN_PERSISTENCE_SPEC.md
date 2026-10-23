# AtlasIB 智能向导画像持久化与已选志愿云端管理方案 (Full-Stack Spec)

本文档补充与升级原有系统中的**用户向导画像存档**与**已选志愿持久化**能力，实现用户答题落库、专属画像生成、已选志愿增删查改（CRUD）及跨端状态同步。

---

## 1. 数据库层改造与增强 (PostgreSQL)

原有表结构中的 `user_profiles` 和 `user_selected_programs` 已具备基础字段，此处增加**向导画像快照 JSONB 字段**以及**针对匿名/轻量级用户的唯一凭证索引**。

### 1.1 增量升级 SQL (`migrations/update_user_profiles_and_cart.sql`)

```sql
-- =============================================================================
-- 数据库补丁: 增加向导推荐快照与匿名会话识别
-- =============================================================================
SET search_path TO public;

BEGIN;

-- 1. 扩充 user_profiles 表字段
ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS reasoning_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS recommended_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS client_device_id VARCHAR(64) NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_device ON user_profiles(client_device_id);

-- 2. 增强 user_selected_programs 表字段
ALTER TABLE user_selected_programs 
    ADD COLUMN IF NOT EXISTS note VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- 3. 校验唯一约束确保幂等防重
-- 确保同一个 profile_id 下同一个 program_id 只能添加一次
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_program'
    ) THEN
        ALTER TABLE user_selected_programs 
            ADD CONSTRAINT uq_user_program UNIQUE (user_profile_id, program_id);
    END IF;
END $$;

COMMIT;
```

---

## 2. 后端 API 契约与业务逻辑 (FastAPI + Pydantic v2)

### 2.1 涉及的 API 列表

| 方法 | 路径 | 业务功能 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/diagnose` | 提交问卷，推导计算，并将画像、推导分数及推荐快照写入 `user_profiles` |
| `GET` | `/api/v1/profiles/{profile_id}` | 查询指定画像记录及其向导答题历史与诊断报告 |
| `GET` | `/api/v1/profiles/{profile_id}/programs` | 获取当前画像对应的已选志愿专业完整详情列表 |
| `POST` | `/api/v1/profiles/{profile_id}/programs` | 批量或单个添加专业到已选志愿库 |
| `DELETE` | `/api/v1/profiles/{profile_id}/programs/{program_id}` | 从已选志愿中移除某专业 |
| `PUT` | `/api/v1/profiles/{profile_id}/programs/batch` | 全量覆盖/替换当前画像的已选志愿列表 |

---

### 2.2 Pydantic DTO 模型设计 (`app/schemas/diagnose.py` & `user_cart.py`)

```python
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# 1. 问卷提交请求体（兼容前端传 budget 或 annual_budget_rmb）
class DiagnoseRequest(BaseModel):
    school_level: str = Field(description="top | middle | emerging")
    student_rank: str = Field(description="top5 | top25 | middle")
    interest_track: str = Field(description="pure_cs | engineering | balanced")
    country_pref: str = Field(default="any", description="any | USA | GBR | CAN | SGP | DEU")
    annual_budget_rmb: str = Field(
        default="medium", 
        alias="budget", 
        description="economy | medium | abundant"
    )
    stay_plan: str = Field(description="must_stay | work_few_years | return")
    client_device_id: Optional[str] = Field(default=None, description="前端唯一设备/会话ID")

    model_config = ConfigDict(populate_by_name=True)

# 2. 推荐专业精简摘要
class RecommendedProgramItem(BaseModel):
    program_id: str
    university_name: str
    program_name: str
    country_name: str
    flag_emoji: str
    min_predicted: int
    est_annual_rmb: int
    coop_available: bool
    fit_reasons: List[str] = []

# 3. 问卷响应体（含 profile_id，前端存入 localStorage）
class DiagnoseResponse(BaseModel):
    profile_id: UUID
    calculated_ib_min: int
    calculated_ib_max: int
    reasoning_points: List[str]
    recommended_programs: List[RecommendedProgramItem]

# 4. 志愿操作请求体
class AddProgramRequest(BaseModel):
    program_id: str
    note: Optional[str] = None

class BatchUpdateProgramsRequest(BaseModel):
    program_ids: List[str]

# 5. 已选志愿项响应体
class SelectedProgramDetail(BaseModel):
    program_id: str
    university_id: str
    university_name: str
    program_name: str
    country_id: str
    country_name: str
    flag_emoji: str
    min_predicted_total: int
    rec_predicted_min: int
    est_total_rmb_per_year: int
    coop_available: bool
    graduation_difficulty: str
    created_at: datetime
```

---

### 2.3 核心路由实现示例 (`app/api/v1/endpoints/user_programs.py`)

```python
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert

from app.api.deps import get_db
from app.models.user import UserProfile, UserSelectedProgram
from app.models.institution import Program, University, Country
from app.models.requirement import ProgramAdmissionRule
from app.schemas.user_cart import (
    SelectedProgramDetail, 
    AddProgramRequest, 
    BatchUpdateProgramsRequest
)

router = APIRouter(prefix="/profiles", tags=["User Profiles & Saved Programs"])

@router.get("/{profile_id}/programs", response_model=List[SelectedProgramDetail])
async def get_selected_programs(profile_id: UUID, db: AsyncSession = Depends(get_db)):
    """获取用户画像下当前保存的志愿专业列表"""
    # 验证画像是否存在
    profile = await db.get(UserProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="UserProfile not found")

    stmt = (
        select(
            UserSelectedProgram.program_id,
            UserSelectedProgram.created_at,
            Program.university_id,
            Program.name_cn.label("program_name"),
            Program.est_total_rmb_per_year,
            Program.coop_available,
            Program.graduation_difficulty,
            University.name_cn.label("university_name"),
            Country.id.label("country_id"),
            Country.name_cn.label("country_name"),
            Country.flag_emoji,
            ProgramAdmissionRule.min_predicted_total,
            ProgramAdmissionRule.rec_predicted_min
        )
        .join(Program, UserSelectedProgram.program_id == Program.id)
        .join(University, Program.university_id == University.id)
        .join(Country, University.country_id == Country.id)
        .outerjoin(ProgramAdmissionRule, Program.id == ProgramAdmissionRule.program_id)
        .where(UserSelectedProgram.user_profile_id == profile_id)
        .order_by(UserSelectedProgram.sort_order.asc(), UserSelectedProgram.created_at.desc())
    )
    
    rows = (await db.execute(stmt)).all()
    results = []
    for r in rows:
        results.append(SelectedProgramDetail(
            program_id=r.program_id,
            university_id=r.university_id,
            university_name=r.university_name,
            program_name=r.program_name,
            country_id=r.country_id,
            country_name=r.country_name,
            flag_emoji=r.flag_emoji,
            min_predicted_total=r.min_predicted_total or 36,
            rec_predicted_min=r.rec_predicted_min or 38,
            est_total_rmb_per_year=r.est_total_rmb_per_year,
            coop_available=r.coop_available,
            graduation_difficulty=r.graduation_difficulty,
            created_at=r.created_at
        ))
    return results

@router.post("/{profile_id}/programs", status_code=status.HTTP_201_CREATED)
async def add_program_to_profile(
    profile_id: UUID, 
    payload: AddProgramRequest, 
    db: AsyncSession = Depends(get_db)
):
    """向指定用户画像的志愿车追加一个专业（幂等插入）"""
    program = await db.get(Program, payload.program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    insert_stmt = insert(UserSelectedProgram).values(
        user_profile_id=profile_id,
        program_id=payload.program_id,
        note=payload.note
    ).on_conflict_do_nothing(
        index_elements=['user_profile_id', 'program_id']
    )
    await db.execute(insert_stmt)
    await db.commit()
    return {"status": "success", "message": "Program added to profile"}

@router.delete("/{profile_id}/programs/{program_id}", status_code=status.HTTP_200_OK)
async def remove_program_from_profile(
    profile_id: UUID, 
    program_id: str, 
    db: AsyncSession = Depends(get_db)
):
    """从用户画像中移除指定专业"""
    stmt = delete(UserSelectedProgram).where(
        UserSelectedProgram.user_profile_id == profile_id,
        UserSelectedProgram.program_id == program_id
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "Program removed"}

@router.put("/{profile_id}/programs/batch", status_code=status.HTTP_200_OK)
async def batch_update_programs(
    profile_id: UUID, 
    payload: BatchUpdateProgramsRequest, 
    db: AsyncSession = Depends(get_db)
):
    """批量替换用户画像当前勾选的所有志愿"""
    # 1. 清空旧记录
    await db.execute(
        delete(UserSelectedProgram).where(UserSelectedProgram.user_profile_id == profile_id)
    )
    
    # 2. 批量插入新记录
    if payload.program_ids:
        records = [
            {"user_profile_id": profile_id, "program_id": pid, "sort_order": idx}
            for idx, pid in enumerate(payload.program_ids)
        ]
        await db.execute(insert(UserSelectedProgram).values(records))
    
    await db.commit()
    return {"status": "success", "count": len(payload.program_ids)}
```

---

## 3. 前端全局状态与接口层对接 (`PlanContext.jsx`)

前端需要持久化记录 `currentProfileId`（存入 `localStorage`），并在每次用户增删志愿时，保持**本地全局状态**与**后端数据库**的同步。

### 3.1 前端 API 封装扩展 (`src/api/userPrograms.js`)

```javascript
import client from './client';

export const userProgramApi = {
  // 获取当前画像下的全部已选志愿
  getSelectedPrograms: (profileId) => 
    client.get(`/profiles/${profileId}/programs`),

  // 添加单门专业
  addProgram: (profileId, programId) => 
    client.post(`/profiles/${profileId}/programs`, { program_id: programId }),

  // 移除单门专业
  removeProgram: (profileId, programId) => 
    client.delete(`/profiles/${profileId}/programs/${programId}`),

  // 批量替换志愿（例如点击向导的“一键载入全部推荐”）
  batchSavePrograms: (profileId, programIds) => 
    client.put(`/profiles/${profileId}/programs/batch`, { program_ids: programIds })
};
```

### 3.2 全局 Context 增强 (`src/context/PlanContext.jsx`)

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { userProgramApi } from '../api/userPrograms';

const PlanContext = createContext(null);

export const PlanProvider = ({ children }) => {
  // 1. 本地缓存用户 Profile ID
  const [currentProfileId, setCurrentProfileId] = useState(() => {
    return localStorage.getItem('atlasib_profile_id') || null;
  });

  // 已选志愿的 ID 数组
  const [selectedProgramIds, setSelectedProgramIds] = useState(['waterloo_se', 'oxford_cs']);
  // 当前激活 Tab
  const [activeTab, setActiveTab] = useState('wizard');
  // 缓存向导的诊断结果
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  // 2. 初始化：如果存在 profile_id，自动向后端拉取数据库中保存的志愿列表
  useEffect(() => {
    if (currentProfileId) {
      userProgramApi.getSelectedPrograms(currentProfileId)
        .then(res => {
          if (res.data && res.data.length > 0) {
            setSelectedProgramIds(res.data.map(item => item.program_id));
          }
        })
        .catch(err => {
          console.warn('获取云端志愿记录失败，沿用本地缓存', err);
        });
    }
  }, [currentProfileId]);

  // 3. 设置并保存新的画像 ID
  const saveProfileId = (profileId) => {
    setCurrentProfileId(profileId);
    localStorage.setItem('atlasib_profile_id', profileId);
  };

  // 4. 切换加入/移除志愿（同时更新 React 状态与后端数据库）
  const toggleProgram = async (programId) => {
    const isSelected = selectedProgramIds.includes(programId);
    
    // 防呆保护：至少保留一个志愿以供倒推引擎计算
    if (isSelected && selectedProgramIds.length <= 1) {
      return { success: false, reason: '至少需保留 1 个志愿专业' };
    }

    const nextIds = isSelected 
      ? selectedProgramIds.filter(id => id !== programId)
      : [...selectedProgramIds, programId];

    // 先做乐观更新，保证前端界面零延迟响应
    setSelectedProgramIds(nextIds);

    // 如果已绑定云端 profileId，同步通知后端
    if (currentProfileId) {
      try {
        if (isSelected) {
          await userProgramApi.removeProgram(currentProfileId, programId);
        } else {
          await userProgramApi.addProgram(currentProfileId, programId);
        }
      } catch (err) {
        console.error('志愿同步后端失败', err);
      }
    }
    return { success: true };
  };

  // 5. 一键将向导推荐的专业批量入库并设为已选
  const batchApplyDiagnosisPrograms = async (programIds) => {
    if (!programIds || programIds.length === 0) return;
    setSelectedProgramIds(programIds);
    if (currentProfileId) {
      try {
        await userProgramApi.batchSavePrograms(currentProfileId, programIds);
      } catch (err) {
        console.error('批量入库失败', err);
      }
    }
    // 自动切到调和排课页
    setActiveTab('harmonizer');
  };

  return (
    <PlanContext.Provider value={{
      currentProfileId,
      saveProfileId,
      selectedProgramIds,
      toggleProgram,
      batchApplyDiagnosisPrograms,
      activeTab,
      setActiveTab,
      diagnosisResult,
      setDiagnosisResult
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);
```

---

## 4. 诊断结果页交互实现 (`src/views/WizardView.jsx`)

诊断完成后渲染结果卡片，提供：
1. **多选复选框**：用户可单选、反选任何推荐专业；
2. **“加入志愿” / “已在志愿中”状态直观切换**；
3. **“一键全选保存至我的志愿并排课”** 按钮。

```jsx
{/* 诊断报告展示区片段 */}
<div className="space-y-3 pt-2">
  <div className="flex items-center justify-between">
    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
      <GraduationCap className="w-4 h-4 text-indigo-400" />
      系统为您推荐的针对性专业方案
    </h3>
    <span className="text-[10px] text-slate-400">可自由勾选保存到志愿车</span>
  </div>

  <div className="space-y-2">
    {diagnosisResult.recommended_programs.map(prog => {
      const isSaved = selectedProgramIds.includes(prog.program_id);
      return (
        <div 
          key={prog.program_id}
          className={`p-3 rounded-2xl border transition ${
            isSaved 
              ? 'bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10' 
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{prog.university_name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                  {prog.flag_emoji} {prog.country_name}
                </span>
              </div>
              <div className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                {prog.program_name}
              </div>
            </div>

            {/* 单个志愿保存与移除切换按钮 */}
            <button
              onClick={() => toggleProgram(prog.program_id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                isSaved 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {isSaved ? <><Check className="w-3 h-3" /> 已在志愿车</> : <><Plus className="w-3 h-3" /> 加入志愿</>}
            </button>
          </div>

          <div className="mt-2 p-2 bg-slate-950 rounded-xl text-[10px] text-slate-300 space-y-1">
            <div>录取预估门槛：<span className="text-emerald-400 font-bold">{prog.min_predicted}分+</span></div>
            <div>折合年总开销：约 {prog.est_annual_rmb} 万人民币</div>
            {prog.fit_reasons && prog.fit_reasons.length > 0 && (
              <div className="text-slate-400 pt-0.5">• 推荐理由：{prog.fit_reasons[0]}</div>
            )}
          </div>
        </div>
      );
    })}
  </div>

  {/* 底部一键采纳批量动作 */}
  <div className="pt-2 flex gap-2">
    <button
      onClick={() => batchApplyDiagnosisPrograms(diagnosisResult.recommended_programs.map(p => p.program_id))}
      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 hover:opacity-95"
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>一键保存全部推荐专业并进入调和排课</span>
    </button>
  </div>
</div>
```