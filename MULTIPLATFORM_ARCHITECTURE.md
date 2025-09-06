# 🌐 HEARD Multiplatform Architecture

## 📋 Executive Summary

Архитектура для работы приложения в различных средах (Base App, Farcaster, Web, Mobile) без конфликтов и дублирования кода.

**Принципы:**
- **Прогрессивное улучшение** - базовый функционал работает везде
- **Платформо-специфичные расширения** - не ломают основной функционал
- **Wallet-based аутентификация** - только через криптокошельки (разные методы для разных платформ)

## 🏗️ Рекомендуемая структура

```
heard-frontend/
├── app/
│   ├── layout.tsx                   # Root layout с определением платформы
│   ├── page.tsx                     # Главная страница
│   ├── surveys/
│   │   └── [id]/
│   │       ├── page.tsx             
│   │       ├── info/page.tsx        
│   │       └── reward/page.tsx      
│   └── admin/                       # Админка (скрыта в embedded apps)
│
├── components/
│   ├── features/                    # Функциональные компоненты
│   │   ├── surveys/
│   │   │   ├── SurveyList.tsx
│   │   │   ├── SurveyForm.tsx
│   │   │   └── SurveyResults.tsx
│   │   │
│   │   ├── auth/                    # Компоненты аутентификации
│   │   │   ├── AuthButton.tsx      # Умная кнопка входа
│   │   │   ├── WalletConnect.tsx   # RainbowKit для web
│   │   │   ├── FarcasterAuth.tsx   # Для Farcaster App (wallet-based)
│   │   │   └── BaseAuth.tsx        # Для Base App (wallet-based)
│   │   │
│   │   └── navigation/
│   │       ├── Header.tsx          # Адаптируется под платформу
│   │       └── Footer.tsx          
│   │
│   └── ui/                          # Базовые UI компоненты (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── hooks/
│   ├── use-platform.ts             # Определение платформы
│   ├── use-auth-strategy.ts        # Выбор метода аутентификации
│   └── use-feature-flags.ts        # Функции платформы
│
├── lib/
│   ├── auth/                       # Стратегии аутентификации
│   │   ├── strategies/
│   │   │   ├── wallet.strategy.ts  # MetaMask/RainbowKit
│   │   │   ├── farcaster.strategy.ts  # Farcaster wallet auth
│   │   │   └── base.strategy.ts    # Base wallet auth
│   │   │
│   │   ├── auth.manager.ts         # Orchestrator
│   │   └── auth.types.ts
│   │
│   ├── platform/                   # Платформо-специфичная логика
│   │   ├── detectors/
│   │   │   ├── base.detector.ts
│   │   │   ├── farcaster.detector.ts
│   │   │   └── browser.detector.ts
│   │   │
│   │   ├── capabilities/           # Возможности платформ
│   │   │   ├── base.capabilities.ts
│   │   │   ├── farcaster.capabilities.ts
│   │   │   └── web.capabilities.ts
│   │   │
│   │   └── platform.manager.ts
│   │
│   └── api/
│       └── client.ts                # Единый API клиент
```

## 🔐 Мультиплатформенная аутентификация

### **AuthButton - умный компонент**

```typescript
// components/features/auth/AuthButton.tsx
import { usePlatform } from '@/hooks/use-platform'
import { useAuthStrategy } from '@/hooks/use-auth-strategy'

export function AuthButton() {
  const platform = usePlatform()
  const { availableStrategies, preferredStrategy } = useAuthStrategy()
  
  // Показываем разные опции в зависимости от платформы
  if (platform.isBaseApp && platform.capabilities.hasNativeAuth) {
    return <BaseAuthButton />
  }
  
  if (platform.isFarcaster && platform.capabilities.hasFarcasterAuth) {
    return <FarcasterAuthButton />
  }
  
  // Fallback на универсальный wallet connect
  return <WalletConnectButton />
}
```

### **Platform Detection**

```typescript
// lib/platform/platform.manager.ts
export class PlatformManager {
  private detectors = [
    new BaseDetector(),
    new FarcasterDetector(),
    new BrowserDetector(),
  ]
  
  detect(): Platform {
    for (const detector of this.detectors) {
      if (detector.matches()) {
        return {
          type: detector.type,
          capabilities: detector.getCapabilities(),
          constraints: detector.getConstraints(),
        }
      }
    }
    
    return {
      type: 'web',
      capabilities: DEFAULT_WEB_CAPABILITIES,
      constraints: NO_CONSTRAINTS,
    }
  }
}

// hooks/use-platform.ts
export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>()
  
  useEffect(() => {
    const manager = new PlatformManager()
    setPlatform(manager.detect())
    
    // Re-detect on navigation changes
    const handleNavigate = () => setPlatform(manager.detect())
    window.addEventListener('popstate', handleNavigate)
    
    return () => window.removeEventListener('popstate', handleNavigate)
  }, [])
  
  return platform
}
```

### **Auth Strategy Pattern**

```typescript
// lib/auth/auth.manager.ts
export class AuthManager {
  private strategies = new Map<string, AuthStrategy>()
  
  constructor() {
    this.strategies.set('wallet', new WalletStrategy())
    this.strategies.set('farcaster', new FarcasterStrategy())
    this.strategies.set('base', new BaseStrategy())
  }
  
  async authenticate(platform: Platform): Promise<User> {
    // Выбираем стратегии для платформы
    const availableStrategies = this.getAvailableStrategies(platform)
    
    // Пробуем preferred стратегию
    const preferred = platform.capabilities.preferredAuth
    if (preferred && availableStrategies.includes(preferred)) {
      try {
        return await this.strategies.get(preferred).authenticate()
      } catch (error) {
        console.warn(`Preferred auth failed: ${preferred}`, error)
      }
    }
    
    // Fallback на первую доступную
    for (const strategy of availableStrategies) {
      try {
        return await this.strategies.get(strategy).authenticate()
      } catch (error) {
        console.warn(`Auth strategy failed: ${strategy}`, error)
      }
    }
    
    throw new Error('No authentication methods available')
  }
  
  private getAvailableStrategies(platform: Platform): string[] {
    const strategies = []
    
    // Platform-specific
    if (platform.type === 'base' && platform.capabilities.hasNativeAuth) {
      strategies.push('base')
    }
    if (platform.type === 'farcaster' && platform.capabilities.hasFarcasterAuth) {
      strategies.push('farcaster')
    }
    
    // Universal fallback - всегда wallet
    if (platform.capabilities.hasWeb3) {
      strategies.push('wallet')
    }
    
    return strategies
  }
}
```

## 🎨 UI адаптация через CSS

```typescript
// components/ui/button.tsx
import { cn } from '@/lib/utils'
import { usePlatform } from '@/hooks/use-platform'

export function Button({ className, ...props }: ButtonProps) {
  const platform = usePlatform()
  
  return (
    <button
      className={cn(
        // Базовые стили
        'px-4 py-2 rounded-lg font-medium transition-colors',
        
        // Платформо-специфичные классы через CSS
        'platform-base:min-h-[44px]',     // Base App
        'platform-farcaster:rounded-xl',   // Farcaster style
        'platform-web:hover:scale-105',    // Desktop hover
        
        // Responsive
        'sm:px-6 sm:py-3',
        
        className
      )}
      {...props}
    />
  )
}
```

```css
/* globals.css */
/* Platform-specific styles */
[data-platform="base"] .platform-base\:min-h-\[44px\] {
  min-height: 44px;
}

[data-platform="farcaster"] .platform-farcaster\:rounded-xl {
  border-radius: 0.75rem;
}

[data-platform="web"] .platform-web\:hover\:scale-105:hover {
  transform: scale(1.05);
}
```

## 🔧 Platform Capabilities

```typescript
// lib/platform/capabilities/base.capabilities.ts
export const BASE_CAPABILITIES = {
  hasNativeAuth: true,
  preferredAuth: 'base',
  hasWeb3: true,
  hasSocialShare: true,
  hasDeepLinks: true,
  hasNotifications: false,
  hasCamera: false,
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  
  ui: {
    hasHeader: false,        // Base App provides header
    hasFooter: false,        // Base App provides navigation
    safeAreaTop: 44,
    safeAreaBottom: 34,
    preferredColorScheme: 'light',
  },
  
  navigation: {
    canGoBack: true,
    canOpenExternal: true,
    canShare: true,
  }
}

// lib/platform/capabilities/web.capabilities.ts  
export const WEB_CAPABILITIES = {
  hasNativeAuth: false,
  preferredAuth: 'wallet',
  hasWeb3: true,
  hasSocialShare: navigator.share !== undefined,
  hasDeepLinks: false,
  hasNotifications: 'Notification' in window,
  hasCamera: navigator.mediaDevices !== undefined,
  maxUploadSize: 100 * 1024 * 1024, // 100MB
  
  ui: {
    hasHeader: true,         // We control header
    hasFooter: true,         // We control footer
    safeAreaTop: 0,
    safeAreaBottom: 0,
    preferredColorScheme: 'auto',
  },
  
  navigation: {
    canGoBack: true,
    canOpenExternal: true,
    canShare: navigator.share !== undefined,
  }
}
```

## 🔄 Feature Flags по платформам

```typescript
// hooks/use-feature-flags.ts
export function useFeatureFlags() {
  const platform = usePlatform()
  
  return {
    // Admin panel только в web
    showAdmin: platform.type === 'web',
    
    // Social features в embedded apps
    showSocialShare: platform.capabilities.hasSocialShare,
    
    // Wallet connect всегда доступен
    showWalletConnect: platform.capabilities.hasWeb3,
    
    // Analytics только в production web
    enableAnalytics: platform.type === 'web' && process.env.NODE_ENV === 'production',
    
    // Различные UI элементы
    showHeader: platform.ui.hasHeader,
    showFooter: platform.ui.hasFooter,
    
    // Оптимизации
    enablePrefetch: platform.type === 'web',
    enableServiceWorker: platform.type === 'web',
  }
}
```

## 🎯 Использование в компонентах

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  const platform = usePlatform()
  const features = useFeatureFlags()
  
  return (
    <html lang="en" data-platform={platform?.type}>
      <body>
        <PlatformProvider value={platform}>
          <AuthProvider>
            {features.showHeader && <Header />}
            
            <main className={cn(
              'min-h-screen',
              platform?.ui.safeAreaTop && `pt-[${platform.ui.safeAreaTop}px]`,
              platform?.ui.safeAreaBottom && `pb-[${platform.ui.safeAreaBottom}px]`
            )}>
              {children}
            </main>
            
            {features.showFooter && <Footer />}
          </AuthProvider>
        </PlatformProvider>
      </body>
    </html>
  )
}
```

## ✅ Преимущества архитектуры

1. **Нет конфликтов** - каждая платформа использует свои возможности
2. **Graceful degradation** - fallback на универсальные методы
3. **Нет дублирования** - общий код, разные стратегии
4. **Расширяемость** - легко добавить новые платформы
5. **Type-safe** - полная типизация capabilities

## 🚀 Добавление новой платформы

```typescript
// 1. Создать detector
class TelegramDetector implements PlatformDetector {
  matches(): boolean {
    return window.Telegram?.WebApp !== undefined
  }
  
  getCapabilities(): Capabilities {
    return TELEGRAM_CAPABILITIES
  }
}

// 2. Создать auth strategy (опционально)
class TelegramAuthStrategy implements AuthStrategy {
  async authenticate(): Promise<User> {
    const tgUser = window.Telegram.WebApp.initDataUnsafe.user
    return await api.authWithTelegram(tgUser)
  }
}

// 3. Зарегистрировать
platformManager.registerDetector(new TelegramDetector())
authManager.registerStrategy('telegram', new TelegramAuthStrategy())
```

## 📊 Итог

**Единое приложение** которое:
- ✅ Работает в Base App с wallet auth через MiniKit
- ✅ Работает в Farcaster с wallet auth через Farcaster SDK  
- ✅ Работает в браузере с MetaMask/RainbowKit
- ✅ Работает на мобильных с WalletConnect
- ✅ Готово к новым платформам (всегда wallet-based)

Без дублирования кода и конфликтов между платформами.