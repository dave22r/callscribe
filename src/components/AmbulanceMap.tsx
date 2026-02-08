import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Ambulance, EmergencyCall } from '@/data/mockCalls';

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
    calls: EmergencyCall[];
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

// Custom caller icon based on urgency
const getCallerIcon = (urgency: string) => {
    const colors = {
        critical: '#ef4444',
        urgent: '#f59e0b',
        stable: '#22c55e'
    };

    const color = colors[urgency as keyof typeof colors] || '#6b7280';

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
        📍
      </div>
    `,
        className: 'caller-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

const AmbulanceMap = ({ ambulances, calls, center = [49.2827, -123.1207], zoom = 13 }: AmbulanceMapProps) => {
    // Hardcoded downtown Vancouver locations for demo
    const downtownLocations = {
        ambulances: [
            { id: 'amb-1', lat: 49.2827, lng: -123.1207 }, // Downtown core
            { id: 'amb-2', lat: 49.2820, lng: -123.1171 }, // Near Granville
            { id: 'amb-3', lat: 49.2614, lng: -123.1139 }, // South Cambie
            { id: 'amb-4', lat: 49.2668, lng: -123.1482 }, // West 41st area
            { id: 'amb-5', lat: 49.2809, lng: -123.1088 }, // East Hastings area
        ],
        callers: [
            { id: 'call-001', lat: 49.2845, lng: -123.1210 }, // Granville St area
            { id: 'call-002', lat: 49.2618, lng: -123.1142 }, // Cambie St area
            { id: 'call-003', lat: 49.2665, lng: -123.1489 }, // West 41st area
            { id: 'call-004', lat: 49.2812, lng: -123.1095 }, // East Hastings area
            { id: 'call-005', lat: 49.2633, lng: -123.1388 }, // West Broadway area
        ]
    };

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

                {/* Ambulance markers */}
                {ambulances.map((ambulance, index) => {
                    const location = downtownLocations.ambulances[index] || downtownLocations.ambulances[0];

                    return (
                        <Marker
                            key={ambulance.id}
                            position={[location.lat, location.lng]}
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

                {/* Caller markers */}
                {calls.map((call, index) => {
                    const location = downtownLocations.callers[index] || downtownLocations.callers[0];

                    return (
                        <Marker
                            key={call.id}
                            position={[location.lat, location.lng]}
                            icon={getCallerIcon(call.urgency)}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">{call.callerName}</p>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold" style={{
                                        color: call.urgency === 'critical' ? '#ef4444' : 
                                               call.urgency === 'urgent' ? '#f59e0b' : '#22c55e'
                                    }}>
                                        {call.urgency}
                                    </p>
                                    <p className="text-xs mt-1">{call.location}</p>
                                    <p className="text-xs mt-1">{call.summary}</p>
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
