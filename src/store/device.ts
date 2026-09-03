/**
 * 设备身份存储（取代 JWT/User 登录）
 *  - localStorage 存 deviceId
 *  - 第一次访问自动调用 /device/register 获取 UUID
 */

const DEVICE_ID_KEY = 'eii-device-id';

let _cachedId: string | null = null;

export function getDeviceId(): string | null {
  if (_cachedId) return _cachedId;
  const v = window.localStorage.getItem(DEVICE_ID_KEY);
  if (v) _cachedId = v;
  return v;
}

export function setDeviceId(id: string) {
  _cachedId = id;
  window.localStorage.setItem(DEVICE_ID_KEY, id);
}

export async function initDeviceId(): Promise<string> {
  let id = getDeviceId();
  if (id) return id;
  try {
    const resp = await fetch('/api/v1/device/register', { method: 'POST' });
    if (resp.ok) {
      const data = await resp.json();
      id = String(data.device_id || data.device?.device_id || '');
    }
  } catch (err) {
    console.warn('Backend device register offline, generating local device ID:', err);
  }
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
  }
  setDeviceId(id);
  return id;
}
