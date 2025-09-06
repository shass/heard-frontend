# 📘 HEARD Multiplatform Implementation Plan

## 🎯 Цель документа

Пошаговая инструкция для реализации multiplatform архитектуры HEARD. План написан так, чтобы любой разработчик мог следовать ему без дополнительных вопросов.

## 📊 Исходное состояние

### Что есть сейчас:
- Next.js 15 приложение с App Router
- Wagmi + RainbowKit для Web3
- MiniKit SDK установлен и частично настроен
- Zustand для state management
- shadcn/ui компоненты
- Backend API готов принимать wallet signatures

### Проблемы:
- Аутентификация не работает в Base App
- Нет адаптации UI под разные платформы
- Отсутствует детекция платформы
- Компоненты не оптимизированы для mobile

## 🔄 План реализации

### **Phase 0: Подготовка окружения (День 1)**

#### 0.1 Создание веток и бэкапов

```bash
# Создать ветку для рефакторинга
git checkout -b feature/multiplatform-architecture

# Создать бэкап текущего состояния
git tag backup/before-multiplatform

# Создать структуру веток для параллельной работы
git checkout -b feature/platform-detection
git checkout -b feature/auth-strategies
git checkout -b feature/ui-adaptation
```

#### 0.2 Установка зависимостей

```bash
# Обновить существующие пакеты
pnpm update @coinbase/onchainkit@latest
pnpm update @rainbow-me/rainbowkit@latest
pnpm update wagmi@latest viem@latest

# Добавить новые зависимости
pnpm add clsx tailwind-merge # для cn() utility
pnpm add @tanstack/react-query # уже должен быть
```

#### 0.3 Настройка TypeScript paths

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*", "./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/features/*": ["./components/features/*"],
      "@/ui/*": ["./components/ui/*"]
    }
  }
}
```

### **Phase 1: Platform Detection System (День 2-3)**

#### 1.1 Создание типов платформы

```typescript
// lib/platform/types.ts
export type PlatformType = 'web' | 'base' | 'farcaster' | 'telegram'

export interface PlatformCapabilities {
  hasNativeAuth: boolean
  preferredAuth: 'wallet' | 'base' | 'farcaster' | 'telegram'
  hasWeb3: boolean
  hasSocialShare: boolean
  hasDeepLinks: boolean
  hasNotifications: boolean
  hasCamera: boolean
  maxUploadSize: number
  ui: {
    hasHeader: boolean
    hasFooter: boolean
    safeAreaTop: number
    safeAreaBottom: number
    preferredColorScheme: 'light' | 'dark' | 'auto'
  }
  navigation: {
    canGoBack: boolean
    canOpenExternal: boolean
    canShare: boolean
  }
}

export interface Platform {
  type: PlatformType
  capabilities: PlatformCapabilities
  constraints?: PlatformConstraints
}

export interface PlatformConstraints {
  maxBundleSize?: number
  requiredPermissions?: string[]
  blockedAPIs?: string[]
}
```

#### 1.2 Создание детекторов

```typescript
// lib/platform/detectors/base.detector.ts
import { PlatformDetector } from '../types'

export class BaseDetector implements PlatformDetector {
  matches(): boolean {
    // Проверка 1: User Agent
    if (/Base|Farcaster|Warpcast/i.test(navigator.userAgent)) {
      return true
    }
    
    // Проверка 2: Hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname.includes('base.org') || 
          hostname.includes('warpcast.com')) {
        return true
      }
    }
    
    // Проверка 3: MiniKit доступность
    if (typeof window !== 'undefined' && 'miniKit' in window) {
      return true
    }
    
    return false
  }
  
  getCapabilities(): PlatformCapabilities {
    return {
      hasNativeAuth: true,
      preferredAuth: 'base',
      hasWeb3: true,
      hasSocialShare: true,
      hasDeepLinks: true,
      hasNotifications: false,
      hasCamera: false,
      maxUploadSize: 10 * 1024 * 1024,
      ui: {
        hasHeader: false,
        hasFooter: false,
        safeAreaTop: 44,
        safeAreaBottom: 34,
        preferredColorScheme: 'light'
      },
      navigation: {
        canGoBack: true,
        canOpenExternal: true,
        canShare: true
      }
    }
  }
}
```

```typescript
// lib/platform/detectors/farcaster.detector.ts
export class FarcasterDetector implements PlatformDetector {
  matches(): boolean {
    // Специфичная проверка для Farcaster
    if (typeof window !== 'undefined') {
      // Проверка Farcaster Frame
      if (window.location.search.includes('farcaster-frame')) {
        return true
      }
      
      // Проверка parent frame
      try {
        if (window.parent !== window && 
            window.parent.location.hostname.includes('farcaster')) {
          return true
        }
      } catch (e) {
        // Cross-origin frame, возможно Farcaster
      }
    }
    
    return false
  }
  
  getCapabilities(): PlatformCapabilities {
    // Похоже на Base, но с некоторыми отличиями
    return {
      hasNativeAuth: true,
      preferredAuth: 'farcaster',
      hasWeb3: true,
      hasSocialShare: true,
      hasDeepLinks: true,
      hasNotifications: true, // Farcaster поддерживает notifications
      hasCamera: false,
      maxUploadSize: 5 * 1024 * 1024,
      ui: {
        hasHeader: false,
        hasFooter: false,
        safeAreaTop: 40,
        safeAreaBottom: 0,
        preferredColorScheme: 'dark'
      },
      navigation: {
        canGoBack: false, // В frames нельзя назад
        canOpenExternal: true,
        canShare: true
      }
    }
  }
}
```

```typescript
// lib/platform/detectors/telegram.detector.ts
export class TelegramDetector implements PlatformDetector {
  matches(): boolean {
    // Telegram Web App detection
    return typeof window !== 'undefined' && 
           window.Telegram?.WebApp !== undefined
  }
  
  getCapabilities(): PlatformCapabilities {
    const tg = window.Telegram?.WebApp
    
    return {
      hasNativeAuth: false, // Используем TON Connect
      preferredAuth: 'wallet', // через TON Connect
      hasWeb3: true,
      hasSocialShare: false, // Нет native share
      hasDeepLinks: true,
      hasNotifications: false,
      hasCamera: true, // Через Telegram API
      maxUploadSize: 50 * 1024 * 1024,
      ui: {
        hasHeader: false, // Telegram показывает свой
        hasFooter: false,
        safeAreaTop: 0,
        safeAreaBottom: tg?.viewportStableHeight ? 
          window.innerHeight - tg.viewportStableHeight : 0,
        preferredColorScheme: tg?.colorScheme || 'light'
      },
      navigation: {
        canGoBack: true, // Через BackButton API
        canOpenExternal: true,
        canShare: false
      }
    }
  }
}
```

#### 1.3 Platform Manager

```typescript
// lib/platform/platform.manager.ts
import { BaseDetector } from './detectors/base.detector'
import { FarcasterDetector } from './detectors/farcaster.detector'
import { TelegramDetector } from './detectors/telegram.detector'
import { WebDetector } from './detectors/web.detector'

export class PlatformManager {
  private static instance: PlatformManager
  private detectors: PlatformDetector[] = []
  private cachedPlatform: Platform | null = null
  
  private constructor() {
    // Порядок важен! Более специфичные детекторы первые
    this.detectors = [
      new TelegramDetector(),
      new FarcasterDetector(), 
      new BaseDetector(),
      new WebDetector() // Fallback
    ]
  }
  
  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager()
    }
    return PlatformManager.instance
  }
  
  detect(forceRefresh = false): Platform {
    if (this.cachedPlatform && !forceRefresh) {
      return this.cachedPlatform
    }
    
    for (const detector of this.detectors) {
      if (detector.matches()) {
        console.log(`Platform detected: ${detector.constructor.name}`)
        
        this.cachedPlatform = {
          type: detector.type,
          capabilities: detector.getCapabilities(),
          constraints: detector.getConstraints?.()
        }
        
        // Добавляем data-атрибут для CSS
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute(
            'data-platform', 
            this.cachedPlatform.type
          )
        }
        
        return this.cachedPlatform
      }
    }
    
    // Не должно произойти, т.к. WebDetector - fallback
    throw new Error('No platform detected')
  }
  
  // Для тестирования
  mockPlatform(platform: Platform) {
    this.cachedPlatform = platform
    document.documentElement.setAttribute('data-platform', platform.type)
  }
}
```

#### 1.4 React Hook для платформы

```typescript
// hooks/use-platform.ts
import { useEffect, useState } from 'react'
import { PlatformManager } from '@/lib/platform/platform.manager'
import type { Platform } from '@/lib/platform/types'

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') {
      return {
        type: 'web',
        capabilities: DEFAULT_WEB_CAPABILITIES
      }
    }
    
    return PlatformManager.getInstance().detect()
  })
  
  useEffect(() => {
    // Re-detect on client
    const detected = PlatformManager.getInstance().detect(true)
    setPlatform(detected)
    
    // Listen for navigation changes (SPA)
    const handleRouteChange = () => {
      const newPlatform = PlatformManager.getInstance().detect(true)
      if (newPlatform.type !== platform.type) {
        setPlatform(newPlatform)
      }
    }
    
    // Next.js router events
    if (window.next?.router) {
      window.next.router.events.on('routeChangeComplete', handleRouteChange)
      
      return () => {
        window.next.router.events.off('routeChangeComplete', handleRouteChange)
      }
    }
  }, [])
  
  return platform
}
```

### **Phase 2: Authentication Strategies (День 4-5)**

#### 2.1 Базовый интерфейс стратегии

```typescript
// lib/auth/strategies/auth.strategy.ts
export interface AuthStrategy {
  name: string
  isAvailable(platform: Platform): boolean
  authenticate(params?: AuthParams): Promise<AuthResult>
  disconnect(): Promise<void>
}

export interface AuthParams {
  address?: string
  message?: string
  signature?: string
}

export interface AuthResult {
  user: User
  token: string
  expiresAt: number
}
```

#### 2.2 Wallet Strategy (RainbowKit)

```typescript
// lib/auth/strategies/wallet.strategy.ts
import { useAccount, useSignMessage } from 'wagmi'
import { authApi } from '@/lib/api/auth'

export class WalletStrategy implements AuthStrategy {
  name = 'wallet'
  
  isAvailable(platform: Platform): boolean {
    return platform.capabilities.hasWeb3
  }
  
  async authenticate(params?: AuthParams): Promise<AuthResult> {
    // Это будет вызываться из React компонента с хуками
    if (!params?.address) {
      throw new Error('Wallet not connected')
    }
    
    // 1. Получаем nonce
    const { message, jwtToken } = await authApi.getNonce(params.address)
    
    // 2. Подписываем (signature придет из компонента)
    if (!params.signature) {
      throw new Error('Message not signed')
    }
    
    // 3. Верифицируем на backend
    const result = await authApi.connectWallet({
      walletAddress: params.address,
      signature: params.signature,
      message,
      jwtToken
    })
    
    return {
      user: result.user,
      token: result.token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    }
  }
  
  async disconnect(): Promise<void> {
    await authApi.disconnect()
  }
}
```

#### 2.3 Base Strategy (MiniKit)

```typescript
// lib/auth/strategies/base.strategy.ts
export class BaseStrategy implements AuthStrategy {
  name = 'base'
  
  isAvailable(platform: Platform): boolean {
    return platform.type === 'base' && 
           platform.capabilities.hasNativeAuth
  }
  
  async authenticate(params?: AuthParams): Promise<AuthResult> {
    // Для Base используем тот же wallet flow
    // но через MiniKit SDK
    
    if (!params?.address) {
      throw new Error('Wallet not connected in Base App')
    }
    
    // Используем MiniKit для подписи
    // MiniKit автоматически обработает подпись в Base App контексте
    
    // Далее тот же flow что и WalletStrategy
    const { message, jwtToken } = await authApi.getNonce(params.address)
    
    if (!params.signature) {
      throw new Error('Message not signed in Base App')
    }
    
    const result = await authApi.connectWallet({
      walletAddress: params.address,
      signature: params.signature,
      message,
      jwtToken
    })
    
    return {
      user: result.user,
      token: result.token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    }
  }
  
  async disconnect(): Promise<void> {
    await authApi.disconnect()
  }
}
```

#### 2.4 Auth Manager

```typescript
// lib/auth/auth.manager.ts
import { WalletStrategy } from './strategies/wallet.strategy'
import { BaseStrategy } from './strategies/base.strategy'
import { FarcasterStrategy } from './strategies/farcaster.strategy'

export class AuthManager {
  private static instance: AuthManager
  private strategies = new Map<string, AuthStrategy>()
  private currentStrategy: AuthStrategy | null = null
  
  private constructor() {
    this.registerStrategy(new WalletStrategy())
    this.registerStrategy(new BaseStrategy())
    this.registerStrategy(new FarcasterStrategy())
  }
  
  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }
  
  registerStrategy(strategy: AuthStrategy) {
    this.strategies.set(strategy.name, strategy)
  }
  
  getAvailableStrategies(platform: Platform): AuthStrategy[] {
    const available: AuthStrategy[] = []
    
    for (const strategy of this.strategies.values()) {
      if (strategy.isAvailable(platform)) {
        available.push(strategy)
      }
    }
    
    // Сортируем по приоритету платформы
    return available.sort((a, b) => {
      if (a.name === platform.capabilities.preferredAuth) return -1
      if (b.name === platform.capabilities.preferredAuth) return 1
      return 0
    })
  }
  
  async authenticate(
    platform: Platform, 
    params?: AuthParams
  ): Promise<AuthResult> {
    const strategies = this.getAvailableStrategies(platform)
    
    if (strategies.length === 0) {
      throw new Error('No authentication methods available')
    }
    
    // Пробуем стратегии по порядку
    const errors: Error[] = []
    
    for (const strategy of strategies) {
      try {
        console.log(`Trying auth strategy: ${strategy.name}`)
        const result = await strategy.authenticate(params)
        this.currentStrategy = strategy
        return result
      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed:`, error)
        errors.push(error as Error)
      }
    }
    
    throw new Error(
      `All authentication strategies failed: ${
        errors.map(e => e.message).join(', ')
      }`
    )
  }
  
  async disconnect(): Promise<void> {
    if (this.currentStrategy) {
      await this.currentStrategy.disconnect()
      this.currentStrategy = null
    }
  }
}
```

#### 2.5 React Hook для аутентификации

```typescript
// hooks/use-auth.ts
import { useCallback, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { usePlatform } from './use-platform'
import { AuthManager } from '@/lib/auth/auth.manager'
import { useAuthStore } from '@/lib/store'

export function useAuth() {
  const platform = usePlatform()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { setUser, setLoading, setError, user, isAuthenticated } = useAuthStore()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  const login = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    setIsAuthenticating(true)
    setLoading(true)
    setError(null)
    
    try {
      const authManager = AuthManager.getInstance()
      
      // Для wallet-based стратегий нужна подпись
      let signature: string | undefined
      
      // Получаем nonce для подписи
      const { message } = await authApi.getNonce(address)
      
      // Подписываем сообщение
      // В Base/Farcaster это может быть обработано их SDK
      if (platform.type === 'web' || !platform.capabilities.hasNativeAuth) {
        // Используем wagmi для подписи
        signature = await signMessageAsync({ message })
      } else {
        // Platform-specific signing
        // Для Base/Farcaster SDK сами обработают
        signature = await signMessageAsync({ message })
      }
      
      // Аутентифицируемся
      const result = await authManager.authenticate(platform, {
        address,
        message,
        signature
      })
      
      // Сохраняем результат
      setUser(result.user)
      localStorage.setItem('auth-token', result.token)
      
      return result
    } catch (error) {
      console.error('Authentication failed:', error)
      setError(error.message)
      throw error
    } finally {
      setIsAuthenticating(false)
      setLoading(false)
    }
  }, [platform, address, isConnected, signMessageAsync, setUser, setLoading, setError])
  
  const logout = useCallback(async () => {
    try {
      const authManager = AuthManager.getInstance()
      await authManager.disconnect()
    } catch (error) {
      console.warn('Logout failed:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('auth-token')
    }
  }, [setUser])
  
  return {
    login,
    logout,
    isAuthenticated,
    isAuthenticating,
    user,
    platform
  }
}
```

### **Phase 3: UI Components Adaptation (День 6-7)**

#### 3.1 Умная кнопка аутентификации

```typescript
// components/features/auth/AuthButton.tsx
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Loader2, Wallet } from 'lucide-react'

export function AuthButton() {
  const { platform, login, isAuthenticating } = useAuth()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  
  // Если кошелек не подключен
  if (!isConnected) {
    return (
      <Button 
        onClick={openConnectModal}
        variant="primary"
        size={platform.type === 'web' ? 'default' : 'sm'}
        className={cn(
          'gap-2',
          // Platform-specific styles
          platform.type === 'base' && 'min-h-[44px]', // iOS touch target
          platform.type === 'telegram' && 'w-full' // Full width in TG
        )}
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }
  
  // Кошелек подключен, нужна аутентификация
  return (
    <Button
      onClick={login}
      disabled={isAuthenticating}
      variant="primary"
      size={platform.type === 'web' ? 'default' : 'sm'}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Sign & Start
        </>
      )}
    </Button>
  )
}
```

#### 3.2 Адаптивный Layout

```typescript
// components/features/layout/AppLayout.tsx
import { Header } from './Header'
import { Footer } from './Footer'
import { usePlatform } from '@/hooks/use-platform'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

export function AppLayout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: AppLayoutProps) {
  const platform = usePlatform()
  
  // Платформа контролирует header/footer
  const shouldShowHeader = showHeader && platform.capabilities.ui.hasHeader
  const shouldShowFooter = showFooter && platform.capabilities.ui.hasFooter
  
  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowHeader && <Header />}
      
      <main 
        className={cn(
          'flex-1',
          // Safe areas для mobile
          platform.capabilities.ui.safeAreaTop && 
            `pt-[${platform.capabilities.ui.safeAreaTop}px]`,
          platform.capabilities.ui.safeAreaBottom && 
            `pb-[${platform.capabilities.ui.safeAreaBottom}px]`,
          // Platform-specific padding
          'platform-base:px-4',
          'platform-telegram:px-0',
          'platform-web:container platform-web:mx-auto'
        )}
      >
        {children}
      </main>
      
      {shouldShowFooter && <Footer />}
    </div>
  )
}
```

#### 3.3 Platform-aware компоненты

```typescript
// components/ui/button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { usePlatform } from '@/hooks/use-platform'

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const platform = usePlatform()
    
    // Адаптируем размер под платформу
    const adaptiveSize = (() => {
      if (platform.type === 'telegram') return 'lg' // Крупнее для Telegram
      if (platform.type === 'base') return size === 'sm' ? 'default' : size
      return size
    })()
    
    return (
      <button
        ref={ref}
        className={cn(
          // Базовые стили
          'inline-flex items-center justify-center rounded-md font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Размеры
          adaptiveSize === 'sm' && 'h-9 px-3 text-sm',
          adaptiveSize === 'default' && 'h-10 px-4 py-2',
          adaptiveSize === 'lg' && 'h-11 px-8 text-lg',
          
          // Варианты
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          
          // Platform-specific
          platform.type === 'base' && 'min-h-[44px] active:scale-95',
          platform.type === 'telegram' && 'min-h-[48px] rounded-lg',
          platform.type === 'web' && 'hover:shadow-md',
          
          className
        )}
        {...props}
      />
    )
  }
)
```

### **Phase 4: Testing & Migration (День 8-9)**

#### 4.1 Тестовые сценарии

```typescript
// __tests__/platform-detection.test.ts
import { PlatformManager } from '@/lib/platform/platform.manager'

describe('Platform Detection', () => {
  let manager: PlatformManager
  
  beforeEach(() => {
    manager = PlatformManager.getInstance()
  })
  
  test('detects Base App', () => {
    // Mock Base environment
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Base/1.0',
      configurable: true
    })
    
    const platform = manager.detect(true)
    expect(platform.type).toBe('base')
    expect(platform.capabilities.hasNativeAuth).toBe(true)
  })
  
  test('detects Telegram Web App', () => {
    // Mock Telegram
    window.Telegram = {
      WebApp: {
        initData: 'test',
        version: '6.0'
      }
    }
    
    const platform = manager.detect(true)
    expect(platform.type).toBe('telegram')
  })
  
  test('falls back to web', () => {
    // Clean environment
    delete window.Telegram
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0',
      configurable: true
    })
    
    const platform = manager.detect(true)
    expect(platform.type).toBe('web')
  })
})
```

#### 4.2 Миграция существующих компонентов

```bash
# Скрипт для автоматической миграции
# scripts/migrate-components.js

const fs = require('fs')
const path = require('path')

// 1. Найти все компоненты использующие useAuth
const files = glob.sync('components/**/*.tsx')

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  
  // Заменить старые импорты
  content = content.replace(
    "import { useAuth } from '@/hooks/use-auth-old'",
    "import { useAuth } from '@/hooks/use-auth'"
  )
  
  // Добавить platform detection где нужно
  if (content.includes('className=')) {
    // Добавить импорт
    if (!content.includes('usePlatform')) {
      content = "import { usePlatform } from '@/hooks/use-platform'\n" + content
    }
  }
  
  fs.writeFileSync(file, content)
})
```

### **Phase 5: Deployment & Monitoring (День 10)**

#### 5.1 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_NAME=HEARD
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CDP_CLIENT_API_KEY=your_cdp_key

# .env.production
NEXT_PUBLIC_APP_NAME=HEARD
NEXT_PUBLIC_API_URL=https://api.heardlabs.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=production_project_id
NEXT_PUBLIC_CDP_CLIENT_API_KEY=production_cdp_key
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

#### 5.2 Middleware для platform routing

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Определяем платформу
  let platform = 'web'
  if (/Telegram/i.test(userAgent)) platform = 'telegram'
  else if (/Base|Farcaster|Warpcast/i.test(userAgent)) platform = 'base'
  
  // Добавляем header для использования в приложении
  const response = NextResponse.next()
  response.headers.set('x-platform', platform)
  
  // Блокируем доступ к админке из mini apps
  if (platform !== 'web' && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

## 📝 Чеклист для каждого этапа

### ✅ Phase 0: Подготовка
- [ ] Создать backup ветку
- [ ] Обновить зависимости
- [ ] Настроить TypeScript paths
- [ ] Проверить работу текущего приложения

### ✅ Phase 1: Platform Detection
- [ ] Создать типы платформ
- [ ] Реализовать детекторы для каждой платформы
- [ ] Создать PlatformManager
- [ ] Добавить React hook usePlatform
- [ ] Протестировать детекцию

### ✅ Phase 2: Authentication
- [ ] Создать интерфейс AuthStrategy
- [ ] Реализовать WalletStrategy
- [ ] Реализовать BaseStrategy
- [ ] Реализовать FarcasterStrategy
- [ ] Создать AuthManager
- [ ] Обновить useAuth hook
- [ ] Протестировать аутентификацию

### ✅ Phase 3: UI Adaptation
- [ ] Обновить Button компонент
- [ ] Создать AppLayout
- [ ] Адаптировать Header/Footer
- [ ] Добавить platform-specific CSS
- [ ] Проверить на всех платформах

### ✅ Phase 4: Testing
- [ ] Unit тесты для детекторов
- [ ] Integration тесты для auth
- [ ] E2E тесты основных flow
- [ ] Проверка в реальных средах

### ✅ Phase 5: Deployment
- [ ] Настроить environment variables
- [ ] Добавить middleware
- [ ] Deploy на staging
- [ ] Тестирование в production-like среде
- [ ] Deploy на production

## 🚨 Важные моменты

1. **Всегда проверяйте SSR совместимость** - используйте `typeof window !== 'undefined'`
2. **Кешируйте результаты детекции** - платформа не меняется во время сессии
3. **Fallback стратегии** - всегда должен быть запасной вариант
4. **Логирование** - логируйте все попытки аутентификации
5. **Type safety** - используйте TypeScript строго

## 📊 Метрики для отслеживания

```typescript
// lib/analytics/platform-metrics.ts
export function trackPlatformMetrics(platform: Platform) {
  // Отправляем в аналитику
  analytics.track('platform_detected', {
    type: platform.type,
    hasNativeAuth: platform.capabilities.hasNativeAuth,
    preferredAuth: platform.capabilities.preferredAuth,
    timestamp: Date.now()
  })
}

export function trackAuthAttempt(
  platform: Platform, 
  strategy: string, 
  success: boolean
) {
  analytics.track('auth_attempt', {
    platform: platform.type,
    strategy,
    success,
    timestamp: Date.now()
  })
}
```

---

*Этот план должен позволить любому разработчику реализовать multiplatform архитектуру без дополнительных вопросов.*