import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  School as SchoolIcon,
  MapPin,
  User,
  Loader2,
  X,
  Crosshair,
  AlertCircle,
} from 'lucide-react';
import { School, Student } from '@/types';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  category: 'local_school' | 'local_student' | 'external_school' | 'external_address';
  source: 'db' | 'google' | 'osm' | 'yandex';
  originalItem?: any;
}

interface SearchComboboxProps {
  schools: School[];
  students: Student[];
  currentSchool?: Partial<School> | any;
  googleMapsApiKey?: string;
  onSelectResult: (result: SearchResultItem) => void;
  onStartMapPickMode: () => void;
  isMapPickMode: boolean;
}

export const SearchCombobox: React.FC<SearchComboboxProps> = ({
  schools,
  students,
  currentSchool,
  googleMapsApiKey: _unusedKey,
  onSelectResult,
  onStartMapPickMode,
  isMapPickMode,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 1. Smart Local DB Search (0ms response)
  const searchLocalDb = (rawText: string): SearchResultItem[] => {
    const text = rawText.trim().toLowerCase();
    if (!text) return [];
    const localItems: SearchResultItem[] = [];

    // Extract numbers if user typed "30-maktab", "maktab 30", "30", "школа 30"
    const numMatch = text.match(/(?:maktab\s*|школа\s*|school\s*|№\s*|sonli\s*|^|\s)(\d+)(?:-maktab|-sonli|-son|\s*maktab|\s*sonli|\b)/i);
    const targetNum = numMatch ? numMatch[1] : null;

    // A) Search Local Schools
    schools.forEach((sch) => {
      const nameLower = sch.name.toLowerCase();
      const codeLower = (sch.code || '').toLowerCase();
      const addrLower = (sch.address || '').toLowerCase();

      let matched =
        nameLower.includes(text) ||
        codeLower.includes(text) ||
        addrLower.includes(text);

      if (!matched && targetNum) {
        if (nameLower.includes(targetNum)) {
          matched = true;
        }
      }

      if (matched && sch.lat && sch.lng) {
        localItems.push({
          id: `local_sch_${sch.id}`,
          title: sch.name,
          subtitle: `${sch.address || "O'zbekiston"} • (Mavjud Maktab)`,
          lat: sch.lat,
          lng: sch.lng,
          category: 'local_school',
          source: 'db',
          originalItem: sch,
        });
      }
    });

    // B) Search Local Students with active GPS
    students.forEach((st) => {
      const nameLower = st.name.toLowerCase();
      const idLower = (st.studentId || st.id || '').toLowerCase();
      const classLower = (st.className || (st as any).classId || '').toLowerCase();

      if (nameLower.includes(text) || idLower.includes(text) || classLower.includes(text)) {
        if (st.telemetry?.latitude && st.telemetry?.longitude) {
          localItems.push({
            id: `local_st_${st.id}`,
            title: st.name,
            subtitle: `${st.className || 'Sinf'} • GPS (${st.telemetry.geofenceStatus === 'INSIDE' ? 'Maktabda' : 'Tashqarida'})`,
            lat: st.telemetry.latitude,
            lng: st.telemetry.longitude,
            category: 'local_student',
            source: 'db',
            originalItem: st,
          });
        }
      }
    });

    return localItems;
  };

  // Perform search (both debounced and immediate on Enter)
  const executeSearch = async (trimmed: string, autoSelectFirst = false) => {
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      setErrorMessage(null);
      return;
    }

    setIsOpen(true);
    setSelectedIndex(-1);
    setErrorMessage(null);

    const localMatches = searchLocalDb(trimmed);

    // Direct GPS coordinate matcher (e.g. "41.311081, 69.240562" or "41.311081 69.240562")
    const coordPattern = /^([-+]?[0-9]{1,2}(?:\.[0-9]+)?)[,\s]+([-+]?[0-9]{1,3}(?:\.[0-9]+)?)$/;
    const coordMatch = trimmed.match(coordPattern);
    const coordMatches: SearchResultItem[] = [];
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[2]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        coordMatches.push({
          id: `coord_direct_${parsedLat}_${parsedLng}`,
          title: `GPS: ${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}`,
          subtitle: `📍 Aniq koordinata orqali xaritada joyni ochish va belgilash`,
          lat: parsedLat,
          lng: parsedLng,
          category: 'external_address',
          source: 'yandex',
        });
      }
    }

    let combined: SearchResultItem[] = [...coordMatches, ...localMatches];
    setResults(combined);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    // 1. Primary Engine: Yandex Maps Geocoding (Highest resolution for Uzbekistan)
    let yandexSuccess = false;
    const ymaps = (window as any).ymaps;
    if (ymaps && typeof ymaps.geocode === 'function') {
      try {
        const geoRes = await ymaps.geocode(trimmed, {
          results: 6,
          boundedBy: [
            [37.0, 56.0],
            [45.6, 73.2],
          ],
        });

        if (geoRes && geoRes.geoObjects) {
          const count = geoRes.geoObjects.getLength();
          if (count > 0) {
            yandexSuccess = true;
            geoRes.geoObjects.each((obj: any) => {
              const coords = obj.geometry.getCoordinates(); // [lat, lng]
              if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
                const name = obj.properties.get('name') || '';
                const description = obj.properties.get('description') || '';
                const meta = obj.properties.get('metaDataProperty.GeocoderMetaData');
                const kind = meta?.kind;
                const isSchool =
                  kind === 'school' ||
                  /maktab|школа|school|litsey|kollej/i.test(name) ||
                  /maktab|школа|school/i.test(description);

                const isDup = combined.some(
                  (c) => Math.abs(c.lat - coords[0]) < 0.0005 && Math.abs(c.lng - coords[1]) < 0.0005
                );

                if (!isDup) {
                  combined.push({
                    id: `yandex_${coords[0]}_${coords[1]}_${Math.random()}`,
                    title: name || trimmed,
                    subtitle: description ? `${description} • Yandex Xarita` : 'Yandex Xaritalar',
                    lat: coords[0],
                    lng: coords[1],
                    category: isSchool ? 'external_school' : 'external_address',
                    source: 'yandex',
                  });
                }
              }
            });
          }
        }
      } catch (yErr) {
        console.warn('Yandex Geocode xatosi:', yErr);
      }
    }

    // 2. Secondary Engine: Google Places (if Google SDK is present)
    let googleSuccess = false;
    if (!yandexSuccess && window.google && window.google.maps && window.google.maps.places) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        const gResults = await new Promise<any[]>((resolve) => {
          service.getPlacePredictions(
            {
              input: trimmed,
              componentRestrictions: { country: 'uz' },
              locationBias: currentSchool?.lat
                ? new window.google.maps.LatLng(currentSchool.lat, currentSchool.lng)
                : undefined,
            },
            (predictions: any[], status: string) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions);
              } else {
                resolve([]);
              }
            }
          );
        });

        if (gResults && gResults.length > 0) {
          googleSuccess = true;
          const geocoder = new window.google.maps.Geocoder();
          for (const p of gResults.slice(0, 3)) {
            try {
              const geoRes = await new Promise<any>((resolve) => {
                geocoder.geocode({ placeId: p.place_id }, (r: any[], st: string) => {
                  resolve(st === 'OK' && r && r[0] ? r[0] : null);
                });
              });
              if (geoRes && geoRes.geometry?.location) {
                const lat = geoRes.geometry.location.lat();
                const lng = geoRes.geometry.location.lng();
                combined.push({
                  id: `g_${p.place_id}`,
                  title: p.structured_formatting?.main_text || p.description,
                  subtitle: p.structured_formatting?.secondary_text || 'Google Maps',
                  lat,
                  lng,
                  category: p.types?.includes('school') ? 'external_school' : 'external_address',
                  source: 'google',
                });
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    // 3. Fallback: Server Nominatim Proxy
    if (!yandexSuccess && (!googleSuccess || combined.length < 2)) {
      try {
        const lat = currentSchool?.lat || 41.311081;
        const lng = currentSchool?.lng || 69.240562;

        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(trimmed)}&lat=${lat}&lng=${lng}`,
          { signal: controller.signal }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.results) {
            data.results.forEach((item: any) => {
              const isDup = combined.some(
                (c) => Math.abs(c.lat - item.lat) < 0.001 && Math.abs(c.lng - item.lng) < 0.001
              );
              if (!isDup) {
                combined.push({
                  id: item.id,
                  title: item.title,
                  subtitle: item.displayName,
                  lat: item.lat,
                  lng: item.lng,
                  category: item.category === 'school' ? 'external_school' : 'external_address',
                  source: 'osm',
                });
              }
            });
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Qidiruvda tarmoq xatosi:', err.message);
        }
      }
    }

    setResults(combined);
    setIsLoading(false);
    setHasSearched(true);

    if (autoSelectFirst && combined.length > 0) {
      handleSelectItem(combined[0]);
    }
  };

  // Debounced search on typing
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(trimmed, false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, schools, students, currentSchool]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectItem(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelectItem(results[0]);
      } else if (query.trim().length >= 2) {
        executeSearch(query.trim(), true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    onSelectResult(item);
    setIsOpen(false);
    setQuery(item.title);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-64 sm:w-80 md:w-96 select-none pointer-events-auto">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-[#9a9ac0] pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Joy, maktab yoki shahar qidiring (masalan: Urganch)..."
          className={`w-full h-9 pl-9 pr-16 text-xs rounded-xl bg-[#1b1b33] border transition-all duration-200 text-[#e8e8f5] placeholder-[#9a9ac0] focus:outline-none ${
            isMapPickMode
              ? 'border-[#ff2d78] ring-2 ring-[#ff2d78]/30'
              : 'border-[#3a3a63]/70 focus:border-[#2ee59d] focus:ring-1 focus:ring-[#2ee59d]/40'
          }`}
        />

        {/* Right status icons: Loading spinner or Clear button */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#2ee59d] animate-spin" />}
          {query.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg text-[#9a9ac0] hover:text-[#e8e8f5] hover:bg-[#2a2a4a] transition"
              aria-label="Tozalash"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onStartMapPickMode}
            className={`p-1 rounded-lg transition ${
              isMapPickMode
                ? 'bg-[#ff2d78] text-white shadow-sm'
                : 'text-[#9a9ac0] hover:text-[#2ee59d] hover:bg-[#2a2a4a]'
            }`}
            title="Xaritadan qo'lda joy tanlash"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dropdown Results / States Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-11 left-0 right-0 max-h-80 bg-[#1b1b33]/98 backdrop-blur-xl border border-[#3a3a63] rounded-2xl shadow-2xl overflow-y-auto z-50 p-1.5 space-y-1 scrollbar-thin text-xs text-[#e8e8f5]"
        >
          {/* Error State */}
          {errorMessage && (
            <div className="p-3 bg-[#ff4d5e]/15 border border-[#ff4d5e]/30 rounded-xl text-[#ff4d5e] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs">{errorMessage}</div>
                <div className="text-xs text-[#9a9ac0] mt-0.5">
                  Lokal maktablardan foydalaning yoki xaritadan qo'lda tanlang.
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-bold text-[#9a9ac0] uppercase tracking-wider flex items-center justify-between">
                <span>Topilgan natijalar ({results.length})</span>
                <span className="text-xs text-[#4db5ff]">Enter orqali tanlash</span>
              </div>

              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isLocal = item.source === 'db';
                const isSchool = item.category === 'local_school' || item.category === 'external_school';
                const isYandex = item.source === 'yandex';

                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#2a2a4a] border border-[#2ee59d]/50 text-[#2ee59d]'
                        : 'hover:bg-[#2a2a4a]/70 text-[#e8e8f5]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSchool
                          ? 'bg-[#2ee59d]/20 text-[#2ee59d]'
                          : isYandex
                          ? 'bg-[#fc3f1d]/20 text-[#ff5733]'
                          : isLocal
                          ? 'bg-[#4db5ff]/20 text-[#4db5ff]'
                          : 'bg-[#9a9ac0]/20 text-[#9a9ac0]'
                      }`}
                    >
                      {isSchool ? (
                        <SchoolIcon className="w-3.5 h-3.5" />
                      ) : item.category === 'local_student' ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-xs flex items-center gap-1.5">
                        <span className="truncate">{item.title}</span>
                        {isLocal && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-extrabold bg-[#2ee59d]/20 text-[#2ee59d]">
                            Lokal
                          </span>
                        )}
                        {isYandex && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-extrabold bg-[#fc3f1d]/20 text-[#ff5733]">
                            Yandex
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-[#9a9ac0] truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && hasSearched && !errorMessage && (
            <div className="p-4 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ffb020]/15 text-[#ffb020] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#e8e8f5]">Hech narsa topilmadi</p>
                <p className="text-xs text-[#9a9ac0] mt-1 max-w-[280px] mx-auto">
                  Shahar, manzil yoki maktab nomini yozing (masalan: <b>"Urganch"</b> yoki <b>"1-maktab"</b>).
                </p>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onStartMapPickMode();
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#2ee59d] text-[#1b1b33] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#2ee59d]/20 hover:bg-[#25c485] transition"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Xaritadan qo'lda tanlash</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
