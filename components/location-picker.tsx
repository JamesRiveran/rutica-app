import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationData {
  latitude: number;
  longitude: number;
  country?: string;
  province?: string;
  canton?: string;
  district?: string;
  address?: string;
}

interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (data: LocationData) => void;
  height?: number;
}

export default function LocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  height = 400,
}: LocationPickerProps) {
  const [latitude, setLatitude] = useState(initialLatitude || 9.9281); // Default Costa Rica
  const [longitude, setLongitude] = useState(initialLongitude || -84.0907);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Geocodificación inversa: obtener dirección desde coordenadas
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        return {
          latitude: lat,
          longitude: lng,
          country: addr.country || '',
          province: addr.state || addr.province || '',
          canton: addr.county || addr.municipality || '',
          district: addr.city || addr.town || addr.village || '',
          address: data.display_name || '',
        };
      }
    } catch (error) {
      console.error('[GEOCODING] Error:', error);
    } finally {
      setLoadingAddress(false);
    }
    
    // Si falla, retornar solo coordenadas
    return {
      latitude: lat,
      longitude: lng,
    };
  };

  useEffect(() => {
    if (!initialLatitude && !initialLongitude) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos tu ubicación para centrar el mapa'
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLat = location.coords.latitude;
      const newLng = location.coords.longitude;
      setLatitude(newLat);
      setLongitude(newLng);
      
      // Obtener dirección y notificar al padre
      const locationData = await reverseGeocode(newLat, newLng);
      onLocationSelect(locationData);
    } catch (error) {
      console.error('[LOCATION PICKER] Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  // HTML con Leaflet para mapa interactivo con pin movible
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .coordinates-display {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: white;
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      font-size: 12px;
      font-family: system-ui, -apple-system;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="coordinates-display">
    <div><b>Lat:</b> <span id="lat">${latitude.toFixed(6)}</span></div>
    <div><b>Lng:</b> <span id="lng">${longitude.toFixed(6)}</span></div>
  </div>

  <script>
    // Inicializar mapa
    const map = L.map('map').setView([${latitude}, ${longitude}], 15);

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Crear marcador ARRASTRABLE (draggable)
    const marker = L.marker([${latitude}, ${longitude}], {
      draggable: true,
      autoPan: true
    }).addTo(map);

    // Actualizar coordenadas cuando se mueve el marcador
    function updateCoordinates(lat, lng) {
      document.getElementById('lat').textContent = lat.toFixed(6);
      document.getElementById('lng').textContent = lng.toFixed(6);
      
      // Enviar coordenadas a React Native (WebView) o al padre (iframe en web)
      const message = JSON.stringify({
        latitude: lat,
        longitude: lng
      });
      
      if (window.ReactNativeWebView) {
        // Mobile: usar postMessage de WebView
        window.ReactNativeWebView.postMessage(message);
      } else {
        // Web: usar postMessage del iframe
        window.parent.postMessage(message, '*');
      }
    }

    // Evento cuando se arrastra el marcador
    marker.on('dragend', function(e) {
      const position = marker.getLatLng();
      updateCoordinates(position.lat, position.lng);
    });

    // Evento cuando se hace clic en el mapa (mover el marcador)
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    // Agregar popup al marcador
    marker.bindPopup("<b>Ubicación del negocio</b><br>Arrastra este pin para cambiar").openPopup();
  </script>
</body>
</html>
`;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.latitude && data.longitude) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        
        // Obtener dirección automáticamente
        reverseGeocode(data.latitude, data.longitude).then((locationData) => {
          onLocationSelect(locationData);
        });
      }
    } catch (error) {
      console.error('[LOCATION PICKER] Error parsing message:', error);
    }
  };

  // Usar Leaflet interactivo en todas las plataformas (web y mobile)
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Mueve el pin a la ubicación del negocio
        </Text>
        <Pressable
          style={styles.button}
          onPress={getCurrentLocation}
          disabled={loadingLocation}
        >
          <Text style={styles.buttonText}>
            {loadingLocation ? 'Obteniendo...' : '📍 Mi ubicación'}
          </Text>
        </Pressable>
      </View>

      {loadingAddress && (
        <View style={styles.loadingAddressBar}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingAddressText}>
            Obteniendo dirección...
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {Platform.OS === 'web' ? (
        // En web: renderizar HTML directamente
        <iframe
          srcDoc={mapHTML}
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 0,
            flex: 1,
          }}
          onLoad={(e: any) => {
            setLoading(false);
            // Escuchar mensajes del iframe
            window.addEventListener('message', (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.latitude && data.longitude) {
                  setLatitude(data.latitude);
                  setLongitude(data.longitude);
                  
                  // Obtener dirección automáticamente
                  reverseGeocode(data.latitude, data.longitude).then((locationData) => {
                    onLocationSelect(locationData);
                  });
                }
              } catch (error) {
                // Ignorar mensajes no JSON
              }
            });
          }}
        />
      ) : (
        // En mobile: usar WebView
        <WebView
          source={{ html: mapHTML }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
        />
      )}

      <Text style={styles.hint}>
        💡 Arrastra el pin o haz clic en el mapa para cambiar la ubicación
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 8,
  },
  loadingAddressText: {
    fontSize: 12,
    color: '#0066cc',
  },
  coordinatesWeb: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  coordText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hint: {
    padding: 8,
    backgroundColor: '#f0f9ff',
    color: '#0066cc',
    fontSize: 12,
    textAlign: 'center',
  },
});
