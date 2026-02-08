import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Vancouver coordinates
const VANCOUVER_COORDS = { latitude: 49.2827, longitude: -123.1207 };

// Mock patient and ambulance data
const patients = [
  { id: 1, name: 'Patient 1', latitude: 49.285, longitude: -123.12 },
  { id: 2, name: 'Patient 2', latitude: 49.28, longitude: -123.13 },
];

const ambulances = [
  { id: 1, name: 'Ambulance 1', latitude: 49.283, longitude: -123.115 },
  { id: 2, name: 'Ambulance 2', latitude: 49.281, longitude: -123.125 },
];

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2F0aHJ5bmV6b25nIiwiYSI6ImNtbGN4MWVnbzB4YTAzZXEyMTRzZm80YWMifQ.WnUSaAgpyn2K9ir22vABgA'; // Replace with your token
mapboxgl.accessToken = MAPBOX_TOKEN;

const VancouverMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [VANCOUVER_COORDS.longitude, VANCOUVER_COORDS.latitude],
      zoom: 12,
    });

    // Add patient markers
    patients.forEach((patient) => {
      new mapboxgl.Marker({ color: 'red' })
        .setLngLat([patient.longitude, patient.latitude])
        .setPopup(new mapboxgl.Popup().setText(patient.name))
        .addTo(map.current);
    });

    // Add ambulance markers
    ambulances.forEach((ambulance) => {
      new mapboxgl.Marker({ color: 'blue' })
        .setLngLat([ambulance.longitude, ambulance.latitude])
        .setPopup(new mapboxgl.Popup().setText(ambulance.name))
        .addTo(map.current);
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />
  );
};

export default VancouverMap;
