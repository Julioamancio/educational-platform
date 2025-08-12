import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

interface PlatformSettings {
  siteName: string
  siteDescription: string
  allowRegistration: boolean
  requireEmailVerification: boolean
  maxAttemptsPerQuestion: number
  timeoutMinutes: number
  showCorrectAnswer: boolean
  showExplanation: boolean
  allowReview: boolean
  defaultDifficulty: string
  emailNotifications: boolean
  theme: string
}

const defaultSettings: PlatformSettings = {
  siteName: 'EduPlatform',
  siteDescription: 'A comprehensive learning management system',
  allowRegistration: true,
  requireEmailVerification: false,
  maxAttemptsPerQuestion: 3,
  timeoutMinutes: 30,
  showCorrectAnswer: true,
  showExplanation: true,
  allowReview: true,
  defaultDifficulty: 'B1',
  emailNotifications: true,
  theme: 'light'
}

export function usePlatformSettings() {
  const [settings, setSettings] = useKV<PlatformSettings>('platformSettings', defaultSettings)

  // Update document title when site name changes
  useEffect(() => {
    if (settings.siteName) {
      document.title = `${settings.siteName} - Learning Management System`
    }
  }, [settings.siteName])

  return [settings, setSettings] as const
}