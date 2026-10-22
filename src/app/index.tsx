
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MapScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>TOWNSHIP INTELLIGENCE</Text>
      <Text style={styles.title}>Explore Your Township</Text>
      <Text style={styles.subtitle}>
        Bandar Bukit Raja • Fictional demonstration
      </Text>

      <View style={styles.map}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapTitle}>Geographic Map</Text>
        <Text style={styles.mapText}>
          Our interactive Bandar Bukit Raja map will appear here in Mobile M3.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Road Reference Legend</Text>
        <Text style={{ color: '#2563eb' }}>━━━━ Major roads</Text>
        <Text style={{ color: '#60a5fa' }}>━━━━ Local roads</Text>
        <Text style={{ color: '#93c5fd' }}>━━━━ Service roads</Text>
        <Text style={{ color: '#bfdbfe' }}>━━━━ Other roads</Text>
      </View>

      <Text style={styles.notice}>
        Academic prototype only. No live road conditions, verified closures,
        emergency reporting, or navigation advice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, gap: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 14 },
  map: {
    height: 300, backgroundColor: '#dbeafe', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', padding: 25,
  },
  mapIcon: { fontSize: 55, marginBottom: 12 },
  mapTitle: { fontSize: 20, fontWeight: '800', color: '#1e3a8a' },
  mapText: { textAlign: 'center', color: '#475569', marginTop: 10 },
  card: {
    padding: 20, backgroundColor: '#fff',
    borderRadius: 18, gap: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 5 },
  notice: { fontSize: 12, color: '#64748b', lineHeight: 19 },
});
