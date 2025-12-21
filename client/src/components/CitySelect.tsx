import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '@/store/localeStore';
import { JORDAN_CITIES, getCityDisplayName, type City } from '@/lib/cities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CitySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  allowEmpty?: boolean;
}

export function CitySelect({
  value = '',
  onChange,
  placeholder,
  className,
  required = false,
  allowEmpty = true,
}: CitySelectProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) {
      return JORDAN_CITIES;
    }

    const query = searchQuery.toLowerCase();
    return JORDAN_CITIES.filter((city) => {
      const enMatch = city.en.toLowerCase().includes(query);
      const arMatch = city.ar.includes(query);
      const keyMatch = city.key.toLowerCase().includes(query);
      return enMatch || arMatch || keyMatch;
    });
  }, [searchQuery]);

  const placeholderText = placeholder || t('common.city', 'City');
  
  // Select component cannot accept empty string - ALWAYS use a controlled Select
  // Strategy: Always provide a valid value that exists in the options list
  // - If value exists and is valid city key, use it
  // - Otherwise, use '__ALL__' as the default (which will be converted to '' in onChange)
  // This ensures Select is always controlled and never receives empty string
  const normalizedValue = (value && value.trim() !== '' && value !== '__ALL__' && JORDAN_CITIES.some(c => c.key === value))
    ? value 
    : '__ALL__'; // Always use '__ALL__' for empty/invalid values

  const handleValueChange = (newValue: string) => {
    if (newValue === '__ALL__') {
      onChange('');
    } else {
      onChange(newValue);
    }
    setSearchQuery('');
  };

  const displayValue = normalizedValue !== '__ALL__' 
    ? getCityDisplayName(normalizedValue, locale) 
    : '';

  // Always render controlled Select with a valid value
  return (
    <Select 
      value={normalizedValue} 
      onValueChange={handleValueChange} 
      required={required}
    >
        <SelectTrigger className={cn('w-full', className)}>
          <SelectValue placeholder={placeholderText}>
            {displayValue || placeholderText}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {/* Search input */}
          <div className="p-2 border-b sticky top-0 bg-popover z-10">
            <Input
              placeholder={t('common.search', 'Search...')}
              value={searchQuery}
              onChange={(e) => {
                e.stopPropagation();
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && filteredCities.length === 1) {
                  onChange(filteredCities[0].key);
                  setSearchQuery('');
                }
              }}
              className="h-8"
              autoFocus
            />
          </div>

          {/* All cities option */}
          {allowEmpty && (
            <SelectItem value="__ALL__" onSelect={() => setSearchQuery('')}>
              {t('common.allCities', 'All cities')}
            </SelectItem>
          )}

          {/* Filtered cities list */}
          {filteredCities.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              {t('common.noResults', 'No results found')}
            </div>
          ) : (
            filteredCities
              .filter((city) => city.key && city.key.trim() !== '') // Safety: filter out any empty keys
              .map((city) => (
                <SelectItem
                  key={city.key}
                  value={city.key}
                  onSelect={() => setSearchQuery('')}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{locale === 'ar' ? city.ar : city.en}</span>
                    {locale !== 'ar' && (
                      <span className="text-xs text-muted-foreground mr-2">
                        {city.ar}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
          )}
        </SelectContent>
      </Select>
    );
}

