# Copilot Task: 前端邮箱验证码登录/注册弹窗、用户中心与自动数据同步实现

> **Role & Task:**
> 你是精通 React 18/19 + Tailwind CSS + react-i18next 的资深前端工程师。
> 请在现有项目中实现**显式的“注册 / 登录 / 退出”全流程**，并在用户登录后自动加载用户档案、预填发信邮箱：
>
> 1. **双语词条扩充**：在 `translation.json` 中增加完整的认证文案（获取验证码、倒计时、登录成功、退出等）；
> 2. **API 接口封装 (`src/api/auth.js`)**：封装发送验证码 (`/auth/send-otp`) 与校验登录 (`/auth/verify-otp`)；
> 3. **全局状态扩展 (`src/context/PlanContext.jsx`)**：
>    - 管理 `currentUser`（包含 `email`, `user_id`），持久化至 `localStorage`；
>    - 提供 `loginWithOtp()` 与 `logout()` 方法；
>    - **数据自愈与同步**：登录成功后，若后端返回了历史 `selected_program_ids` 或 `active_profile_id`，立即无缝热更新当前页面的已选志愿；
> 4. **登录/注册独立模态框 (`src/components/auth/AuthModal.jsx`)**：
>    - 现代化双语弹窗，支持“输入邮箱 $\rightarrow$ 发送 6 位验证码（带 60s 倒计时） $\rightarrow$ 输入验证码点击登录”；
> 5. **顶部导航栏挂载 (`src/components/common/Header.jsx`)**：
>    - 未登录时：展示清晰的【登录 / 注册 (Sign In)】按钮；
>    - 已登录时：展示用户邮箱小胶囊（带绿色在线原点）与退出下拉菜单；
> 6. **发信卡片联动 (`src/components/common/SoftEmailCaptureCard.jsx`)**：
>    - 已登录状态下，输入框**默认填入当前用户的登录邮箱**，无需重复输入。

---

## 步骤 1：扩充双语字典

### 1.1 修改 `src/locales/en/translation.json`
在 JSON 中追加 `auth` 节点：
```json
{
  "auth": {
    "sign_in": "Sign In / Register",
    "sign_out": "Sign Out",
    "modal_title": "Sign In to AtlasIB",
    "modal_subtitle": "Enter your email to receive a 6-digit verification code. No password required.",
    "email_label": "Email Address",
    "email_placeholder": "name@example.com",
    "otp_label": "6-Digit Verification Code",
    "otp_placeholder": "Enter 6-digit code",
    "btn_get_code": "Get Code",
    "btn_resend_code": "Resend in {{seconds}}s",
    "btn_submit_login": "Sign In / Continue",
    "logged_in_as": "Signed in as",
    "login_success": "Signed in successfully! Your saved plans have been loaded.",
    "logout_success": "Signed out successfully.",
    "err_invalid_email": "Please enter a valid email address.",
    "err_invalid_code": "Please enter the 6-digit verification code.",
    "privacy_hint": "Protected by passwordless email OTP. Zero spam guaranteed."
  }
}
```

### 1.2 修改 `src/locales/zh/translation.json`
在 JSON 中追加 `auth` 节点：
```json
{
  "auth": {
    "sign_in": "登录 / 注册",
    "sign_out": "退出登录",
    "modal_title": "登录 / 注册 AtlasIB",
    "modal_subtitle": "输入您的常用邮箱获取 6 位数字验证码，无需设置繁琐密码。",
    "email_label": "电子邮箱",
    "email_placeholder": "输入邮箱 (如 name@example.com)",
    "otp_label": "6 位数字验证码",
    "otp_placeholder": "输入收到的 6 位验证码",
    "btn_get_code": "获取验证码",
    "btn_resend_code": "{{seconds}}秒后重发",
    "btn_submit_login": "立即验证并登录",
    "logged_in_as": "已登录账号",
    "login_success": "登录成功！已为您同步历史规划方案与志愿。",
    "logout_success": "已安全退出登录。",
    "err_invalid_email": "请输入有效的电子邮箱地址。",
    "err_invalid_code": "请输入 6 位完整的数字验证码。",
    "privacy_hint": "采用安全无密码验证码机制，承诺零骚扰。"
  }
}
```

`session_token` 是长期有效的 bearer 凭证，任何获得它的人都能使用对应账号。按项目安全要求保护它；若暂时使用 `localStorage` 持久化，应避免 XSS、禁止输出 token 到日志/分析系统，并仅通过 HTTPS 调用后端。

---

## 步骤 2：封装前端认证 API (`src/api/auth.js`)

新建 `src/api/auth.js`：

```javascript
// src/api/auth.js
import client from './client';

export const authApi = {
  // 1. 发送 6 位验证码
  sendOtp: (email, lang = 'en') =>
    client.post('/auth/send-otp', { email: email.trim(), lang }),

  // 2. 校验验证码完成登录/注册
  verifyOtp: (email, code, currentProfileId = null, lang = 'en') =>
    client.post('/auth/verify-otp', {
      email: email.trim(),
      code: code.trim(),
      current_profile_id: currentProfileId,
      lang
    }),

  // 3. 恢复当前登录用户和最新方案
  me: () => client.get('/auth/me'),

  // 4. 撤销当前设备的登录会话
  logout: () => client.post('/auth/logout')
};
```

`verify-otp` 成功响应结构为 `{ success, message, user, is_new_user, session_token }`，其中 `session_token` 位于响应顶层而不是 `user` 内。后续所有需要登录态的 API 请求都必须携带 `Authorization: Bearer <session_token>`。建议在 `client` 请求拦截器中从持久存储读取 token 并统一添加请求头；`/auth/send-otp` 不需要 token。

`GET /auth/me` 响应为 `{ success, user }`；`POST /auth/logout` 响应为 `{ success, message }`。后端错误统一为 `{ error: { code, message, details } }`，429 冷却剩余秒数位于 `error.details.cooldown_seconds`；不要按 FastAPI 默认的 `detail` 字段解析。

在 `src/api/client.js` 的请求拦截器添加 Bearer token。只对当前后端 API 的请求附加 token，禁止把 token 转发到第三方 URL：

```javascript
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlasib_session_token');
  if (token && isBackendApiRequest(config)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

`isBackendApiRequest(config)` 应依据现有 `client` 的 `baseURL` / API host 实现，不能仅凭 URL 是相对路径就把 token 发送到任意地址。若现有 API client 已统一限制请求目标，可直接在拦截器中设置请求头。

---

## 步骤 3：全局状态接管 (`src/context/PlanContext.jsx`)

在 `src/context/PlanContext.jsx` 中增加 `currentUser` 状态，并暴露 `loginWithOtp`、`restoreSession` 与 `logout`。后端的 `user_sessions` 不设置自动过期，除非用户主动退出，否则会话持续有效；因此需要持久保存 token，并在应用启动时向后端验证和恢复用户数据。

```javascript
// src/context/PlanContext.jsx 扩展代码
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const PlanContext = createContext(null);

export const PlanProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionRestoreError, setSessionRestoreError] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState(() => localStorage.getItem('atlasib_profile_id') || null);
  const [selectedProgramIds, setSelectedProgramIds] = useState(['waterloo_se', 'oxford_cs']);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 一处同步登录响应和 /auth/me 的 user 对象。
  const applyUserData = useCallback((userData) => {
    setCurrentUser({ userId: userData.user_id, email: userData.email });
    localStorage.setItem('atlasib_saved_email', userData.email);

    // null 和空数组都代表服务器上的实际状态，必须覆盖本地旧数据。
    setCurrentProfileId(userData.active_profile_id || null);
    if (userData.active_profile_id) {
      localStorage.setItem('atlasib_profile_id', userData.active_profile_id);
    } else {
      localStorage.removeItem('atlasib_profile_id');
    }

    setSelectedProgramIds(userData.selected_program_ids || []);
    setActiveScenarioId(userData.active_scenario_id || null);
    setScenarios(userData.scenarios || []);
  }, []);

  // 应用启动时通过后端验证本地 token 并恢复最新用户数据。
  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem('atlasib_session_token');
    if (!token) {
      setIsSessionLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      applyUserData(res.data.user);
      setSessionRestoreError(false);
    } catch (err) {
      // 401 表示会话已被撤销或无效；网络错误不应误删仍有效的 token。
      if (err.response?.status === 401) {
        localStorage.removeItem('atlasib_session_token');
        setCurrentUser(null);
      } else {
        setSessionRestoreError(true);
        console.error('Unable to restore the login session.', err);
      }
    } finally {
      setIsSessionLoading(false);
    }
  }, [applyUserData]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 登录/注册：保存后端 token 并同步画像、志愿与方案。
  const loginWithOtp = async (email, code, lang = 'en') => {
    const res = await authApi.verifyOtp(email, code, currentProfileId, lang);
    const { user, session_token: sessionToken } = res.data;
    localStorage.setItem('atlasib_session_token', sessionToken);
    applyUserData(user);
    return res.data;
  };

  // 登出：服务端先撤销当前设备会话；即使请求失败也清除本地凭证。
  const logout = async () => {
    try {
      if (localStorage.getItem('atlasib_session_token')) {
        await authApi.logout();
      }
    } finally {
      localStorage.removeItem('atlasib_session_token');
      localStorage.removeItem('atlasib_user_session');
      setCurrentUser(null);
      setActiveScenarioId(null);
      setScenarios([]);
      // 按产品需要保留已选志愿，供访客继续使用。
    }
  };

  return (
    <PlanContext.Provider value={{
      currentUser,
      loginWithOtp,
      logout,
      restoreSession,
      isSessionLoading,
      sessionRestoreError,
      isAuthModalOpen,
      setIsAuthModalOpen,
      currentProfileId,
      setCurrentProfileId,
      selectedProgramIds,
      setSelectedProgramIds,
      activeScenarioId,
      setActiveScenarioId,
      scenarios,
      setScenarios,
      // ... 保留已有状态与方法 ...
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);
```

登录弹窗应调用 `loginWithOtp(email, code, currentLang)`，不要只调用 `verifyOtp()` 后自行保存不完整的用户信息。应用启动时，在 `isSessionLoading` 为 `true` 期间可显示恢复状态，避免短暂显示未登录按钮或访客数据。

若 `sessionRestoreError` 为 `true`，表示暂时无法连接后端确认登录状态，不等于 token 无效；保留 token，并提供重试 `restoreSession()` 的入口，不要误报用户已退出或清除凭证。只有 `/auth/me` 明确返回 401 才清理 token。

---

## 步骤 4：编写登录/注册弹窗组件 (`src/components/auth/AuthModal.jsx`)

新建 `src/components/auth/AuthModal.jsx`：

```jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, KeyRound, ArrowRight, ShieldCheck, Loader2, X, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth';
import { usePlan } from '../../context/PlanContext';

export default function AuthModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { loginWithOtp } = usePlan();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 输入验证码

  const currentLang = (i18n.language && i18n.language.startsWith('zh')) ? 'zh' : 'en';

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  // 发送验证码
  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage(t('auth.err_invalid_email'));
      return;
    }

    setErrorMessage('');
    setIsSendingOtp(true);

    try {
      await authApi.sendOtp(email, currentLang);
      setCooldown(60);
      setStep(2);
    } catch (err) {
      const apiError = err.response?.data?.error;
      const cooldownSeconds = apiError?.details?.cooldown_seconds;
      if (err.response?.status === 429 && cooldownSeconds) {
        setCooldown(cooldownSeconds);
      }
      setErrorMessage(apiError?.message || 'Failed to send code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 验证登录
  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage(t('auth.err_invalid_code'));
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    try {
      const result = await loginWithOtp(email, otpCode, currentLang);
      if (result?.success) {
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error?.message || t('auth.err_invalid_code')
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-700/80 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 头部标题 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/80 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {t('auth.modal_title')}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t('auth.modal_subtitle')}
          </p>
        </div>

        {/* 表单区域 */}
        <form onSubmit={step === 1 ? handleSendCode : handleVerify} className="space-y-3">
          {/* 邮箱输入框 */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              {t('auth.email_label')}
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                disabled={step === 2 || isSendingOtp}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* 验证码输入框 (第 2 步显示) */}
          {step === 2 && (
            <div className="space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  {t('auth.otp_label')}
                </label>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={cooldown > 0 || isSendingOtp}
                  className="text-[10px] text-cyan-400 hover:underline disabled:opacity-50"
                >
                  {cooldown > 0 ? t('auth.btn_resend_code', { seconds: cooldown }) : t('auth.btn_get_code')}
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('auth.otp_placeholder')}
                autoFocus
                className="w-full text-center tracking-[6px] font-mono font-bold py-2 bg-slate-950 border border-indigo-500 rounded-xl text-sm text-cyan-300 focus:outline-none"
              />
            </div>
          )}

          {errorMessage && (
            <p className="text-[10px] text-rose-400 pl-1">{errorMessage}</p>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isSendingOtp || isVerifying}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
          >
            {isSendingOtp || isVerifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{step === 1 ? t('auth.btn_get_code') : t('auth.btn_submit_login')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 底部隐私声明 */}
        <div className="pt-1 flex items-center justify-center gap-1 text-[10px] text-slate-500">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>{t('auth.privacy_hint')}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 步骤 5：在顶部导航栏挂载登录与退出按钮 (`src/components/common/Header.jsx`)

在 `src/components/common/Header.jsx` 中集成登录/退出交互与弹窗挂载：

```jsx
// src/components/common/Header.jsx 关键片段
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, LogOut, LogIn } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import AuthModal from '../auth/AuthModal';

export default function Header() {
  const { t } = useTranslation();
  const { currentUser, isSessionLoading, logout, isAuthModalOpen, setIsAuthModalOpen } = usePlan();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="relative ...">
      {/* 现有导航栏内容 ... */}
      
      {/* 右侧用户状态区域 */}
      <div className="flex items-center gap-2">
        {isSessionLoading ? null : currentUser ? (
          /* 已登录状态：展示邮箱与退出菜单 */
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-indigo-500 flex items-center gap-1.5 text-[11px] text-slate-200 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="max-w-[110px] truncate font-medium">{currentUser.email}</span>
            </button>

            {/* 退出下拉浮层 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 z-30 animate-fadeIn">
                <div className="px-2 py-1.5 text-[10px] text-slate-400 border-b border-slate-800">
                  {currentUser.email}
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('auth.sign_out')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 未登录状态：展示登录按钮 */
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-2.5 py-1 rounded-full bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/80 text-xs font-semibold text-indigo-200 hover:text-white flex items-center gap-1 transition shadow-sm"
          >
            <LogIn className="w-3 h-3" />
            <span>{t('auth.sign_in')}</span>
          </button>
        )}
      </div>

      {/* 挂载登录弹窗 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}
```

退出时应等待 `logout()` 完成后关闭菜单。即使后端请求失败，`PlanContext.logout()` 也会清除当前设备的本地 token；若登出请求未能抵达后端，服务端会话仍存在，因此不要把服务端撤销失败显示成完全成功，可提示“本设备已退出，但服务端会话撤销未确认”。不得清除其他设备的会话。

---

## 步骤 6：留资发信卡片自动预填当前登录邮箱 (`src/components/common/SoftEmailCaptureCard.jsx`)

在 `SoftEmailCaptureCard.jsx` 初始化时，优先使用已登录用户的邮箱：

```jsx
// src/components/common/SoftEmailCaptureCard.jsx
const { currentUser } = usePlan();

const [email, setEmail] = useState(() => {
  return currentUser?.email || localStorage.getItem('atlasib_saved_email') || '';
});

// 当用户在页面中完成登录时，自动填充到输入框
useEffect(() => {
  if (currentUser?.email) {
    setEmail(currentUser.email);
  }
}, [currentUser]);
```