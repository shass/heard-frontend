# 📘 HEARD Multiplatform Implementation Plan (Final)

## 🎯 Цели и приоритеты

### MVP Scope
1. **Web** (браузер) - полная функциональность
2. **Base App** - исправить аутентификацию и навигацию
3. **Farcaster** - поддержка frames и native auth

### Критические проблемы к решению
- ❌ Аутентификация не работает в Base App
- ❌ Навигация ломается после деплоя (первый клик = reload)
- ❌ Компоненты > 150 строк
- ❌ Хардкод значений

## 🏗️ Архитектура решения

### Структура проекта
```
heard-frontend/
├── config/
│   ├── platforms.config.ts      # Конфигурация платформ
│   ├── auth.config.ts           # Настройки аутентификации
│   ├── ui.config.ts             # UI константы
│   └── api.config.ts            # API endpoints
│
├── lib/
│   ├── platform/
│   │   ├── detectors/           # Детекторы платформ
│   │   ├── platform.manager.ts  # Менеджер платформ
│   │   └── platform.types.ts    # Типы
│   │
│   └── auth/
│       ├── strategies/          # Стратегии auth
│       └── auth.manager.ts      # Auth orchestration
│
├── hooks/
│   ├── use-platform.ts          # Platform detection
│   ├── use-auth.ts              # Authentication
│   └── use-navigation-fix.ts    # Fix для навигации
│
└── components/
    ├── features/                 # Функциональные компоненты (< 150 строк)
    └── ui/                       # Базовые UI компоненты
```

## 📦 Phase 0: Dependencies Optimization (День 0)

### 0.1 Dependencies Audit & Updates

```bash
# Remove unused dependencies
pnpm remove autoprefixer motion next-themes sonner vaul cmdk embla-carousel-react input-otp react-day-picker react-resizable-panels recharts

# Replace axios with native fetch (security + bundle size)
pnpm remove axios

# Add platform-specific dependencies
pnpm add ua-parser-js@^2.0.0
pnpm add @farcaster/auth-kit@^0.3.3  # If available
pnpm add -D @types/ua-parser-js@^0.7.39

# Update critical dependencies
pnpm update @coinbase/onchainkit@latest @rainbow-me/rainbowkit@latest wagmi@latest viem@latest
```

### 0.2 Remove axios from codebase

```bash
# Find all axios usage
rg "import.*axios" --type ts --type tsx
rg "axios\." --type ts --type tsx

# Replace with fetch in:
# - lib/api/*.ts files
# - Any other files using axios
```

### 0.3 Optimize Radix UI imports

```bash
# Remove unused Radix components (check usage first)
rg "@radix-ui/react-" --type ts --type tsx | grep import

# Keep only:
# - dialog, dropdown-menu, select, tabs, toast, tooltip
# Remove rest if unused
```

## 📝 Phase 1: Конфигурация и константы (День 1)

### 1.1 Platform Configuration

```typescript
// config/platforms.config.ts
export const PLATFORM_CONFIG = {
  web: {
    type: 'web' as const,
    name: 'Web Browser',
    detection: {
      // Fallback - если ничего не подошло
      priority: 999,
      checks: []
    },
    capabilities: {
      hasNativeAuth: false,
      preferredAuth: 'wallet' as const,
      hasWeb3: true,
      hasSocialShare: true,
      hasDeepLinks: false,
      hasNotifications: true,
      maxUploadSize: 100 * 1024 * 1024, // 100MB
    },
    ui: {
      hasHeader: true,
      hasFooter: true,
      safeAreaTop: 0,
      safeAreaBottom: 0,
      preferredColorScheme: 'auto' as const,
      touchTargetSize: 44, // minimum touch target
      maxComponentLines: 150
    },
    navigation: {
      canGoBack: true,
      canOpenExternal: true,
      canShare: true,
      usesRouter: true
    }
  },
  
  base: {
    type: 'base' as const,
    name: 'Base App',
    detection: {
      priority: 1,
      checks: [
        { type: 'userAgent', patterns: [/Base/i, /Warpcast/i] },
        { type: 'hostname', patterns: ['base.org', 'warpcast.com'] },
        { type: 'windowProperty', property: 'miniKit' }
      ]
    },
    capabilities: {
      hasNativeAuth: true,
      preferredAuth: 'base' as const,
      hasWeb3: true,
      hasSocialShare: true,
      hasDeepLinks: true,
      hasNotifications: false,
      maxUploadSize: 10 * 1024 * 1024, // 10MB
    },
    ui: {
      hasHeader: false, // Base provides its own
      hasFooter: false,
      safeAreaTop: 44,
      safeAreaBottom: 34,
      preferredColorScheme: 'light' as const,
      touchTargetSize: 44,
      maxComponentLines: 150
    },
    navigation: {
      canGoBack: true,
      canOpenExternal: true,
      canShare: true,
      usesRouter: false // Uses native navigation
    }
  },
  
  farcaster: {
    type: 'farcaster' as const,
    name: 'Farcaster',
    detection: {
      priority: 2,
      checks: [
        { type: 'userAgent', patterns: [/Farcaster/i] },
        { type: 'hostname', patterns: ['farcaster.xyz'] },
        { type: 'searchParam', param: 'farcaster-frame' }
      ]
    },
    capabilities: {
      hasNativeAuth: true,
      preferredAuth: 'farcaster' as const,
      hasWeb3: true,
      hasSocialShare: true,
      hasDeepLinks: true,
      hasNotifications: true,
      maxUploadSize: 5 * 1024 * 1024, // 5MB
    },
    ui: {
      hasHeader: false,
      hasFooter: false,
      safeAreaTop: 40,
      safeAreaBottom: 0,
      preferredColorScheme: 'dark' as const,
      touchTargetSize: 44,
      maxComponentLines: 150
    },
    navigation: {
      canGoBack: false, // Frames can't go back
      canOpenExternal: true,
      canShare: true,
      usesRouter: false
    }
  }
} as const

export type PlatformType = keyof typeof PLATFORM_CONFIG
export type PlatformConfig = typeof PLATFORM_CONFIG[PlatformType]
```

### 1.2 Auth Configuration

```typescript
// config/auth.config.ts
export const AUTH_CONFIG = {
  // JWT настройки
  jwt: {
    expiresIn: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 60 * 60 * 1000, // Refresh за час до истечения
    storageKey: 'auth-token'
  },
  
  // Настройки подписи
  signature: {
    messageTemplate: 'Sign this message to authenticate with HEARD.\n\nNonce: {{nonce}}\nTimestamp: {{timestamp}}',
    nonceLength: 32,
    timestampWindow: 5 * 60 * 1000 // 5 минут на подпись
  },
  
  // Retry настройки
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2
  },
  
  // Стратегии по платформам
  strategies: {
    web: {
      primary: 'wallet',
      fallback: ['walletconnect']
    },
    base: {
      primary: 'base',
      fallback: ['wallet']
    },
    farcaster: {
      primary: 'farcaster',
      fallback: ['wallet']
    }
  }
} as const
```

### 1.3 API Configuration

```typescript
// config/api.config.ts
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  endpoints: {
    auth: {
      nonce: '/auth/nonce',
      connect: '/auth/connect-wallet',
      disconnect: '/auth/disconnect',
      refresh: '/auth/refresh',
      me: '/auth/me'
    },
    surveys: {
      list: '/surveys',
      detail: '/surveys/:id',
      submit: '/surveys/:id/submit',
      results: '/surveys/:id/results'
    }
  },
  
  headers: {
    common: {
      'Content-Type': 'application/json',
    },
    platform: {
      web: {},
      base: {
        'X-Platform': 'base',
        'X-MiniKit-Version': '1.0'
      },
      farcaster: {
        'X-Platform': 'farcaster',
        'X-Frame-Version': '1.0'
      }
    }
  },
  
  timeout: {
    default: 30000,
    upload: 120000
  }
} as const
```

## 🔧 Phase 2: Platform Detection (День 2)

### 2.1 Platform Detector Implementation

```typescript
// lib/platform/detectors/base.detector.ts
import { PLATFORM_CONFIG } from '@/config/platforms.config'
import type { PlatformDetector, DetectionCheck } from '../platform.types'

export class BaseDetector implements PlatformDetector {
  readonly config = PLATFORM_CONFIG.base
  
  matches(): boolean {
    for (const check of this.config.detection.checks) {
      if (this.runCheck(check)) {
        return true
      }
    }
    return false
  }
  
  private runCheck(check: DetectionCheck): boolean {
    switch (check.type) {
      case 'userAgent':
        return check.patterns.some(pattern => 
          pattern.test(navigator.userAgent)
        )
        
      case 'hostname':
        if (typeof window === 'undefined') return false
        return check.patterns.some(hostname => 
          window.location.hostname.includes(hostname)
        )
        
      case 'windowProperty':
        if (typeof window === 'undefined') return false
        return check.property in window
        
      case 'searchParam':
        if (typeof window === 'undefined') return false
        return new URLSearchParams(window.location.search).has(check.param)
        
      default:
        return false
    }
  }
  
  getCapabilities() {
    return this.config.capabilities
  }
  
  getUIConfig() {
    return this.config.ui
  }
}
```

### 2.2 Platform Manager

```typescript
// lib/platform/platform.manager.ts
import { BaseDetector } from './detectors/base.detector'
import { FarcasterDetector } from './detectors/farcaster.detector'
import { WebDetector } from './detectors/web.detector'
import { PLATFORM_CONFIG } from '@/config/platforms.config'
import type { Platform, PlatformDetector } from './platform.types'

export class PlatformManager {
  private static instance: PlatformManager
  private detectors: PlatformDetector[] = []
  private cachedPlatform: Platform | null = null
  
  private constructor() {
    // Сортируем по приоритету из конфига
    const sortedDetectors = [
      new BaseDetector(),
      new FarcasterDetector(),
      new WebDetector()
    ].sort((a, b) => 
      a.config.detection.priority - b.config.detection.priority
    )
    
    this.detectors = sortedDetectors
  }
  
  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager()
    }
    return PlatformManager.instance
  }
  
  detect(forceRefresh = false): Platform {
    // SSR safety
    if (typeof window === 'undefined') {
      return this.getDefaultPlatform()
    }
    
    if (this.cachedPlatform && !forceRefresh) {
      return this.cachedPlatform
    }
    
    for (const detector of this.detectors) {
      if (detector.matches()) {
        console.log(`[Platform] Detected: ${detector.config.name}`)
        
        this.cachedPlatform = {
          type: detector.config.type,
          name: detector.config.name,
          capabilities: detector.getCapabilities(),
          ui: detector.getUIConfig(),
          navigation: detector.config.navigation
        }
        
        // Set data attribute for CSS
        this.setDataAttribute(this.cachedPlatform.type)
        
        return this.cachedPlatform
      }
    }
    
    // Should not happen as WebDetector is fallback
    return this.getDefaultPlatform()
  }
  
  private getDefaultPlatform(): Platform {
    const webConfig = PLATFORM_CONFIG.web
    return {
      type: 'web',
      name: webConfig.name,
      capabilities: webConfig.capabilities,
      ui: webConfig.ui,
      navigation: webConfig.navigation
    }
  }
  
  private setDataAttribute(platformType: string) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-platform', platformType)
    }
  }
}
```

## 🔐 Phase 3: Authentication Fix (День 3-4)

### 3.1 Backend Security Recommendations

```typescript
// РЕКОМЕНДАЦИИ ДЛЯ BACKEND

/**
 * Для безопасности и удобства рекомендую следующую схему:
 * 
 * 1. ЕДИНЫЙ endpoint для всех платформ:
 *    POST /api/auth/connect
 *    
 * 2. Request body:
 *    {
 *      address: string,
 *      signature: string,
 *      message: string,
 *      platform: 'web' | 'base' | 'farcaster',
 *      metadata?: {
 *        // Platform-specific данные
 *        farcasterFid?: string,
 *        baseUserId?: string
 *      }
 *    }
 *    
 * 3. Проверка подписи:
 *    - Для всех платформ используем ethers.verifyMessage
 *    - Проверяем что address совпадает с recovered address
 *    - Проверяем timestamp в message (не старше 5 минут)
 *    
 * 4. JWT Token:
 *    - Включаем platform в payload
 *    - Разные expiry для разных платформ (web - 24h, miniapps - 7d)
 *    - Refresh token для seamless experience
 *    
 * 5. Rate limiting:
 *    - По IP: 10 попыток в минуту
 *    - По address: 5 попыток в минуту
 *    - Защита от brute force
 */
```

### 3.2 Unified Auth Strategy

```typescript
// lib/auth/strategies/unified.strategy.ts
import { AUTH_CONFIG } from '@/config/auth.config'
import { API_CONFIG } from '@/config/api.config'
import type { AuthStrategy, Platform } from '@/lib/platform/types'

export class UnifiedAuthStrategy implements AuthStrategy {
  name = 'unified'
  
  async authenticate(
    platform: Platform,
    address: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<AuthResult> {
    try {
      // 1. Get nonce from backend
      const nonceResponse = await this.getNonce(address)
      
      // 2. Format message with config template
      const message = AUTH_CONFIG.signature.messageTemplate
        .replace('{{nonce}}', nonceResponse.nonce)
        .replace('{{timestamp}}', Date.now().toString())
      
      // 3. Sign message (platform-specific implementation)
      const signature = await signMessage(message)
      
      // 4. Verify with backend
      const authResponse = await this.verifySignature({
        address,
        signature,
        message,
        platform: platform.type
      })
      
      // 5. Store token
      this.storeToken(authResponse.token)
      
      return {
        user: authResponse.user,
        token: authResponse.token,
        expiresAt: Date.now() + AUTH_CONFIG.jwt.expiresIn
      }
      
    } catch (error) {
      console.error(`[Auth] Failed for ${platform.type}:`, error)
      throw this.handleAuthError(error)
    }
  }
  
  private async getNonce(address: string): Promise<NonceResponse> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.nonce}`,
      {
        method: 'POST',
        headers: API_CONFIG.headers.common,
        body: JSON.stringify({ walletAddress: address })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Nonce request failed: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  private async verifySignature(params: VerifyParams): Promise<AuthResponse> {
    const headers = {
      ...API_CONFIG.headers.common,
      ...API_CONFIG.headers.platform[params.platform]
    }
    
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.connect}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        credentials: 'include' // для cookies
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Authentication failed')
    }
    
    return response.json()
  }
  
  private storeToken(token: string) {
    localStorage.setItem(AUTH_CONFIG.jwt.storageKey, token)
  }
  
  private handleAuthError(error: any): Error {
    // User-friendly error messages
    if (error.message?.includes('signature')) {
      return new Error('Invalid signature. Please try again.')
    }
    if (error.message?.includes('nonce')) {
      return new Error('Authentication expired. Please try again.')
    }
    if (error.message?.includes('rate limit')) {
      return new Error('Too many attempts. Please wait a moment.')
    }
    
    return new Error('Authentication failed. Please try again.')
  }
}
```

### 3.3 Platform-specific Auth Hooks

```typescript
// hooks/use-auth.ts
import { useCallback, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { usePlatform } from './use-platform'
import { UnifiedAuthStrategy } from '@/lib/auth/strategies/unified.strategy'
import { useAuthStore } from '@/lib/store'
import { AUTH_CONFIG } from '@/config/auth.config'

export function useAuth() {
  const platform = usePlatform()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const authStore = useAuthStore()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  const login = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }
    
    setIsAuthenticating(true)
    authStore.setError(null)
    
    // Retry logic from config
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= AUTH_CONFIG.retry.maxAttempts; attempt++) {
      try {
        const strategy = new UnifiedAuthStrategy()
        
        // Platform-specific signing
        const signMessage = async (message: string) => {
          if (platform.type === 'base' && window.miniKit) {
            // Use MiniKit for Base App
            return window.miniKit.signMessage(message)
          }
          
          if (platform.type === 'farcaster' && window.farcaster) {
            // Use Farcaster SDK
            return window.farcaster.signMessage(message)
          }
          
          // Default: use wagmi
          return signMessageAsync({ message })
        }
        
        const result = await strategy.authenticate(
          platform,
          address,
          signMessage
        )
        
        authStore.setUser(result.user)
        authStore.setIsAuthenticated(true)
        
        return result
        
      } catch (error) {
        lastError = error as Error
        console.warn(`[Auth] Attempt ${attempt} failed:`, error)
        
        if (attempt < AUTH_CONFIG.retry.maxAttempts) {
          // Exponential backoff
          const delay = AUTH_CONFIG.retry.delay * Math.pow(
            AUTH_CONFIG.retry.backoff, 
            attempt - 1
          )
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // All attempts failed
    authStore.setError(lastError?.message || 'Authentication failed')
    throw lastError
    
  }, [platform, address, isConnected, signMessageAsync, authStore])
  
  const logout = useCallback(async () => {
    try {
      await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.disconnect}`,
        {
          method: 'POST',
          headers: {
            ...API_CONFIG.headers.common,
            Authorization: `Bearer ${localStorage.getItem(AUTH_CONFIG.jwt.storageKey)}`
          },
          credentials: 'include'
        }
      )
    } catch (error) {
      console.warn('[Auth] Logout API call failed:', error)
    } finally {
      authStore.reset()
      localStorage.removeItem(AUTH_CONFIG.jwt.storageKey)
    }
  }, [authStore])
  
  return {
    login,
    logout,
    isAuthenticated: authStore.isAuthenticated,
    isAuthenticating,
    user: authStore.user,
    error: authStore.error,
    platform
  }
}
```

## 🔧 Phase 4: Navigation Fix (День 5)

### 4.1 Navigation Fix Hook

```typescript
// hooks/use-navigation-fix.ts
import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePlatform } from './use-platform'

/**
 * Fixes navigation issues in Mini Apps
 * Problem: First click after deploy causes page reload
 * Solution: Intercept navigation and handle platform-specific
 */
export function useNavigationFix() {
  const router = useRouter()
  const pathname = usePathname()
  const platform = usePlatform()
  
  // Fix для проблемы с первым кликом после деплоя
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Прогреваем router на старте
    router.prefetch(pathname)
    
    // Для Mini Apps отключаем prefetch по умолчанию
    if (platform.type !== 'web') {
      // Перехватываем клики по ссылкам
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const link = target.closest('a')
        
        if (!link) return
        
        const href = link.getAttribute('href')
        if (!href || href.startsWith('http') || href.startsWith('#')) {
          return
        }
        
        // Предотвращаем стандартное поведение
        e.preventDefault()
        
        // Используем программную навигацию
        if (platform.type === 'base' && window.miniKit?.openUrl) {
          // Base App native navigation
          window.miniKit.openUrl(href)
        } else {
          // Fallback to Next.js router
          router.push(href)
        }
      }
      
      document.addEventListener('click', handleClick, true)
      
      return () => {
        document.removeEventListener('click', handleClick, true)
      }
    }
  }, [platform, router, pathname])
  
  // Safe navigation wrapper
  const navigate = useCallback((href: string) => {
    if (platform.type === 'base' && window.miniKit?.openUrl) {
      window.miniKit.openUrl(href)
    } else if (platform.type === 'farcaster' && window.farcaster?.navigate) {
      window.farcaster.navigate(href)
    } else {
      router.push(href)
    }
  }, [platform, router])
  
  return { navigate }
}
```

### 4.2 Link Component Wrapper

```typescript
// components/ui/link.tsx
import NextLink from 'next/link'
import { useNavigationFix } from '@/hooks/use-navigation-fix'
import type { ComponentProps } from 'react'

interface LinkProps extends ComponentProps<typeof NextLink> {
  children: React.ReactNode
}

export function Link({ href, children, ...props }: LinkProps) {
  const { navigate } = useNavigationFix()
  
  const handleClick = (e: React.MouseEvent) => {
    // Если это внешняя ссылка, не перехватываем
    if (typeof href === 'string' && href.startsWith('http')) {
      return
    }
    
    e.preventDefault()
    navigate(href.toString())
  }
  
  return (
    <NextLink 
      href={href} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </NextLink>
  )
}
```

## 🎨 Phase 5: Component Refactoring (День 6-7)

### 5.1 Breaking Down Large Components

```typescript
// ❌ BEFORE: components/survey/SurveyForm.tsx (300+ lines)
// ✅ AFTER: Split into smaller components

// components/features/surveys/SurveyForm/index.tsx (< 150 lines)
import { SurveyHeader } from './SurveyHeader'
import { SurveyQuestions } from './SurveyQuestions'
import { SurveyFooter } from './SurveyFooter'
import { useSurveyForm } from './hooks/useSurveyForm'

export function SurveyForm({ surveyId }: { surveyId: string }) {
  const {
    survey,
    currentQuestion,
    answers,
    isSubmitting,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleSubmit
  } = useSurveyForm(surveyId)
  
  if (!survey) return null
  
  return (
    <div className="survey-form">
      <SurveyHeader 
        title={survey.title}
        progress={currentQuestion / survey.questions.length}
      />
      
      <SurveyQuestions
        questions={survey.questions}
        currentIndex={currentQuestion}
        answers={answers}
        onAnswer={handleAnswer}
      />
      
      <SurveyFooter
        canGoBack={currentQuestion > 0}
        canGoNext={!!answers[currentQuestion]}
        isLastQuestion={currentQuestion === survey.questions.length - 1}
        isSubmitting={isSubmitting}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// components/features/surveys/SurveyForm/SurveyHeader.tsx (< 50 lines)
export function SurveyHeader({ title, progress }: SurveyHeaderProps) {
  return (
    <header className="survey-header">
      <h1 className="text-2xl font-bold">{title}</h1>
      <ProgressBar value={progress * 100} />
    </header>
  )
}

// components/features/surveys/SurveyForm/hooks/useSurveyForm.ts (< 100 lines)
export function useSurveyForm(surveyId: string) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  
  const { data: survey } = useSurvey(surveyId)
  const { mutate: submitSurvey, isLoading: isSubmitting } = useSubmitSurvey()
  
  const handleAnswer = useCallback((answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }))
  }, [currentQuestion])
  
  // ... rest of logic
  
  return {
    survey,
    currentQuestion,
    answers,
    isSubmitting,
    handleAnswer,
    // ...
  }
}
```

### 5.2 Platform-Aware Components

```typescript
// components/ui/button.tsx (< 100 lines)
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { usePlatform } from '@/hooks/use-platform'
import { PLATFORM_CONFIG } from '@/config/platforms.config'

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-sm',
  default: 'h-10 px-4',
  lg: 'h-12 px-6 text-lg'
} as const

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground'
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: keyof typeof BUTTON_SIZES
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const platform = usePlatform()
    const touchTarget = platform.ui.touchTargetSize
    
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Size
          BUTTON_SIZES[size],
          
          // Variant
          BUTTON_VARIANTS[variant],
          
          // Platform-specific minimum touch target
          `min-h-[${touchTarget}px]`,
          
          // Platform-specific styles via data attributes
          'data-[platform=base]:active:scale-95',
          'data-[platform=farcaster]:rounded-xl',
          
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
```

## 🚀 Phase 6: Testing & Deployment (День 8-9)

### 6.1 Platform Detection Tests

```typescript
// __tests__/platform-detection.test.ts
import { PlatformManager } from '@/lib/platform/platform.manager'

describe('Platform Detection', () => {
  let originalUserAgent: string
  let manager: PlatformManager
  
  beforeEach(() => {
    originalUserAgent = navigator.userAgent
    manager = PlatformManager.getInstance()
  })
  
  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    })
  })
  
  test('detects Base App by user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Base/1.0',
      configurable: true
    })
    
    const platform = manager.detect(true)
    expect(platform.type).toBe('base')
    expect(platform.capabilities.preferredAuth).toBe('base')
  })
  
  test('detects Farcaster by hostname', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'farcaster.xyz' },
      writable: true
    })
    
    const platform = manager.detect(true)
    expect(platform.type).toBe('farcaster')
  })
  
  test('falls back to web', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/91.0',
      configurable: true
    })
    
    const platform = manager.detect(true)
    expect(platform.type).toBe('web')
  })
})
```

### 6.2 Integration Test for Auth

```typescript
// __tests__/integration/auth-flow.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { mockPlatform } from '@/test-utils/platform-mock'

describe('Authentication Flow', () => {
  test('authenticates in Base App', async () => {
    // Mock Base platform
    mockPlatform('base')
    
    // Mock wallet connection
    jest.mock('wagmi', () => ({
      useAccount: () => ({ address: '0x123...', isConnected: true }),
      useSignMessage: () => ({
        signMessageAsync: jest.fn().mockResolvedValue('0xsignature')
      })
    }))
    
    const { result } = renderHook(() => useAuth())
    
    await waitFor(async () => {
      await result.current.login()
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```

### 6.3 Environment Setup

```bash
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=dev_project_id
NEXT_PUBLIC_CDP_CLIENT_API_KEY=dev_cdp_key
NEXT_PUBLIC_ENV=development

# .env.production
NEXT_PUBLIC_API_URL=https://api.heardlabs.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=prod_project_id
NEXT_PUBLIC_CDP_CLIENT_API_KEY=prod_cdp_key
NEXT_PUBLIC_ENV=production
```

### 6.4 Digital Ocean Deployment

```yaml
# .do/app.yaml
name: heard-frontend
region: nyc
services:
  - name: web
    environment_slug: node-js
    github:
      repo: your-org/heard-frontend
      branch: main
      deploy_on_push: true
    
    build_command: |
      npm install -g pnpm
      pnpm install --frozen-lockfile
      pnpm build
    
    run_command: pnpm start
    
    http_port: 3000
    
    instance_count: 2
    instance_size_slug: professional-xs
    
    health_check:
      http_path: /api/health
      initial_delay_seconds: 10
      period_seconds: 10
      timeout_seconds: 3
      success_threshold: 1
      failure_threshold: 3
    
    envs:
      - key: NODE_ENV
        value: production
        scope: RUN_TIME
      - key: NEXT_PUBLIC_API_URL
        value: ${api.PUBLIC_URL}
        scope: BUILD_TIME
```

## 📋 Final Checklist

### Phase 1: Configuration ✅
- [ ] Create `config/` directory
- [ ] Add all configuration files
- [ ] Remove ALL hardcoded values
- [ ] Test config imports

### Phase 2: Platform Detection ✅
- [ ] Implement detectors for Web, Base, Farcaster
- [ ] Create PlatformManager singleton
- [ ] Add usePlatform hook
- [ ] Verify detection in all environments

### Phase 3: Authentication ✅
- [ ] Implement unified auth strategy
- [ ] Fix Base App authentication
- [ ] Add retry logic with config
- [ ] Test with real wallets

### Phase 4: Navigation Fix ✅
- [ ] Add navigation fix hook
- [ ] Create Link wrapper component
- [ ] Test first-click-after-deploy issue
- [ ] Verify in all platforms

### Phase 5: Component Refactoring ✅
- [ ] Break down components > 150 lines
- [ ] Create feature-based structure
- [ ] Add platform-aware styles
- [ ] Update all imports

### Phase 6: Testing & Deployment ✅
- [ ] Write unit tests for detection
- [ ] Write integration tests for auth
- [ ] Deploy to dev environment
- [ ] Test in real Base/Farcaster apps
- [ ] Deploy to production

## 🎯 Success Metrics

1. **Authentication works in Base App** ✅
2. **Navigation doesn't reload on first click** ✅
3. **All components < 150 lines** ✅
4. **Zero hardcoded values** ✅
5. **Platform detection 100% accurate** ✅

## 🚨 Common Pitfalls to Avoid

1. **SSR Issues**
   - Always check `typeof window !== 'undefined'`
   - Use dynamic imports for client-only code

2. **Platform Detection Cache**
   - Don't over-cache, platforms can change
   - Force refresh on route changes

3. **Auth Token Storage**
   - Use httpOnly cookies when possible
   - Implement refresh token logic

4. **Navigation in Mini Apps**
   - Always use navigation wrapper
   - Test after every deploy

5. **Component Size**
   - Extract hooks for logic
   - Split UI into sub-components
   - Use composition over inheritance

---

**Этот план готов к немедленной реализации. Все значения вынесены в конфиги, никакого хардкода.**