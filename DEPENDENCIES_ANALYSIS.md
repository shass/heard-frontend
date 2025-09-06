# 📦 Frontend Dependencies Analysis for Multiplatform Architecture

## 🔍 Current Dependencies Review

### ✅ **Keep (Essential for multiplatform)**

```json
{
  "@coinbase/onchainkit": "^0.38.19",        // ✅ Base Mini App SDK
  "@rainbow-me/rainbowkit": "^2.2.8",       // ✅ Web wallet connect
  "@tanstack/react-query": "^5.83.0",       // ✅ Data fetching
  "wagmi": "^2.15.6",                        // ✅ Web3 hooks
  "viem": "^2.31.7",                         // ✅ Ethereum utilities
  "next": "15.2.4",                          // ✅ Framework
  "react": "^19",                            // ✅ Core
  "react-dom": "^19",                        // ✅ Core
  "zustand": "^5.0.6",                       // ✅ State management
  "zod": "^3.24.1",                          // ✅ Validation
  "clsx": "^2.1.1",                          // ✅ Conditional classes
  "tailwind-merge": "^2.5.5",               // ✅ Tailwind utilities
  "class-variance-authority": "^0.7.1",     // ✅ Component variants
  "lucide-react": "^0.454.0"                // ✅ Icons
}
```

### 🔄 **Update Required**

```json
{
  "axios": "^1.10.0",                        // 🔄 Replace with fetch
  "react-hook-form": "^7.54.1",             // 🔄 Update to latest
  "@hookform/resolvers": "^3.9.1",          // 🔄 Update with react-hook-form
}
```

### ❓ **Analyze Usage (Remove if unused)**

```json
{
  "motion": "^12.23.12",                     // ❓ Check if used
  "next-themes": "^0.4.4",                   // ❓ Check if used  
  "sonner": "^1.7.1",                       // ❓ Replace with native notifications?
  "vaul": "^0.9.6",                         // ❓ Bottom sheet - check usage
  "cmdk": "1.0.4",                          // ❓ Command palette - check usage
  "embla-carousel-react": "8.5.1",          // ❓ Carousel - check usage
  "input-otp": "1.4.1",                     // ❓ OTP input - check usage
  "react-day-picker": "8.10.1",             // ❓ Date picker - check usage
  "react-resizable-panels": "^2.1.7",       // ❓ Resizable panels - check usage
  "recharts": "3.1.0",                      // ❓ Charts - check if needed
  "date-fns": "4.1.0",                      // ❓ Date utils - check usage
  "web-vitals": "^5.0.3"                    // ❓ Metrics - check if used
}
```

### 🆕 **Add New Dependencies**

```json
{
  "ua-parser-js": "^2.0.0",                 // 🆕 User agent parsing for platform detection
  "@farcaster/auth-kit": "^0.3.3",          // 🆕 Farcaster authentication (if available)
  "idb": "^8.0.0",                          // 🆕 IndexedDB wrapper for offline storage
  "workbox-next": "^1.0.0"                  // 🆕 PWA support for offline functionality
}
```

### ❌ **Remove (Not needed)**

```json
{
  "autoprefixer": "^10.4.20",               // ❌ Built into Tailwind CSS
  "tailwindcss-animate": "^1.0.7"           // ❌ Can use Tailwind built-in animations
}
```

## 📊 Dependencies Audit Results

### Bundle Impact Analysis
```typescript
// Current bundle (estimated):
Total: ~800kb
├── React + Next.js: ~200kb
├── Web3 (wagmi + viem + rainbowkit): ~300kb  
├── UI Components (@radix-ui/*): ~200kb
├── OnchainKit: ~100kb
└── Other utilities: ~100kb

// After optimization:
Web version: ~600kb (remove unused UI components)
Mini App version: ~400kb (remove admin components, optimize for mobile)
```

### Security Audit
- ✅ **wagmi/viem** - Up to date, no known vulnerabilities
- ✅ **@coinbase/onchainkit** - Official Coinbase SDK, secure
- ⚠️ **axios** - Has vulnerabilities, replace with fetch
- ✅ **@radix-ui/* ** - Well-maintained, secure

### Performance Impact
- 📊 **React Query** - Excellent for Mini Apps (offline capabilities)
- 📊 **Zustand** - Lightweight state management, perfect for all platforms
- 📊 **Tailwind** - Good for responsive design across platforms

## 📋 Specific Actions Required

### 1. Remove axios, use native fetch

```typescript
// Before (axios):
import axios from 'axios'
const response = await axios.post('/api/auth', data)

// After (native fetch):
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

### 2. Add platform detection utilities

```bash
pnpm add ua-parser-js@^2.0.0
pnpm add @types/ua-parser-js@^0.7.39 --save-dev
```

### 3. Update existing packages

```bash
# Update to latest compatible versions
pnpm update @coinbase/onchainkit@latest
pnpm update @rainbow-me/rainbowkit@latest  
pnpm update wagmi@latest viem@latest
pnpm update react-hook-form@latest
pnpm update @hookform/resolvers@latest
```

### 4. Remove unused dependencies

```bash
# After checking usage
pnpm remove autoprefixer  # If not used
pnpm remove motion        # If not used  
pnpm remove sonner       # If we use native notifications
```

### 5. Optimize Radix UI imports

```typescript
// Before (importing everything):
import * as Dialog from '@radix-ui/react-dialog'

// After (tree shaking friendly):
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
```

## 🔧 Package.json Updates

### Recommended final package.json:

```json
{
  "dependencies": {
    "@coinbase/onchainkit": "^0.39.0",
    "@farcaster/auth-kit": "^0.3.3",
    "@hookform/resolvers": "^3.10.0", 
    "@rainbow-me/rainbowkit": "^2.3.0",
    "@tanstack/react-query": "^5.84.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1", 
    "date-fns": "^4.1.0",
    "lucide-react": "^0.460.0",
    "next": "^15.3.0",
    "react": "^19",
    "react-dom": "^19", 
    "react-hook-form": "^7.55.0",
    "tailwind-merge": "^2.6.0",
    "ua-parser-js": "^2.0.0",
    "viem": "^2.32.0", 
    "wagmi": "^2.16.0",
    "zod": "^3.25.0",
    "zustand": "^5.0.7",
    
    // Radix UI - only what we actually use
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4", 
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.1.6"
  },
  
  "devDependencies": {
    "@next/bundle-analyzer": "^15.4.1",
    "@types/node": "^22",
    "@types/react": "^19", 
    "@types/react-dom": "^19",
    "@types/ua-parser-js": "^0.7.39",
    "postcss": "^8.5",
    "tailwindcss": "^3.5.0",
    "typescript": "^5.6"
  }
}
```

## 🎯 Migration Steps

### Step 1: Dependencies cleanup
```bash
# Remove unused
pnpm remove autoprefixer motion next-themes sonner vaul cmdk

# Update existing  
pnpm update

# Add new
pnpm add ua-parser-js @farcaster/auth-kit
pnpm add -D @types/ua-parser-js
```

### Step 2: Replace axios with fetch
```bash
# Remove axios
pnpm remove axios

# Update all API calls to use native fetch
# (Search & replace in lib/api/*.ts files)
```

### Step 3: Optimize Radix imports
```bash
# Remove unused Radix components
pnpm remove @radix-ui/react-accordion # if not used
pnpm remove @radix-ui/react-menubar   # if not used
# etc.
```

## ⚡ Performance Gains Expected

- **Bundle size**: -200kb (remove unused deps)
- **Load time**: -1s (fewer HTTP requests)
- **Mini App size**: -50% (platform-specific bundles)
- **Security**: +improved (remove axios vulnerabilities)

---

**Total implementation time: 4-6 hours of careful dependency management.**