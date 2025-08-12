import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [settings, setSettings] = useKV('platformSettings', {
    theme: 'light' as Theme
  })

  const theme = settings.theme || 'light'

  // Check if user prefers dark mode (for auto theme)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // Determine if dark mode should be active
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)

  const setTheme = (newTheme: Theme) => {
    setSettings(prev => ({ ...prev, theme: newTheme }))
  }

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    if (isDark) {
      root.classList.add('dark')
      // Update CSS variables for dark theme
      root.style.setProperty('--background', 'oklch(0.09 0.02 240)')
      root.style.setProperty('--foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--card', 'oklch(0.12 0.02 240)')
      root.style.setProperty('--card-foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--popover', 'oklch(0.12 0.02 240)')
      root.style.setProperty('--popover-foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--primary', 'oklch(0.6 0.18 240)')
      root.style.setProperty('--primary-foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--secondary', 'oklch(0.2 0.05 240)')
      root.style.setProperty('--secondary-foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--muted', 'oklch(0.15 0.02 240)')
      root.style.setProperty('--muted-foreground', 'oklch(0.65 0.05 240)')
      root.style.setProperty('--accent', 'oklch(0.7 0.18 50)')
      root.style.setProperty('--accent-foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--destructive', 'oklch(0.6 0.2 25)')
      root.style.setProperty('--destructive-foreground', 'oklch(0.95 0.02 240)')
      root.style.setProperty('--border', 'oklch(0.25 0.02 240)')
      root.style.setProperty('--input', 'oklch(0.25 0.02 240)')
      root.style.setProperty('--ring', 'oklch(0.6 0.18 240)')
    } else {
      root.classList.remove('dark')
      // Reset to light theme variables
      root.style.setProperty('--background', 'oklch(1 0 0)')
      root.style.setProperty('--foreground', 'oklch(0.2 0.05 240)')
      root.style.setProperty('--card', 'oklch(0.98 0.01 240)')
      root.style.setProperty('--card-foreground', 'oklch(0.2 0.05 240)')
      root.style.setProperty('--popover', 'oklch(1 0 0)')
      root.style.setProperty('--popover-foreground', 'oklch(0.2 0.05 240)')
      root.style.setProperty('--primary', 'oklch(0.45 0.15 240)')
      root.style.setProperty('--primary-foreground', 'oklch(1 0 0)')
      root.style.setProperty('--secondary', 'oklch(0.55 0.12 140)')
      root.style.setProperty('--secondary-foreground', 'oklch(1 0 0)')
      root.style.setProperty('--muted', 'oklch(0.96 0.01 240)')
      root.style.setProperty('--muted-foreground', 'oklch(0.5 0.05 240)')
      root.style.setProperty('--accent', 'oklch(0.65 0.18 50)')
      root.style.setProperty('--accent-foreground', 'oklch(1 0 0)')
      root.style.setProperty('--destructive', 'oklch(0.55 0.2 25)')
      root.style.setProperty('--destructive-foreground', 'oklch(1 0 0)')
      root.style.setProperty('--border', 'oklch(0.9 0.02 240)')
      root.style.setProperty('--input', 'oklch(0.9 0.02 240)')
      root.style.setProperty('--ring', 'oklch(0.45 0.15 240)')
    }
  }, [isDark])

  // Listen for system theme changes when auto is selected
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        // Force re-render by updating a dummy state
        setSettings(prev => ({ ...prev }))
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, setSettings])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}