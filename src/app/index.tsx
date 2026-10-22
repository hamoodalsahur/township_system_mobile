
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const DEMO_LOCATIONS = [
  {
    id: 'A',
    title: 'Fictional flooding report',
    description: 'Example flooding scenario. Not a real incident.',
    latitude: 3.0876,
    longitude: 101.4318,
  },
  {
    id: 'B',
    title: 'Fictional fallen tree report',
    description: 'Example fallen-tree scenario. Not a real incident.',
    latitude: 3.0891,
    longitude: 101.4392,
  },
  {
    id: 'C',
    title: 'Fictional pothole report',
    description: 'Example road-surface scenario. Not a real incident.',
    latitude: 3.0833,
    longitude: 101.4257,
  },
];

export default function MapScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = DEMO_LOCATIONS.find(
    (item) => item.id === selectedId
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        TOWNSHIP INTELLIGENCE
      </Text>

      <Text style={styles.title}>Township Map</Text>

      <Text style={styles.subtitle}>
        Bandar Bukit Raja · Fictional demonstration
      </Text>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 3.087,
            longitude: 101.433,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {DEMO_LOCATIONS.map((item) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              title={item.title}
              description={item.description}
              pinColor="#0f766e"
              onPress={() => setSelectedId(item.id)}
            />
          ))}
        </MapView>

        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            DEMO MARKERS ONLY
          </Text>
        </View>
      </View>

      {selected ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {selected.title}
          </Text>
          <Text style={styles.body}>
            {selected.description}
          </Text>
          <Text style={styles.details}>
            Example location {selected.id}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Explore the map
          </Text>
          <Text style={styles.body}>
            Drag to explore Bandar Bukit Raja, pinch
            to zoom, or tap a demonstration marker
            to view its details.
          </Text>
        </View>
      )}

      <Text style={styles.notice}>
        Academic prototype only. Markers are invented
        examples, not real incidents, confirmed road
        closures, emergency information or navigation advice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 45,
    gap: 15,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f766e',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  mapContainer: {
    height: 440,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  card: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  details: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '700',
  },
  notice: {
    fontSize: 12,
    lineHeight: 19,
    color: '#64748b',
  },
});
