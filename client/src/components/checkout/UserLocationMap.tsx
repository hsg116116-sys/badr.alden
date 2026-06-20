
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface UserLocationMapProps {
    initialLocation?: { lat: number; lng: number };
    onLocationSelect: (latlng: { lat: number; lng: number }) => void;
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom(), { animate: true, duration: 0.8 });
        }
    }, [position, map]);
    return null;
}

export default function UserLocationMap({ initialLocation, onLocationSelect }: UserLocationMapProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : null
    );

    // Sync when parent passes a saved location (e.g. from user profile GPS)
    useEffect(() => {
        if (initialLocation?.lat && initialLocation?.lng) {
            setPosition([initialLocation.lat, initialLocation.lng]);
        }
    }, [initialLocation?.lat, initialLocation?.lng]);

    const handleMapClick = (latlng: L.LatLng) => {
        const newPos: [number, number] = [latlng.lat, latlng.lng];
        setPosition(newPos);
        onLocationSelect({ lat: latlng.lat, lng: latlng.lng });
    };

    const locateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setPosition(newPos);
                onLocationSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> حدد موقعك بدقة على الخريطة لتحديد رسوم التوصيل
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={locateMe}
                    className="gap-2 rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                >
                    <Navigation className="w-3 h-3" /> حدد موقعي الحالي
                </Button>
            </div>

            <div className="h-[350px] w-full rounded-[2rem] overflow-hidden border-2 border-primary/10 shadow-lg relative z-0">
                <MapContainer
                    center={position || [30.0444, 31.2357]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapEvents onMapClick={handleMapClick} />
                    <FlyTo position={position} />
                    {position && <Marker position={position} />}
                </MapContainer>

                {!position && (
                    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[1000] flex items-center justify-center pointer-events-none">
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-2 max-w-[250px] text-center">
                            <MapPin className="w-8 h-8 text-primary animate-bounce" />
                            <p className="text-sm font-bold text-slate-800">انقر على الخريطة لتحديد موقع التوصيل</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
