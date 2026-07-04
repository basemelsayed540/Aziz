import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { type Shipment } from '../services/supabase';

const API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function ShipmentsMarkers({ shipments }: { shipments: Shipment[] }) {
  const geocodingLib = useMapsLibrary('geocoding');
  const [locations, setLocations] = useState<Record<string, google.maps.LatLngLiteral>>({});
  const map = useMap();

  useEffect(() => {
    if (!geocodingLib || !map) return;

    const geocoder = new geocodingLib.Geocoder();
    const newLocations = { ...locations };

    // Find shipments that need geocoding
    const needsGeocoding = shipments.filter(s => !newLocations[s.m]);
    
    if (needsGeocoding.length === 0) return;

    // Rate limit handling (process sequentially with a delay to avoid API limits)
    let isCancelled = false;
    
    const geocodeNext = async (index: number) => {
      if (isCancelled || index >= needsGeocoding.length) {
        // Only fit bounds if we have locations to show, and on first load.
        // Doing it constantly would be annoying to the user.
        return;
      }
      
      const s = needsGeocoding[index];
      const addressString = `مصر, ${s["الزون"]}, ${s["العنوان"] || ''}`;

      try {
        const response = await geocoder.geocode({ address: addressString });
        if (response.results && response.results[0]) {
          const loc = response.results[0].geometry.location;
          setLocations(prev => ({
            ...prev,
            [s.m]: { lat: loc.lat(), lng: loc.lng() }
          }));
        }
      } catch (e: any) {
        // ZERO_RESULTS is common if address is bad
        console.warn(`Geocode failed for ${s.m} (${addressString}):`, e?.code);
      }

      // 400ms delay to prevent hitting OVER_QUERY_LIMIT
      setTimeout(() => geocodeNext(index + 1), 400);
    };

    geocodeNext(0);

    return () => {
      isCancelled = true;
    };
  }, [shipments, geocodingLib, map]);

  // Adjust map bounds when locations change substantially
  useEffect(() => {
    if (!map || Object.keys(locations).length === 0) return;
    
    // Only fitbounds on initial load or major changes to avoid jumping when user is manually panning
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;
    
    shipments.forEach(s => {
      if (locations[s.m]) {
        bounds.extend(locations[s.m]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      // Small timeout to ensure markers rendered before fitting bounds
      setTimeout(() => {
        map.fitBounds(bounds, 50); // 50px padding
      }, 100);
    }
  }, [map, shipments.length, Object.keys(locations).length > 0]);

  const getStatusColor = (status: string) => {
    const s = status?.trim();
    switch(s) {
      case 'قيد التوصيل': return '#f59e0b'; // amber-500
      case 'تم':
        return '#10b981'; // emerald-500
      case 'مؤجل': return '#f97316'; // orange-500
      case 'الغاء':
        return '#ef4444'; // red-500
      case 'شحن': return '#3b82f6'; // blue-500
      case 'تعديل سعر': return '#6b7280'; // gray-500
      default: return '#0ea5e9'; // primary
    }
  };

  return (
    <>
      {shipments.map(s => {
        const loc = locations[s.m];
        if (!loc) return null;
        
        return (
          <AdvancedMarker 
            key={s.m} 
            position={loc} 
            title={s["اسم العميل"]}
          >
            <Pin background={getStatusColor(s["الحالة"] || '')} glyphColor="#fff" borderColor="rgba(255,255,255,0.2)" />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export function ShipmentsMap({ shipments }: { shipments: Shipment[] }) {
  if (!hasValidKey) {
    return (
      <div className="bg-[#1e1e1e] rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center h-[50vh] text-center shadow-md">
        <h2 className="text-xl font-bold text-white mb-3">خرائط جوجل غير مفعلة</h2>
        <p className="text-gray-400 text-sm mb-4">لإظهار الشحنات على الخريطة، يجب إضافة مفتاح API خاص بخرائط جوجل.</p>
        <div className="text-right text-sm text-gray-300 bg-[#2a2a2a] p-4 rounded-lg w-full max-w-sm">
          <p className="font-bold mb-2">كيفية التفعيل:</p>
          <ul className="list-decimal list-inside space-y-1.5 opacity-90 text-xs">
            <li>اذهب إلى الإعدادات في لوحة التحكم (علامة ⚙️ أعلى اليمين)</li>
            <li>اختر <strong>Secrets</strong></li>
            <li>أضف <code className="bg-black/30 px-1 py-0.5 rounded text-primary">GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>أضف مفتاح الخرائط الخاص بك</li>
          </ul>
        </div>
      </div>
    );
  }

  // Default to Cairo
  const defaultCenter = { lat: 30.0444, lng: 31.2357 };

  return (
    <div className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border border-white/10 relative shadow-md">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={11}
          mapId="ELSAYED_DELIVERY_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          <ShipmentsMarkers shipments={shipments} />
        </Map>
      </APIProvider>
    </div>
  );
}
