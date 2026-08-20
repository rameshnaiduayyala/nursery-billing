import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Toast } from '@capacitor/toast';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';

const SERVER_URL_KEY = 'nursery_api_base_url';

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// ── Persistent Server URL Management for Mobile App ──
export async function getStoredApiBaseUrl() {
  try {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key: SERVER_URL_KEY });
      if (value) return value;
    }
  } catch (e) {
    console.warn('Failed to read from Preferences:', e);
  }
  return localStorage.getItem(SERVER_URL_KEY) || import.meta.env.VITE_API_BASE_URL || 'https://nursery.vanyxglobal.com/api';
}

export async function setStoredApiBaseUrl(url) {
  const trimmed = url.trim().replace(/\/+$/, '');
  localStorage.setItem(SERVER_URL_KEY, trimmed);
  try {
    if (isNativePlatform()) {
      await Preferences.set({ key: SERVER_URL_KEY, value: trimmed });
    }
  } catch (e) {
    console.warn('Failed to save to Preferences:', e);
  }
  return trimmed;
}

// ── Native UI / Status Bar Setup ──
export async function initNativeApp() {
  if (!isNativePlatform()) return;

  try {
    // Configure Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1b4d3e' });
  } catch (err) {
    console.warn('StatusBar init issue:', err);
  }
}

// ── Toast Notification Helper ──
export async function showNativeToast(text, duration = 'short') {
  if (isNativePlatform()) {
    try {
      await Toast.show({
        text,
        duration: duration === 'long' ? 'long' : 'short',
        position: 'bottom',
      });
      return;
    } catch (e) {
      console.warn('Toast failed:', e);
    }
  }
}

// ── Native Hardware Back Button Handler ──
let lastBackPressTime = 0;
export function setupAndroidBackButton(navigate) {
  if (!isNativePlatform()) return () => {};

  const handleBackButton = App.addListener('backButton', async (data) => {
    if (!data.canGoBack || window.location.pathname === '/' || window.location.pathname === '/login') {
      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        App.exitApp();
      } else {
        lastBackPressTime = now;
        await showNativeToast('Press back again to exit Nursery Billing');
      }
    } else {
      navigate(-1);
    }
  });

  return () => {
    handleBackButton.then((listener) => listener.remove());
  };
}

// ── Save File to Device Storage ──
export async function saveFileToDevice(filename, base64OrData, mimeType = 'application/pdf') {
  if (!isNativePlatform()) {
    // Web fallback: download via Blob
    const link = document.createElement('a');
    link.href = base64OrData.startsWith('data:') ? base64OrData : `data:${mimeType};base64,${base64OrData}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, native: false };
  }

  try {
    const rawData = base64OrData.replace(/^data:[^;]+;base64,/, '');
    const result = await Filesystem.writeFile({
      path: filename,
      data: rawData,
      directory: Directory.Documents,
    });

    await showNativeToast(`File saved to Documents: ${filename}`);
    return { success: true, uri: result.uri, native: true };
  } catch (error) {
    console.error('Filesystem write error:', error);
    await showNativeToast(`Failed to save file: ${error.message}`);
    throw error;
  }
}

// ── Share Receipt / Report File or Link ──
export async function shareFileOrText({ title, text, url, filename, base64Data }) {
  if (isNativePlatform() && filename && base64Data) {
    try {
      const saveRes = await saveFileToDevice(filename, base64Data);
      if (saveRes.uri) {
        await Share.share({
          title: title || 'Nursery Document',
          text: text || '',
          url: saveRes.uri,
          dialogTitle: title || 'Share via',
        });
        return;
      }
    } catch (e) {
      console.warn('Native share file error, falling back:', e);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Web Share API error:', e);
    }
  }

  // Fallback toast / prompt
  await showNativeToast('Sharing not available on this device');
}

// ── Camera Photo Capture (Expense Receipt / Attachments) ──
export async function capturePhoto() {
  if (!isNativePlatform()) {
    throw new Error('Camera plugin requires mobile native app execution');
  }

  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });
    return `data:image/${photo.format};base64,${photo.base64String}`;
  } catch (error) {
    console.error('Camera error:', error);
    throw error;
  }
}
