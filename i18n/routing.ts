import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'mk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT-LOCALE',
    maxAge: 365 * 24 * 60 * 60,
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
