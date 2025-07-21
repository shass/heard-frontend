# Heard Frontend - Web3 Survey Platform

Web3 платформа для проведения опросов с наградами в криптовалюте.

## Быстрый старт

### Предварительные требования
- Node.js 18+
- pnpm (рекомендуется)

### Установка

```bash
# Клонирование и установка зависимостей
pnpm install

# Настройка environment переменных
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками
```

### Разработка

```bash
# Запуск в режиме разработки
pnpm dev

# Открыть http://localhost:3000
```

### Сборка

```bash
# Сборка для продакшена
pnpm build

# Запуск production версии
pnpm start
```

## Архитектура

### Технологии
- **Frontend**: Next.js 15 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Web3**: RainbowKit + Wagmi + Viem
- **State**: Zustand + React Query
- **HTTP**: Axios

### Структура
```
src/
├── app/                    # Next.js App Router
├── components/             # React компоненты
│   ├── ui/                # shadcn/ui компоненты
│   ├── auth/              # Аутентификация
│   └── providers/         # React провайдеры
├── lib/                   # Библиотеки и утилиты
│   ├── api/              # HTTP клиент и endpoints
│   ├── store/            # Zustand stores
│   ├── web3/             # Web3 конфигурация
│   └── types/            # TypeScript типы
└── hooks/                 # Custom React hooks
```

## Функциональность

### ✅ Реализовано
- Web3 аутентификация через кошелек
- RainbowKit интеграция (MetaMask, WalletConnect, Coinbase)
- JWT токен управление
- Защищенные роуты
- Responsive дизайн
- SSR поддержка

### 🔄 В разработке
- API интеграция с backend
- Реальные данные опросов
- HeardPoints система
- Error handling

### 📋 Запланировано
- Offline поддержка
- Performance оптимизации
- Unit тестирование
- Admin панель

## Environment переменные

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CHAIN_ID=1

# App
NEXT_PUBLIC_APP_NAME=Heard Labs
```

## Workflow использования

1. **Подключение кошелька** - Пользователь подключает MetaMask или другой кошелек
2. **Аутентификация** - Подпись сообщения для верификации владения кошельком
3. **Просмотр опросов** - Список доступных опросов с наградами
4. **Прохождение опроса** - Пошаговые вопросы с сохранением прогресса
5. **Получение награды** - LinkDrop коды и HeardPoints

## Интеграция с Backend

### API Endpoints
```typescript
// Аутентификация
POST /api/auth/nonce
POST /api/auth/connect-wallet
GET /api/auth/me

// Опросы
GET /api/surveys
GET /api/surveys/:id
POST /api/surveys/:id/start
POST /api/surveys/responses/:responseId/answer
POST /api/surveys/responses/:responseId/submit
```

### TypeScript типы
Все типы совместимы с backend API моделями данных.

## Разработка

### Команды
```bash
pnpm dev          # Разработка с hot reload
pnpm build        # Сборка для продакшена
pnpm start        # Запуск production версии
pnpm lint         # Проверка кода
```

### Добавление новых компонентов
```bash
# shadcn/ui компоненты
npx shadcn-ui@latest add button

# Новые страницы
# Создать файл в app/
```

### Web3 интеграция
```typescript
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, isAuthenticated, login } = useAuth()
  
  if (!isAuthenticated) {
    return <button onClick={login}>Connect Wallet</button>
  }
  
  return <div>Welcome {user.walletAddress}</div>
}
```

## Деплой

### Vercel (рекомендуется)
```bash
# Подключить к Vercel
vercel

# Настроить environment переменные в панели Vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Troubleshooting

### Частые проблемы

**SSR ошибки Web3**
```
ReferenceError: indexedDB is not defined
```
Это нормально для Web3 приложений. Компоненты используют dynamic imports.

**Peer dependency warnings**
React 19 warnings можно игнорировать - совместимость обеспечена.

**WalletConnect не работает**
Проверьте `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` в `.env.local`.

### Логи
```bash
# Включить debug режим
NEXT_PUBLIC_ENABLE_DEBUG=true pnpm dev
```

## Contributing

1. Fork проекта
2. Создать feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Открыть Pull Request

## Лицензия

MIT License - см. [LICENSE](LICENSE) файл.

## Поддержка

- GitHub Issues для багов
- Документация: [FRONTEND_PROJECT_STATUS.md](FRONTEND_PROJECT_STATUS.md)
- Plan интеграции: [FRONTEND_INTEGRATION_PLAN.md](../FRONTEND_INTEGRATION_PLAN.md)

---

**Heard Labs** - Earn crypto rewards for your opinions 🚀
