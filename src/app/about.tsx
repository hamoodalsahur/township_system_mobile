
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>TOWNSHIP INTELLIGENCE</Text>
      <Text style={styles.title}>About This App</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Resident Mobile Prototype</Text>
        <Text style={styles.body}>
          This application is part of our fictional Township Road &
          Hazard Intelligence System university project.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Current Data Source</Text>
        <Text style={styles.body}>
          Mock Demo — bundled fictional sample information.
          The existing township backend is not connected yet.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Safety & Privacy</Text>
        <Text style={styles.body}>
          This is not an emergency service, navigation application,
          live road monitor, or source of verified road closures.
          Do not submit real incidents or personal information.
        </Text>
      </View>

      <Text style={styles.footer}>Mobile M1 • Development prototype</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, gap: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  card: {
    backgroundColor: '#fff', padding: 20,
    borderRadius: 18, gap: 10,
  },
  heading: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  body: { fontSize: 14, color: '#475569', lineHeight: 23 },
  footer: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
});
