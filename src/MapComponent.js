// src/MapComponent.js

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import './App.css';  // Ensure your custom CSS is imported

const MapComponent = () => {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const markerItemsRef = useRef(new L.LayerGroup());

  useEffect(() => {
    // Check if the map is already initialized
    if (mapRef.current !== null) {
      return;
    }

    // Initialize the map and set its view
    const map = L.map('map').setView([51.505, -0.09], 13);
    mapRef.current = map;

    // Load and display tile layers on the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initialize the FeatureGroup to store editable layers
    const editableLayers = drawnItemsRef.current;
    map.addLayer(editableLayers);

    // Initialize the LayerGroup to store circle markers
    const markerLayers = markerItemsRef.current;
    map.addLayer(markerLayers);

    // Set up the draw control and pass it the FeatureGroup of editable layers
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: editableLayers,
      },
      draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);

    // Function to add circle markers to vertices
    const addCircleMarkers = (layer) => {
      let latlngs = layer.getLatLngs();

      // Flatten the latlngs array if it is nested (for polygons)
      const flattenLatLngs = (latlngs) => {
        if (Array.isArray(latlngs[0])) {
          return latlngs.flat();
        }
        return latlngs;
      };

      latlngs = flattenLatLngs(latlngs);

      latlngs.forEach(latlng => {
        const circleMarker = L.circleMarker(latlng, {
          radius: 4,
          fillColor: 'yellow',
          color: 'white',
          weight: 1,
          opacity: 1,
          fillOpacity: 1
        }).addTo(markerLayers);
      });
    };

    // Handle created event to add layer to editableLayers and add circle markers
    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      editableLayers.addLayer(layer);

      // Add custom circle markers to the vertices
      if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
        layer.setStyle({ color: 'blue', weight: 3 });
        addCircleMarkers(layer);
      }
    });

    // Handle delete event to remove circle markers when layers are deleted
    map.on(L.Draw.Event.DELETED, (e) => {
      const layers = e.layers;
      layers.eachLayer(layer => {
        markerLayers.clearLayers();
      });
    });
  }, []);

  return <div id="map" style={{ height: '100vh' }}></div>;
};

export default MapComponent;
