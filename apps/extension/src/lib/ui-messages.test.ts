import { describe, expect, it } from 'vitest';

import { profileKindText, typedUiTextCatalog, uiMessage, uiText } from './ui-messages';

describe('typed UI messages', () => {
  it('contains complete English, Simplified Chinese, and Traditional Chinese values', () => {
    for (const localized of Object.values(typedUiTextCatalog)) {
      expect(localized.en.length).toBeGreaterThan(0);
      expect(localized['zh-CN'].length).toBeGreaterThan(0);
      expect(localized['zh-TW'].length).toBeGreaterThan(0);
    }
  });

  it('uses source-backed New Profile and Fixed terminology', () => {
    expect(uiText('newProfile.title', 'zh-CN')).toBe('新建情景模式');
    expect(uiText('newProfile.title', 'zh-TW')).toBe('建立情境模式');
    expect(uiText('newProfile.fixed.title', 'zh-CN')).toBe('代理服务器');
    expect(uiText('fixed.authTitle', 'zh-TW')).toBe('代理認證');
    expect(profileKindText('virtual', 'zh-TW')).toBe('虛擬情境模式');
  });

  it('formats dynamic deletion and accessibility messages without English fallback', () => {
    expect(uiMessage('profile.delete.confirmDescription', { profileName: '工作' }, 'zh-CN')).toBe(
      '删除情景模式“工作”？此操作只会修改尚未应用的设置。',
    );
    expect(uiMessage('fixed.fieldAria', { scheme: '(預設)', field: 'port' }, 'zh-TW')).toBe(
      '(預設) 連接埠',
    );
    expect(uiMessage('fixed.authUnsupported', { protocol: 'SOCKS5' }, 'zh-TW')).toBe(
      '您的瀏覽器不支援 SOCKS5 代理認證。',
    );
  });
});
