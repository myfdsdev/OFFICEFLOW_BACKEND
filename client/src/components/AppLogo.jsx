import React from 'react';
import { Clock } from 'lucide-react';
import { useAppSettings } from '@/lib/AppSettingsContext';

/**
<<<<<<< HEAD
 * Shows the app logo + name from settings.
 * Falls back to default icon if no custom logo set.
 *
 * Usage:
 *   <AppLogo />               // default size
 *   <AppLogo size="sm" />     // small (mobile header)
 *   <AppLogo size="lg" />     // large (welcome page)
 *   <AppLogo iconOnly />      // just the icon, no text
 */
export default function AppLogo({ size = 'md', iconOnly = false, className = '' }) {
  const { settings } = useAppSettings();

  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg', rounded: 'rounded-lg' },
    md: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl', rounded: 'rounded-xl' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl', rounded: 'rounded-xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.box} bg-indigo-600 ${s.rounded} flex items-center justify-center overflow-hidden`}>
        {settings.app_logo ? (
          <img
            src={settings.app_logo}
            alt={settings.app_name || 'Logo'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Clock className={`${s.icon} text-white`} />
        )}
      </div>
      {!iconOnly && (
        <span className={`${s.text} font-bold text-gray-900`}>
          {settings.app_name || 'AttendEase'}
        </span>
      )}
    </div>
  );
=======
 * Shows the app logo + name from settings.
 * Falls back to default icon if no custom logo set.
 *
 * Usage:
 *   <AppLogo />               // default size
 *   <AppLogo size="sm" />     // small (mobile header)
 *   <AppLogo size="lg" />     // large (welcome page)
 *   <AppLogo iconOnly />      // just the icon, no text
 */
export default function AppLogo({ size = 'md', iconOnly = false, className = '' }) {
  const { settings } = useAppSettings();

  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg', rounded: 'rounded-lg' },
    md: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl', rounded: 'rounded-xl' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl', rounded: 'rounded-xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.box} bg-indigo-600 ${s.rounded} flex items-center justify-center overflow-hidden`}>
        {settings.app_logo ? (
          <img
            src={settings.app_logo}
            alt={settings.app_name || 'Logo'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Clock className={`${s.icon} text-white`} />
        )}
      </div>
      {!iconOnly && (
        <span className={`${s.text} font-bold text-gray-900`}>
          {settings.app_name || 'AttendEase'}
        </span>
      )}
    </div>
  );
>>>>>>> 686fead (feat: implement app settings management with admin controls)
}