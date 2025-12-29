import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      console.log('[MAPS] Solicitando permisos de ubicación...');
      
      let { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('[MAPS] Estado actual de permisos:', currentStatus);
      
      if (currentStatus !== 'granted') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[MAPS] Resultado de solicitud:', status);
        
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }
      }

      console.log('[MAPS] Obteniendo ubicación...');
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log('[MAPS] Ubicación obtenida:', currentLocation.coords);
      setLocation(currentLocation);
      setLoading(false);
    } catch (error: any) {
      console.error('[MAPS] Error al obtener ubicación:', error);
      setErrorMsg(error.message || 'Error al obtener ubicación');
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (errorMsg || !location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {errorMsg || 'No se pudo obtener la ubicación'}
        </Text>
        <Text style={styles.helpText}>
          {Platform.OS === 'web'
            ? 'Asegúrate de permitir el acceso a la ubicación en tu navegador'
            : 'Verifica que los permisos de ubicación estén habilitados en la configuración de la app'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestLocation}>
          <Text style={styles.buttonText}>🔄 Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // HTML para el mapa interactivo con Leaflet (OpenStreetMap)
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${location.coords.latitude}, ${location.coords.longitude}], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        
        const marker = L.marker([${location.coords.latitude}, ${location.coords.longitude}]).addTo(map);
        marker.bindPopup('<b>Tu ubicación</b><br>Estás aquí').openPopup();
        
        const circle = L.circle([${location.coords.latitude}, ${location.coords.longitude}], {
          color: '#007AFF',
          fillColor: '#007AFF',
          fillOpacity: 0.2,
          radius: ${location.coords.accuracy || 50}
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  // Vista para Web con iframe de Google Maps
  if (Platform.OS === 'web') {
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${location.coords.latitude},${location.coords.longitude}&zoom=16`;
    
    return (
      <View style={styles.container}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
        />
        <View style={styles.webInfoCard}>
          <Text style={styles.infoText}>
            📍 Lat: {location.coords.latitude.toFixed(6)} | Long: {location.coords.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
    );
  }

  // Vista para iOS/Android con WebView y Leaflet
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        )}
      />
      <View style={styles.mobileInfoCard}>
        <Text style={styles.infoText}>
          📍 Lat: {location.coords.latitude.toFixed(6)} | Long: {location.coords.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mobileInfoCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});
