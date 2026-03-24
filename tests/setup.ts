import '@testing-library/react'
import { expect, vi } from 'vitest'

// Mock React icons (they return JSX which causes issues in pure unit tests)
vi.mock('lucide-react', () => ({
  Rocket: () => null,
  Layers: () => null,
  Zap: () => null,
  FlaskConical: () => null,
  Trash2: () => null,
  Volume2: () => null,
  Target: () => null,
}))
