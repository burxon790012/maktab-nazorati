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
  Navigation,
  Check
} from 'lucide-react';
import { School, Student } from '@/types';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  category: 'local_school' | 'local_student' | 'external_school' | 'external_address';
  source: 'db' | 'google' | 'osm';
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
  googleMapsApiKey,
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
        // Match numbers in school name
        if (nameLower.includes(targetNum)) {
          matched = true;
        }
      }

      if (matched && sch.lat && sch.lng) {
        localItems.push({
          id: `local_sch_${sch.id}`,
          title: sch.name,
          subtitle: `${sch.address} • (Mavjud Maktab)`,
          lat: sch.lat,
          lng: sch.lng,
          category: 'local_school',
          source: 'db',
          originalItem: sch,
        });
      }
    });

    // B) Search Local Students
    students.forEach((std) => {
      const nameLower = std.name.toLowerCase();
      const idLower = (std.uniqueId || '').toLowerCase();
      const classLower = (std.className || '').toLowerCase();

      if (nameLower.includes(text) || idLower.includes(text) || classLower.includes(text)) {
        if (std.telemetry && std.telemetry.latitude && std.telemetry.longitude) {
          localItems.push({
            id: `local_std_${std.id}`,
            title: std.name,
            subtitle: `${std.className} • ${std.schoolName || ''}`,
            lat: std.telemetry.latitude,
            lng: std.telemetry.longitude,
            category: 'local_student',
            source: 'db',
            originalItem: std,
          });
        }
      }
    });

    return localItems;
  };

  // 2. Debounced Search Execution (400ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
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

    // Immediate Local DB matching
    const localMatches = searchLocalDb(trimmed);
    setResults(localMatches);

    // Cancel in-flight external request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const timer = setTimeout(async () => {
      let combined: SearchResultItem[] = [...localMatches];

      // A) Try Google Places if SDK is loaded on window
      let googleSuccess = false;
      if (window.google && window.google.maps && window.google.maps.places) {
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
            // Note: Places predictions have description & place_id
            // Geocode first prediction for immediate coordinate
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

      // B) Server-side Nominatim Proxy Search (always runs or fallbacks)
      if (!googleSuccess || combined.length < 2) {
        try {
          const lat = currentSchool?.lat || 41.311081;
          const lng = currentSchool?.lng || 69.240562;

          const res = await fetch(
            `/api/geocode/search?q=${encodeURIComponent(trimmed)}&lat=${lat}&lng=${lng}`,
            { signal: controller.signal }
          );

          if (!res.ok) {
            if (res.status === 503) {
              setErrorMessage("Qidiruv xizmati vaqtincha ishlamayapti, qayta urinib ko'ring");
            } else {
              setErrorMessage("Qidiruv serverida xatolik yuz berdi");
            }
          } else {
            const data = await res.json();
            if (data.success && data.results) {
              data.results.forEach((item: any) => {
                // Avoid duplicating local schools
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
            } else if (data.error === 'NETWORK_ERROR') {
              setErrorMessage("Qidiruv xizmati vaqtincha ishlamayapti, qayta urinib ko'ring");
            }
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('Qidiruvda tarmoq xatosi:', err.message);
            setErrorMessage("Qidiruv xizmati vaqtincha ishlamayapti, qayta urinib ko'ring");
          }
        }
      }

      setResults(combined);
      setIsLoading(false);
      setHasSearched(true);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [query, schools, students, currentSchool]);

  // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

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
            if (query.trim().length >= 3) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Maktab yoki manzil qidirish (masalan: Urganch 30-maktab)..."
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
                <div className="font-bold text-[11px]">{errorMessage}</div>
                <div className="text-[10px] text-[#9a9ac0] mt-0.5">
                  Lokal maktablardan foydalaning yoki xaritadan qo'lda tanlang.
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-[#9a9ac0] uppercase tracking-wider flex items-center justify-between">
                <span>Topilgan natijalar ({results.length})</span>
                <span className="text-[9px] text-[#4db5ff]">Enter orqali tanlash</span>
              </div>

              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isLocal = item.source === 'db';
                const isSchool = item.category === 'local_school' || item.category === 'external_school';

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
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#2ee59d]/20 text-[#2ee59d]">
                            Lokal
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] text-[#9a9ac0] truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State (NO browser alert) */}
          {!isLoading && results.length === 0 && hasSearched && !errorMessage && (
            <div className="p-4 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ffb020]/15 text-[#ffb020] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#e8e8f5]">Hech narsa topilmadi</p>
                <p className="text-[11px] text-[#9a9ac0] mt-1 max-w-[280px] mx-auto">
                  Boshqacha yozib ko'ring (masalan: <b>"30-sonli maktab"</b> yoki <b>"Urganch"</b>) yoki xaritada bosib joyni qo'lda belgilang.
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
