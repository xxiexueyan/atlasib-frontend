# Copilot Task: 前端全套方案快照打包传递与报告“再次发送 (Resend)”功能实现

> **Role & Task:**
> 你是精通 React + Tailwind CSS + react-i18next 的资深前端工程师。
> 请改造现有的 API 接口封装、双语语言包与 `SoftEmailCaptureCard.jsx` 组件：
>
> 1. **接口封装升级**：
>    在 `src/api/userPrograms.js` 中扩充 `claimProfileEmail`，在提交时附带当前产生的所有方案快照（`scenarios`）以及当前选中的方案 ID（`active_scenario_id`）；
> 2. **支持“再次发送 (Resend)”与修改邮箱**：
>    发送成功后，用户卡片不生硬锁死，而是呈现成功状态，并提供 **“再次发送最新方案 (Resend Report)”** 和 **“更换邮箱 (Change Email)”** 按钮；当用户微调了志愿或切换了方案后，可随时一键再次触发投递；
> 3. **视图接入**：
>    在 `HarmonizerView.jsx` 中将计算出的完整 `harmonizeData.scenarios` 传入留资组件，确保后端收到的数据是最新完整的。

---

## 步骤 1：更新双语字典包

### 1.1 修改 `src/locales/en/translation.json`

在 `email_gate` 节点中补充重发与多方案相关词条：

```json
{
  "email_gate": {
    "title": "Save All Pathways & Receive Multi-Scenario PDF Report",
    "subtitle": "Optional. Enter your email to archive all tailored course combinations to the database and receive an all-in-one PDF report.",
    "placeholder": "Enter your email (e.g. name@example.com)...",
    "btn_submit": "Save & Email All Pathways",
    "btn_resend": "Resend Report",
    "btn_change_email": "Change Email",
    "privacy_note": "No spam. All pathways archived securely for cross-device sync.",
    "skip_btn": "Skip for now",
    "success_title": "All Pathways Saved & Report Delivered!",
    "success_desc": "All tailored pathways and your comprehensive PDF comparison have been sent to {{email}}.",
    "err_invalid_email": "Please enter a valid email address.",
    "err_failed": "Failed to deliver. Please try again later."
  }
}
```

### 1.2 修改 `src/locales/zh/translation.json`

在 `email_gate` 节点中补充重发与多方案相关词条：

```json
{
  "email_gate": {
    "title": "全量归档全部方案 · 发送多方案对比 PDF 报告",
    "subtitle": "选填。输入常用邮箱即可将系统推导的全部备选路线同步存入数据库，并向您的邮箱投递多方案全景对比与 PDF 附件。",
    "placeholder": "输入常用邮箱 (如: name@example.com)...",
    "btn_submit": "保存并发送全套方案",
    "btn_resend": "再次发送最新报告",
    "btn_change_email": "更换收件邮箱",
    "privacy_note": "承诺零骚扰，全套排课数据已安全落库，支持跨端找回。",
    "skip_btn": "暂不保存，直接浏览",
    "success_title": "全套方案已成功存档，报告已送达！",
    "success_desc": "包含所有备选排课路线与完整对比的 PDF 报告已发送至 {{email}}。",
    "err_invalid_email": "请输入有效的电子邮箱地址。",
    "err_failed": "投递失败，请稍后重试。"
  }
}
```

---

## 步骤 2：更新 API 客户端接口 (`src/api/userPrograms.js`)

在 `src/api/userPrograms.js` 中更新 `claimProfileEmail`，支持传递多方案与当前高亮方案：

```javascript
// src/api/userPrograms.js
import client from './client';

export const userProgramApi = {
  // ... 保留已有方法 ...

  // 绑定用户邮箱并打包发送所有方案及PDF报告 (支持再次发送)
  claimProfileEmail: (profileId, email, lang = 'en', scenarios = null, activeScenarioId = null) => 
    client.post(`/profiles/${profileId}/claim-email`, {
      email: email.trim(),
      send_email_report: true,
      lang: lang,
      scenarios: scenarios,
      active_scenario_id: activeScenarioId
    })
};
```

---

## 步骤 3：升级留资卡片独立组件 (`src/components/common/SoftEmailCaptureCard.jsx`)

请完整替换 `src/components/common/SoftEmailCaptureCard.jsx`，增加 **“再次发送报告 (Resend)”**、**“更换邮箱”** 以及 **发信冷却计时（防止狂点）**：

```jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck, Loader2, FileDown, RotateCw, Edit3 } from 'lucide-react';
import { userProgramApi } from '../../api/userPrograms';
import { usePlan } from '../../context/PlanContext';

export default function SoftEmailCaptureCard({ scenarios = null, activeScenarioId = null, onSaved = null }) {
  const { t, i18n } = useTranslation();
  const { currentProfileId } = usePlan();
  
  const [email, setEmail] = useState(() => localStorage.getItem('atlasib_saved_email') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 冷却倒计时（秒）

  const currentLang = (i18n.language && i18n.language.startsWith('zh')) ? 'zh' : 'en';

  // 冷却计时器
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (isDismissed) return null;

  const handleSend = async (targetEmail) => {
    const finalEmail = targetEmail || email;
    if (!finalEmail || !finalEmail.includes('@') || !finalEmail.includes('.')) {
      setErrorMessage(t('email_gate.err_invalid_email'));
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (currentProfileId) {
        await userProgramApi.claimProfileEmail(
          currentProfileId, 
          finalEmail, 
          currentLang, 
          scenarios, 
          activeScenarioId
        );
      }
      localStorage.setItem('atlasib_saved_email', finalEmail);
      setIsSuccess(true);
      setCooldown(30); // 30秒发信冷却
      if (onSaved) onSaved(finalEmail);
    } catch (err) {
      setErrorMessage(t('email_gate.err_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(email);
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-cyan-950/40 border border-indigo-700/60 shadow-lg space-y-3 transition-all">
      {isSuccess ? (
        /* 成功反馈状态：提供再次重发与修改邮箱按钮 */
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">
                {t('email_gate.success_title')}
              </h4>
              <p className="text-[11px] text-slate-300 leading-snug">
                {t('email_gate.success_desc', { email })}
              </p>
            </div>
          </div>

          {/* 再次重发与切换操作条 */}
          <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 text-[11px]">
            <button
              type="button"
              onClick={() => handleSend(email)}
              disabled={isSubmitting || cooldown > 0}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition disabled:opacity-40 disabled:hover:text-cyan-400"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCw className={`w-3.5 h-3.5 ${cooldown > 0 ? 'text-slate-500' : ''}`} />
              )}
              <span>
                {cooldown > 0 
                  ? `${t('email_gate.btn_resend')} (${cooldown}s)` 
                  : t('email_gate.btn_resend')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>{t('email_gate.btn_change_email')}</span>
            </button>
          </div>
        </div>
      ) : (
        /* 表单输入视图 */
        <div className="space-y-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="text-xs font-bold text-white">
                {t('email_gate.title')}
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('email_gate.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email_gate.placeholder')}
                  disabled={isSubmitting}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition disabled:opacity-50 shadow-md shadow-indigo-500/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{t('email_gate.btn_submit')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <p className="text-[10px] text-rose-400 pl-1">{errorMessage}</p>
            )}

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                {t('email_gate.privacy_note')}
              </span>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="hover:text-slate-300 underline"
              >
                {t('email_gate.skip_btn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

---

## 步骤 4：在排课视图中挂载并传递完整多方案数据 (`src/views/HarmonizerView.jsx`)

在 `src/views/HarmonizerView.jsx` 底部，将计算出的全部方案 `scenarios` 和当前方案 `activeScenarioId` 注入留资组件：

```jsx
// src/views/HarmonizerView.jsx
import SoftEmailCaptureCard from '../components/common/SoftEmailCaptureCard';

// 在 6 门选课矩阵下方挂载：
<div className="pt-2">
  <SoftEmailCaptureCard 
    scenarios={harmonizeData?.scenarios || null}
    activeScenarioId={activeScenarioId}
  />
</div>
```