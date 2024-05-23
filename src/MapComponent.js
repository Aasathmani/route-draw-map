// src/MapComponent.js

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import Draggable from 'react-draggable'; // Import the react-draggable library
import './App.css';

const MapComponent = () => {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const markerItemsRef = useRef(new L.LayerGroup());
  const [features, setFeatures] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    if (mapRef.current !== null) {
      return;
    }

    const map = L.map('map').setView([51.505, -0.09], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const editableLayers = drawnItemsRef.current;
    map.addLayer(editableLayers);

    const markerLayers = markerItemsRef.current;
    map.addLayer(markerLayers);

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

    // Add a custom button to toggle the sidebar
    L.Control.Custom = L.Control.extend({
      onAdd: function (map) {
        const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        button.innerHTML = 'Toggle Panel';
        button.style.backgroundColor = 'white';
        button.style.width = 'auto';
        button.style.height = 'auto';

        L.DomEvent.on(button, 'click', () => {
          setPanelVisible(!panelVisible);
        });

        return button;
      },
    });

    map.addControl(new L.Control.Custom({ position: 'topright' }));

    const addCircleMarkers = (layer) => {
      let latlngs = layer.getLatLngs();

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

      setWaypoints((prevWaypoints) => [...prevWaypoints, ...latlngs]);
    };

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      editableLayers.addLayer(layer);

      if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
        layer.setStyle({ color: 'blue', weight: 3 });
        addCircleMarkers(layer);
      }

      const newFeature = {
        id: layer._leaflet_id,
        type: layer instanceof L.Marker ? 'Marker' :
              layer instanceof L.Circle ? 'Circle' :
              layer instanceof L.Rectangle ? 'Rectangle' :
              layer instanceof L.Polyline ? 'Polyline' :
              layer instanceof L.Polygon ? 'Polygon' : 'Unknown',
        layer: layer,
        description: layer instanceof L.Marker ? `Marker at ${layer.getLatLng().toString()}` :
                     layer instanceof L.Circle ? `Circle at ${layer.getLatLng().toString()}` :
                     layer instanceof L.Rectangle ? `Rectangle at ${layer.getBounds().toBBoxString()}` :
                     layer instanceof L.Polyline ? `Polyline with ${layer.getLatLngs().length} points` :
                     layer instanceof L.Polygon ? `Polygon with ${layer.getLatLngs().length} points` : 'Unknown'
      };

      setFeatures(prevFeatures => [...prevFeatures, newFeature]);
    });

    map.on(L.Draw.Event.DELETED, (e) => {
      const layers = e.layers;
      const remainingFeatures = [];
      let remainingWaypoints = [];

      layers.eachLayer(layer => {
        markerLayers.clearLayers();
        editableLayers.removeLayer(layer);
      });

      editableLayers.eachLayer(layer => {
        remainingFeatures.push({
          id: layer._leaflet_id,
          type: layer instanceof L.Marker ? 'Marker' :
                layer instanceof L.Circle ? 'Circle' :
                layer instanceof L.Rectangle ? 'Rectangle' :
                layer instanceof L.Polyline ? 'Polyline' :
                layer instanceof L.Polygon ? 'Polygon' : 'Unknown',
          layer: layer,
          description: layer instanceof L.Marker ? `Marker at ${layer.getLatLng().toString()}` :
                       layer instanceof L.Circle ? `Circle at ${layer.getLatLng().toString()}` :
                       layer instanceof L.Rectangle ? `Rectangle at ${layer.getBounds().toBBoxString()}` :
                       layer instanceof L.Polyline ? `Polyline with ${layer.getLatLngs().length} points` :
                       layer instanceof L.Polygon ? `Polygon with ${layer.getLatLngs().length} points` : 'Unknown'
        });

        if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs().flat();
          remainingWaypoints = [...remainingWaypoints, ...latlngs];
        }
      });

      setFeatures(remainingFeatures);
      setWaypoints(remainingWaypoints);
    });
  }, [panelVisible]);

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div id="map" style={{ height: '100%', width: '100%' }}></div>
      {panelVisible && (
        <Draggable>
          <div style={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            width: '300px', 
            maxHeight: '90%', 
            background: 'black', 
            color: 'white', 
            padding: '10px', 
            overflowY: 'auto', 
            zIndex: 1000 
          }}>
            <h2>Features List</h2>
            <ul>
              {features.map((feature) => (
                <li key={feature.id}>{feature.description}</li>
              ))}
            </ul>
            <h2>Waypoints</h2>
            <ul>
              {waypoints.map((waypoint, index) => (
                <li key={index}>{`Lat: ${waypoint.lat}, Lng: ${waypoint.lng}`}</li>
              ))}
            </ul>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default MapComponent;
