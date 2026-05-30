import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#1e40af' }).catch(() => {});
  SplashScreen.hide().catch(() => {});

  App.addListener('backButton', () => {
    const path = window.location.pathname;
    const homePaths = ['/', '/dashboard', '/login', '/volunteer', '/admin'];
    if (homePaths.includes(path)) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });
}

export function NativeAppInit() {
  useEffect(() => {
    initNativeApp();
  }, []);
  return null;
}
