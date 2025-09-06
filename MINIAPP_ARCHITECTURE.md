# 🚀 HEARD Mini App Architecture (без дублирования кода)

## 📋 Executive Summary

После изучения документации Base Mini Apps, предлагаю **НЕ создавать отдельное приложение**, а использовать **адаптивную архитектуру** с единой кодовой базой.

**Ключевой вывод:** Mini Apps - это те же веб-приложения, но с MiniKit SDK и оптимизированным UI. Нет необходимости в дублировании.

## 🎯 Рекомендуемая архитектура

### **Вариант 1: Адаптивные компоненты (РЕКОМЕНДУЮ)**

```
heard-frontend/
├── app/
│   ├── layout.tsx                   # Root layout с детекцией контекста
│   ├── page.tsx                     # Главная (адаптивная)
│   ├── surveys/
│   │   └── [id]/
│   │       ├── page.tsx             # Адаптивный компонент опроса
│   │       ├── info/page.tsx        
│   │       └── reward/page.tsx      
│   └── admin/                       # Скрыта в Mini App контексте
│
├── components/
│   ├── adaptive/                    # Адаптивные компоненты
│   │   ├── Layout/
│   │   │   ├── index.tsx           # Выбор layout по контексту
│   │   │   ├── BrowserLayout.tsx   # Полный layout для браузера
│   │   │   └── MiniAppLayout.tsx   # Компактный для Mini App
│   │   │
│   │   ├── SurveyView/
│   │   │   ├── index.tsx           # Контроллер
│   │   │   ├── DesktopView.tsx     # Десктопная версия
│   │   │   └── MiniAppView.tsx     # Mini App версия
│   │   │
│   │   └── Navigation/
│   │       ├── index.tsx
│   │       ├── Header.tsx          # Для браузера
│   │       └── MiniHeader.tsx      # Для Mini App
│   │
│   ├── shared/                      # Общие компоненты
│   │   ├── ui/                     # shadcn/ui
│   │   ├── forms/                  # Формы
│   │   └── cards/                  # Карточки
│   │
│   └── features/                    # Бизнес-логика
│       ├── surveys/
│       │   ├── hooks/              # Общие хуки
│       │   ├── utils/              # Утилиты
│       │   └── types/              # Типы
│       └── auth/
│           └── hooks/
│
├── hooks/
│   ├── use-app-context.ts          # Определение контекста
│   ├── use-minikit-environment.ts  # MiniKit детекция
│   └── use-adaptive-view.ts        # Выбор view
│
└── lib/
    ├── api/                         # Единый API клиент
    ├── store/                       # Единый store
    └── config/
        ├── app.config.ts            # Конфигурация приложения
        └── miniapp.manifest.ts      # Manifest для Mini App
```

## 🔧 Реализация без дублирования

### 1. **Контекстный хук**

```typescript
// hooks/use-app-context.ts
export function useAppContext() {
  const { isMiniKit, isBaseApp } = useMiniKitEnvironment()
  const { isMobile } = usePlatformDetection()
  
  return {
    mode: isBaseApp ? 'miniapp' : 'browser',
    isMobile,
    shouldShowAdmin: !isBaseApp,
    shouldUseCompactUI: isBaseApp || isMobile,
    canShare: isBaseApp, // Social sharing в Mini App
  }
}
```

### 2. **Адаптивный Layout**

```typescript
// components/adaptive/Layout/index.tsx
import { useAppContext } from '@/hooks/use-app-context'
import { BrowserLayout } from './BrowserLayout'
import { MiniAppLayout } from './MiniAppLayout'

export function AdaptiveLayout({ children }: { children: React.ReactNode }) {
  const { mode } = useAppContext()
  
  if (mode === 'miniapp') {
    return <MiniAppLayout>{children}</MiniAppLayout>
  }
  
  return <BrowserLayout>{children}</BrowserLayout>
}
```

### 3. **Единый компонент с адаптацией**

```typescript
// components/adaptive/SurveyView/index.tsx
export function SurveyView({ survey }: { survey: Survey }) {
  const { shouldUseCompactUI } = useAppContext()
  const Component = shouldUseCompactUI ? MiniAppView : DesktopView
  
  // Общая бизнес-логика
  const { submitResponse, isLoading } = useSurveySubmit(survey.id)
  
  return (
    <Component 
      survey={survey}
      onSubmit={submitResponse}
      isLoading={isLoading}
    />
  )
}
```

### 4. **Переиспользуемые хуки**

```typescript
// components/features/surveys/hooks/use-survey-submit.ts
export function useSurveySubmit(surveyId: string) {
  const { mode, canShare } = useAppContext()
  const { openUrl } = useOpenUrl() // MiniKit hook
  
  const submitResponse = async (data: SurveyResponse) => {
    const result = await api.submitSurvey(surveyId, data)
    
    // Адаптивное поведение после отправки
    if (mode === 'miniapp' && canShare) {
      // Предложить поделиться в Mini App
      await shareToFarcaster(result)
    } else {
      // Обычная навигация в браузере
      router.push(`/surveys/${surveyId}/reward`)
    }
    
    return result
  }
  
  return { submitResponse, isLoading }
}
```

## 📦 Конфигурация без дублирования

### **app.config.ts**

```typescript
// lib/config/app.config.ts
export const appConfig = {
  browser: {
    features: {
      admin: true,
      analytics: true,
      fullNavigation: true,
    },
    ui: {
      headerHeight: 80,
      showFooter: true,
      maxWidth: '1200px',
    }
  },
  
  miniapp: {
    features: {
      admin: false,
      analytics: false,
      fullNavigation: false,
    },
    ui: {
      headerHeight: 44,
      showFooter: false,
      maxWidth: '100%',
    }
  }
}

export function getConfig() {
  const { mode } = useAppContext()
  return appConfig[mode]
}
```

### **Middleware для контекста**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const isMiniApp = /Farcaster|Base|Warpcast/i.test(userAgent)
  
  // Скрываем админку в Mini App
  if (isMiniApp && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Добавляем headers для определения контекста
  const response = NextResponse.next()
  response.headers.set('x-app-mode', isMiniApp ? 'miniapp' : 'browser')
  
  return response
}
```

## 🎨 UI адаптация без дублирования

### **Responsive + Adaptive подход**

```typescript
// components/shared/ui/Button.tsx
import { cn } from '@/lib/utils'
import { useAppContext } from '@/hooks/use-app-context'

export function Button({ 
  children, 
  size = 'default',
  ...props 
}: ButtonProps) {
  const { shouldUseCompactUI } = useAppContext()
  
  // Автоматическая адаптация размеров
  const adaptiveSize = shouldUseCompactUI && size === 'default' 
    ? 'sm' 
    : size
  
  return (
    <button
      className={cn(
        buttonVariants({ size: adaptiveSize }),
        shouldUseCompactUI && 'min-h-[44px]' // iOS touch target
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🔄 Стратегия миграции

### **Phase 1: Подготовка (1-2 дня)**
- [x] MiniKit уже установлен
- [x] Детекция контекста создана
- [ ] Добавить app.config.ts
- [ ] Создать адаптивные хуки

### **Phase 2: Адаптивные компоненты (3-4 дня)**
- [ ] Создать AdaptiveLayout
- [ ] Адаптировать Header/Footer
- [ ] Создать компактные версии форм
- [ ] Оптимизировать мобильную навигацию

### **Phase 3: Интеграция Mini App features (2-3 дня)**
- [ ] Добавить social sharing через Farcaster
- [ ] Интегрировать useOpenUrl для навигации
- [ ] Добавить Mini App-specific analytics
- [ ] Создать manifest.json

### **Phase 4: Оптимизация (2 дня)**
- [ ] Code splitting по контексту
- [ ] Lazy loading для браузерных features
- [ ] Оптимизация bundle для Mini App
- [ ] Performance monitoring

## ✅ Преимущества подхода

1. **Нет дублирования кода** - единая кодовая база
2. **Общая бизнес-логика** - хуки и API переиспользуются
3. **Адаптивность** - автоматическая подстройка UI
4. **Простота поддержки** - один код, разные view
5. **Оптимальный bundle** - tree shaking удалит неиспользуемое

## 🚫 Что НЕ нужно делать

1. **НЕ создавать отдельную папку** `(miniapp)` - это дублирование
2. **НЕ копировать компоненты** - используем адаптивные
3. **НЕ разделять API** - единый клиент с контекстом
4. **НЕ создавать отдельный store** - общий state

## 📊 Метрики успеха

- [ ] Bundle size Mini App < 150kb
- [ ] Код переиспользования > 80%
- [ ] Время на добавление feature = одинаковое для всех версий
- [ ] Zero дублирования бизнес-логики

## 🎯 Итоговая структура

```
ЕДИНОЕ приложение с:
- Адаптивными компонентами
- Контекстными хуками  
- Общей бизнес-логикой
- Автоматической оптимизацией UI
```

Это позволит поддерживать:
- ✅ Browser версию
- ✅ Mobile версию
- ✅ Base Mini App
- ✅ Будущие платформы

...используя **один код** и **без дублирования**.

---

*Последнее обновление: 2025-08-29*