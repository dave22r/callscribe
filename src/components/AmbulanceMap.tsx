import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Ambulance } from '@/data/mockCalls';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AmbulanceMapProps {
    ambulances: Ambulance[];
    center?: [number, number];
    zoom?: number;
}

// Custom ambulance icons based on status
const getAmbulanceIcon = (status: string) => {
    const colors = {
        available: '#22c55e',
        'en-route': '#f59e0b',
        'on-scene': '#ef4444',
        returning: '#3b82f6'
    };

    const color = colors[status as keyof typeof colors] || '#6b7280';

    return L.divIcon({
        html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        🚑
      </div>
    `,
        className: 'ambulance-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

const AmbulanceMap = ({ ambulances, center = [49.2827, -123.1207], zoom = 12 }: AmbulanceMapProps) => {
    return (
        <div className="h-full w-full">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                className="rounded-lg"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {ambulances.map((ambulance) => {
                    // For demo: Generate random coordinates around Vancouver
                    // In production, use real GPS coordinates
                    const lat = 49.2827 + (Math.random() - 0.5) * 0.1;
                    const lng = -123.1207 + (Math.random() - 0.5) * 0.1;

                    return (
                        <Marker
                            key={ambulance.id}
                            position={[lat, lng]}
                            icon={getAmbulanceIcon(ambulance.status)}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">{ambulance.unit}</p>
                                    <p className="text-xs text-muted-foreground">{ambulance.crew}</p>
                                    <p className="text-xs mt-1">{ambulance.location}</p>
                                    <p className="text-xs font-semibold mt-1 capitalize">{ambulance.status.replace('-', ' ')}</p>
                                    {ambulance.eta && (
                                        <p className="text-xs text-orange-600 font-medium">ETA: {ambulance.eta} min</p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default AmbulanceMap;
