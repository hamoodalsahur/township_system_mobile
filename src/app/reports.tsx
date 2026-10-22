
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MOCK_REPORTS } from '../data/mock-reports';

export default function ReportsScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MOCK DEMO MODE</Text>
      <Text style={styles.title}>Community Reports</Text>
      <Text style={styles.subtitle}>
        Fictional examples — not actual road conditions.
      </Text>

      {MOCK_REPORTS.map((report) => (
        <View key={report.id} style={styles.card}>
          <Text style={styles.category}>{report.category}</Text>
          <Text style={styles.description}>{report.description}</Text>
          <Text style={styles.detail}>Location: {report.location}</Text>
          <Text style={styles.detail}>Suspected impact: {report.impact}</Text>
          <Text style={styles.status}>
            {report.reviewState === 'corroborated'
              ? 'Human-reviewed fictional report'
              : 'Awaiting fictional review'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, gap: 15 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', marginBottom: 6 },
  card: {
    backgroundColor: '#fff', padding: 18,
    borderRadius: 18, gap: 9,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  category: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  description: { fontSize: 14, color: '#334155', lineHeight: 21 },
  detail: { fontSize: 12, color: '#64748b' },
  status: { color: '#0f766e', fontSize: 12, fontWeight: '700' },
});
