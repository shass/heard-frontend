# 🚀 HEARD Frontend Refactoring Plan

## 📋 Executive Summary

Рефакторинг фронтенда HEARD для четкого разделения на логические приложения с сохранением единого деплоя в Digital Ocean App Platform.

**Цели:**
- Четкое разделение публичной части, админки и Mini App
- Улучшение maintainability и scalability
- Оптимизация bundle size для каждой части
- Сохранение единого деплоя в Digital Ocean

## 🏗️ Текущая структура

```
heard-frontend/
├── app/
│   ├── page.tsx           # Главная (список опросов)
│   ├── admin/             # Админ панель
│   └── surveys/           # Опросы
├── components/
│   ├── admin/             # Компоненты админки
│   ├── survey/            # Компоненты опросов
│   └── ui/                # Общие UI компоненты
└── lib/
    ├── api/               # API клиенты
    └── store/             # Zustand stores
```

## 🎯 Целевая архитектура

### Phase 1: Route Groups (Приоритет: ВЫСОКИЙ)

```
heard-frontend/
├── app/
│   ├── (public)/                    # Публичная часть
│   │   ├── layout.tsx               # Layout с Header/Footer
│   │   ├── page.tsx                 # Главная страница
│   │   └── surveys/
│   │       ├── page.tsx             # Список опросов
│   │       └── [id]/
│   │           ├── page.tsx         # Прохождение опроса
│   │           ├── info/
│   │           ├── reward/
│   │           └── results/
│   │
│   ├── (admin)/                     # Админ панель
│   │   ├── layout.tsx               # AdminLayout с проверкой прав
│   │   └── admin/
│   │       ├── page.tsx             # Dashboard
│   │       ├── surveys/
│   │       │   ├── page.tsx         # Управление опросами
│   │       │   ├── create/
│   │       │   └── [id]/edit/
│   │       ├── users/
│   │       └── settings/
│   │
│   ├── (miniapp)/                   # Base Mini App версия
│   │   ├── layout.tsx               # Оптимизированный layout
│   │   └── m/                       # Префикс для mini app
│   │       ├── page.tsx
│   │       └── survey/[id]/
│   │
│   ├── layout.tsx                   # Root layout с провайдерами
│   └── not-found.tsx
```

### Phase 2: Компонентная структура

```
components/
├── features/                        # Feature-based компоненты
│   ├── surveys/
│   │   ├── SurveyList/
│   │   ├── SurveyForm/
│   │   ├── SurveyResults/
│   │   └── hooks/
│   │
│   ├── admin/
│   │   ├── Dashboard/
│   │   ├── SurveyManager/
│   │   ├── UserManager/
│   │   └── hooks/
│   │
│   └── miniapp/
│       ├── MiniSurveyView/
│       └── hooks/
│
├── shared/                          # Общие компоненты
│   ├── ui/                         # shadcn/ui
│   ├── layouts/
│   └── providers/
│
└── lib/
    ├── api/
    │   ├── public/                 # API для публичной части
    │   ├── admin/                  # API для админки
    │   └── shared/                 # Общие API
    │
    └── stores/
        ├── publicStore.ts
        ├── adminStore.ts
        └── sharedStore.ts
```

## 📝 План реализации

### **Sprint 1: Подготовка (1-2 дня)**

#### 1.1 Анализ и документация
- [ ] Составить полный список всех маршрутов
- [ ] Определить зависимости между компонентами
- [ ] Документировать API endpoints для каждой части
- [ ] Создать диаграмму текущей архитектуры

#### 1.2 Настройка инфраструктуры
- [ ] Настроить ESLint rules для новой структуры
- [ ] Обновить TypeScript paths в tsconfig.json
- [ ] Создать скрипты для анализа bundle size
- [ ] Настроить git hooks для проверки импортов

### **Sprint 2: Route Groups (3-4 дня)**

#### 2.1 Создание структуры Route Groups
```bash
# Создание директорий
mkdir -p app/\(public\)
mkdir -p app/\(admin\)
mkdir -p app/\(miniapp\)
```

#### 2.2 Миграция публичных маршрутов
- [ ] Переместить `app/page.tsx` → `app/(public)/page.tsx`
- [ ] Переместить `app/surveys/*` → `app/(public)/surveys/*`
- [ ] Создать `app/(public)/layout.tsx` с Header/Footer
- [ ] Обновить импорты и пути

#### 2.3 Изоляция админки
- [ ] Переместить `app/admin/*` → `app/(admin)/admin/*`
- [ ] Создать `app/(admin)/layout.tsx` с AdminAuthWrapper
- [ ] Добавить middleware для проверки прав
- [ ] Настроить редиректы для неавторизованных

#### 2.4 Подготовка Mini App версии
- [ ] Создать `app/(miniapp)/layout.tsx`
- [ ] Добавить определение Mini App контекста
- [ ] Создать упрощенные версии страниц
- [ ] Настроить условный рендеринг

### **Sprint 3: Компонентный рефакторинг (4-5 дней)**

#### 3.1 Реорганизация компонентов
```typescript
// Пример миграции
// ДО: components/survey/survey-form.tsx
// ПОСЛЕ: components/features/surveys/SurveyForm/index.tsx
```

- [ ] Создать feature-based структуру
- [ ] Разделить shared и feature компоненты
- [ ] Вынести бизнес-логику в custom hooks
- [ ] Создать barrel exports для каждой feature

#### 3.2 Оптимизация импортов
- [ ] Использовать динамические импорты для тяжелых компонентов
- [ ] Настроить code splitting по маршрутам
- [ ] Создать lazy-loaded версии компонентов
- [ ] Оптимизировать tree shaking

### **Sprint 4: API и State Management (3-4 дня)**

#### 4.1 Разделение API клиентов
```typescript
// lib/api/public/surveys.ts
export const publicSurveyApi = {
  getList: () => {},
  getById: () => {},
  submitResponse: () => {}
}

// lib/api/admin/surveys.ts  
export const adminSurveyApi = {
  create: () => {},
  update: () => {},
  delete: () => {},
  getStats: () => {}
}
```

#### 4.2 Оптимизация stores
- [ ] Разделить stores по функциональности
- [ ] Использовать persist только где необходимо
- [ ] Добавить devtools для отладки
- [ ] Оптимизировать subscriptions

### **Sprint 5: Middleware и Guards (2-3 дня)**

#### 5.1 Создание middleware.ts
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Mini app detection
  if (request.headers.get('user-agent')?.includes('Farcaster')) {
    // Redirect to mini app version
    if (!pathname.startsWith('/m/')) {
      return NextResponse.redirect(
        new URL(`/m${pathname}`, request.url)
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/surveys/:path*']
}
```

### **Sprint 6: Оптимизация производительности (2-3 дня)**

#### 6.1 Bundle optimization
- [ ] Анализ bundle size с @next/bundle-analyzer
- [ ] Удаление неиспользуемых зависимостей
- [ ] Оптимизация изображений
- [ ] Настройка PWA для offline работы

#### 6.2 Performance monitoring
- [ ] Добавить Web Vitals tracking
- [ ] Настроить Sentry для error tracking
- [ ] Добавить analytics для user behavior
- [ ] Создать performance dashboard

### **Sprint 7: Тестирование и документация (3-4 дня)**

#### 7.1 Тестирование
- [ ] E2E тесты для критических путей
- [ ] Unit тесты для бизнес-логики
- [ ] Integration тесты для API
- [ ] Performance тесты

#### 7.2 Документация
- [ ] Обновить README.md
- [ ] Создать ARCHITECTURE.md
- [ ] Документировать API endpoints
- [ ] Создать Storybook для компонентов

## 🚀 Deployment Strategy

### Environment Variables
```env
# .env.production
NEXT_PUBLIC_APP_MODE=production
NEXT_PUBLIC_ADMIN_ENABLED=true
NEXT_PUBLIC_MINIAPP_ENABLED=true
NEXT_PUBLIC_API_URL=https://api.heardlabs.xyz

# .env.miniapp
NEXT_PUBLIC_APP_MODE=miniapp
NEXT_PUBLIC_ADMIN_ENABLED=false
NEXT_PUBLIC_MINIAPP_ENABLED=true
```

### Digital Ocean Configuration
```yaml
name: heard-frontend
region: nyc
services:
  - name: web
    environment_slug: node-js
    github:
      repo: heard/heard-frontend
      branch: main
      deploy_on_push: true
    
    build_command: |
      pnpm install
      pnpm build
    
    run_command: pnpm start
    
    http_port: 3000
    
    instance_count: 2
    instance_size_slug: professional-xs
    
    health_check:
      http_path: /api/health
      initial_delay_seconds: 10
      period_seconds: 10
    
    envs:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_APP_MODE
        value: production
```

## 📊 Success Metrics

### Performance KPIs
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 200kb (initial)

### Code Quality Metrics
- [ ] Test coverage > 80%
- [ ] 0 critical vulnerabilities
- [ ] TypeScript strict mode
- [ ] No circular dependencies

### Business Metrics
- [ ] Deployment time < 5 min
- [ ] Zero downtime deployments
- [ ] Cost optimization (single deployment)
- [ ] Improved developer experience

## 🔄 Migration Checklist

### Pre-migration
- [ ] Backup current code
- [ ] Document all environment variables
- [ ] Create rollback plan
- [ ] Notify stakeholders

### During migration
- [ ] Run tests after each sprint
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Document issues and solutions

### Post-migration
- [ ] Update CI/CD pipelines
- [ ] Train team on new structure
- [ ] Monitor for 2 weeks
- [ ] Retrospective meeting

## 📅 Timeline

**Total estimated time: 15-20 рабочих дней**

| Sprint | Duration | Priority |
|--------|----------|----------|
| Sprint 1: Подготовка | 1-2 дня | HIGH |
| Sprint 2: Route Groups | 3-4 дня | HIGH |
| Sprint 3: Компоненты | 4-5 дней | MEDIUM |
| Sprint 4: API/State | 3-4 дня | MEDIUM |
| Sprint 5: Middleware | 2-3 дня | HIGH |
| Sprint 6: Оптимизация | 2-3 дня | LOW |
| Sprint 7: Тестирование | 3-4 дня | MEDIUM |

## 🚨 Риски и митигация

### Риск 1: Breaking changes
**Митигация:** Feature flags для постепенного rollout

### Риск 2: Performance degradation
**Митигация:** A/B тестирование и мониторинг метрик

### Риск 3: Увеличение сложности
**Митигация:** Подробная документация и обучение команды

### Риск 4: Deployment issues
**Митигация:** Blue-green deployment стратегия

## 📚 Ресурсы

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Route Groups Guide](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Performance Best Practices](https://web.dev/performance/)

## ✅ Definition of Done

- [ ] Все тесты проходят
- [ ] Документация обновлена
- [ ] Code review пройден
- [ ] Performance metrics в норме
- [ ] Deployed to staging
- [ ] Stakeholders approval
- [ ] Deployed to production

---

*Последнее обновление: 2025-08-29*
*Автор: AI Assistant для проекта HEARD*