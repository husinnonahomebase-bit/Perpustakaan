import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Phone, Clock, BookOpen, Layers, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export interface BranchLocation {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  openHours: string;
  capacity: number;
  booksCount: number;
  librarianInCharge: string;
  status: string;
  services: string[];
}

interface LibraryBranchesMapProps {
  branches: BranchLocation[];
  onSelectBranch?: (branch: BranchLocation) => void;
}

export const LibraryBranchesMap: React.FC<LibraryBranchesMapProps> = ({
  branches,
  onSelectBranch,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchLocation | null>(branches[0] || null);
  const [activeMarker, setActiveMarker] = useState<BranchLocation | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Google Maps API Key from config or environment
  const mapsApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || firebaseConfig.apiKey || '';

  const defaultCenter = selectedBranch
    ? { lat: selectedBranch.lat, lng: selectedBranch.lng }
    : { lat: -6.2415, lng: 106.8005 };

  return (
    <div id="library-branches-map-container" className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Jaringan Lokasi & Titik Pengembalian Mandiri</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Peta Perpustakaan & Drop Box Pintar (Google Maps)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pantau sebaran titik layanan perpustakaan pusat, smart locker 24 jam, dan bus perpustakaan keliling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="px-3.5 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Mode: {mapType === 'roadmap' ? 'Peta Standar' : 'Satelit'}</span>
          </button>
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>GPS Akurat</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branch List / Selector */}
        <div className="lg:col-span-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {branches.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id;
            return (
              <div
                key={branch.id}
                id={`branch-card-${branch.id}`}
                onClick={() => {
                  setSelectedBranch(branch);
                  setActiveMarker(branch);
                  if (onSelectBranch) onSelectBranch(branch);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/60 dark:border-indigo-500/80 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {branch.code}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {branch.type}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {branch.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                  {branch.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{branch.address}, {branch.city}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{branch.openHours}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{branch.phone}</span>
                  </div>
                </div>

                {branch.services && branch.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {branch.services.map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[520px] relative">
          <div className="h-full w-full min-h-[480px] flex-1">
            <APIProvider apiKey={mapsApiKey}>
              <Map
                mapId="lumina_library_map_v1"
                defaultCenter={defaultCenter}
                center={selectedBranch ? { lat: selectedBranch.lat, lng: selectedBranch.lng } : defaultCenter}
                defaultZoom={14}
                mapTypeId={mapType}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
                className="w-full h-full min-h-[500px]"
              >
                {branches.map((b) => (
                  <AdvancedMarker
                    key={b.id}
                    position={{ lat: b.lat, lng: b.lng }}
                    onClick={() => {
                      setSelectedBranch(b);
                      setActiveMarker(b);
                    }}
                    title={b.name}
                  >
                    <Pin
                      background={selectedBranch?.id === b.id ? '#4f46e5' : '#0ea5e9'}
                      borderColor={selectedBranch?.id === b.id ? '#312e81' : '#0369a1'}
                      glyphColor="#ffffff"
                      scale={selectedBranch?.id === b.id ? 1.2 : 1.0}
                    />
                  </AdvancedMarker>
                ))}

                {activeMarker && (
                  <InfoWindow
                    position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                    onCloseClick={() => setActiveMarker(null)}
                  >
                    <div className="p-2 text-slate-900 max-w-xs">
                      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {activeMarker.type}
                      </div>
                      <h4 className="font-bold text-sm mt-0.5">{activeMarker.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{activeMarker.address}</p>
                      <div className="mt-2 text-xs text-slate-700 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{activeMarker.openHours}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{activeMarker.phone}</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Koleksi: <strong>{activeMarker.booksCount}</strong> buku</span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.lat},${activeMarker.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700"
                        >
                          Rute
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>

          {/* Bottom details bar */}
          {selectedBranch && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Koordinat: <strong>{selectedBranch.lat.toFixed(4)}, {selectedBranch.lng.toFixed(4)}</strong> ({selectedBranch.city})
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBranch.name + ' ' + selectedBranch.address)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Buka di Google Maps Navigasi</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
