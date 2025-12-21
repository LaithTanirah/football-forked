import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  search: string;
  city: string;
  type?: string; // For pitches: indoor/outdoor
  status?: string; // For leagues: DRAFT/ACTIVE/COMPLETED
  minPrice: string;
  maxPrice: string;
}

interface UseFiltersOptions {
  debounceMs?: number;
  includeSearch?: boolean;
  includeCity?: boolean;
  includeType?: boolean;
  includeStatus?: boolean;
  includePrice?: boolean;
}

const DEFAULT_DEBOUNCE_MS = 300;

export function useFilters(options: UseFiltersOptions = {}) {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    includeSearch = true,
    includeCity = true,
    includeType = false,
    includeStatus = false,
    includePrice = false,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const getInitialState = useCallback((): FilterState => {
    return {
      search: searchParams.get('q') || '',
      city: searchParams.get('city') || '',
      type: includeType ? searchParams.get('type') || '' : undefined,
      status: includeStatus ? searchParams.get('status') || '' : undefined,
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };
  }, [searchParams, includeType, includeStatus]);

  const [filters, setFilters] = useState<FilterState>(getInitialState);
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [priceError, setPriceError] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters.search, debounceMs]);

  // Update URL params when filters change
  const updateURLParams = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams();

      if (includeSearch && newFilters.search) {
        params.set('q', newFilters.search);
      }
      if (includeCity && newFilters.city) {
        params.set('city', newFilters.city);
      }
      if (includeType && newFilters.type) {
        params.set('type', newFilters.type);
      }
      if (includeStatus && newFilters.status) {
        params.set('status', newFilters.status);
      }
      if (includePrice && newFilters.minPrice) {
        params.set('minPrice', newFilters.minPrice);
      }
      if (includePrice && newFilters.maxPrice) {
        params.set('maxPrice', newFilters.maxPrice);
      }

      setSearchParams(params, { replace: true });
    },
    [setSearchParams, includeSearch, includeCity, includeType, includeStatus, includePrice]
  );

  // Update URL when debounced search changes
  useEffect(() => {
    if (includeSearch) {
      const newFilters = { ...filters, search: debouncedSearch };
      updateURLParams(newFilters);
    }
  }, [debouncedSearch, includeSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate price range
  const validatePriceRange = useCallback((min: string, max: string): string => {
    if (!min && !max) return '';
    
    const minNum = min ? parseFloat(min) : null;
    const maxNum = max ? parseFloat(max) : null;

    if (minNum !== null && (isNaN(minNum) || minNum < 0)) {
      return 'Min price must be a valid number';
    }
    if (maxNum !== null && (isNaN(maxNum) || maxNum < 0)) {
      return 'Max price must be a valid number';
    }
    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      return 'Min price must be less than or equal to max price';
    }

    return '';
  }, []);

  // Update filter
  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const newFilters = { ...filters, [key]: value };

      // Validate price range if updating price fields
      if (includePrice && (key === 'minPrice' || key === 'maxPrice')) {
        const error = validatePriceRange(
          key === 'minPrice' ? value : newFilters.minPrice,
          key === 'maxPrice' ? value : newFilters.maxPrice
        );
        setPriceError(error);
        if (error) {
          // Still update the filter but show error
          setFilters(newFilters);
          return;
        }
      }

      setFilters(newFilters);

      // For search, debouncing is handled by useEffect above
      // For other filters, update immediately
      if (key !== 'search') {
        updateURLParams(newFilters);
      }
    },
    [filters, includeSearch, includePrice, validatePriceRange, updateURLParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters: FilterState = {
      search: '',
      city: '',
      type: includeType ? '' : undefined,
      status: includeStatus ? '' : undefined,
      minPrice: '',
      maxPrice: '',
    };
    setFilters(emptyFilters);
    setPriceError('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [includeType, includeStatus, setSearchParams]);

  // Sync with URL params on mount or when URL changes externally
  useEffect(() => {
    const urlFilters = getInitialState();
    setFilters(urlFilters);
    
    // Validate price range from URL
    if (includePrice) {
      const error = validatePriceRange(urlFilters.minPrice, urlFilters.maxPrice);
      setPriceError(error);
    }
  }, [searchParams, getInitialState, includePrice, validatePriceRange]);

  // Prepare API params
  const apiParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {};

    if (includeSearch && filters.search) {
      params.search = filters.search;
    }
    if (includeCity && filters.city) {
      params.city = filters.city;
    }
    if (includeType && filters.type) {
      params.type = filters.type;
    }
    if (includeStatus && filters.status) {
      params.status = filters.status;
    }
    if (includePrice && filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) {
        params.minPrice = min;
      }
    }
    if (includePrice && filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) {
        params.maxPrice = max;
      }
    }

    return params;
  }, [filters, includeSearch, includeCity, includeType, includeStatus, includePrice]);

  return {
    filters,
    updateFilter,
    clearFilters,
    apiParams,
    priceError,
    hasActiveFilters: useMemo(() => {
      return !!(
        filters.search ||
        filters.city ||
        (includeType && filters.type) ||
        (includeStatus && filters.status) ||
        (includePrice && (filters.minPrice || filters.maxPrice))
      );
    }, [filters, includeType, includeStatus, includePrice]),
  };
}

