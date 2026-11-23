import {
  isPermissionGranted,
  requestPermission,
  sendNotification as sendNativeNotification,
} from '@tauri-apps/plugin-notification'
import { getSettings } from './settings/store'

export interface NotificationPayload {
  title: string
  body?: string
}

export const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
  const settings = await getSettings()
  if (!settings.notifications) return false

  let granted = await isPermissionGranted()
  if (!granted) granted = (await requestPermission()) === 'granted'
  if (!granted) return false

  sendNativeNotification(payload)
  return true
}
