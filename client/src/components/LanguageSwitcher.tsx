import { useLocaleStore } from '@/store/localeStore';
import { locales } from '@/lib/i18n/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <div className="flex items-center rounded-full border border-border bg-background p-1">
      {Object.values(locales).map((localeConfig) => (
        <button
          key={localeConfig.code}
          onClick={() => setLocale(localeConfig.code)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            "flex items-center gap-1.5",
            locale === localeConfig.code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-base">{localeConfig.flag}</span>
          <span>{localeConfig.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

