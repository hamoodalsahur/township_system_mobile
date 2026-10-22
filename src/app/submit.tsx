
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    View,
} from 'react-native';

export default function SubmitScreen() {
  const [description, setDescription] = useState('');

  function submitDemo() {
    const length = description.trim().length;
    if (length < 8 || description.length > 400) {
      Alert.alert('Invalid description', 'Enter between 8 and 400 characters.');
      return;
    }

    Alert.alert(
      'Mock Demo Only',
      'This is a form preview. Nothing was sent to management or saved.'
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MOCK DEMO MODE</Text>
      <Text style={styles.title}>Submit a Report</Text>
      <Text style={styles.subtitle}>
        Practice reporting a fictional township issue.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Describe a made-up township issue..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          maxLength={400}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{description.length}/400</Text>

        <Text style={styles.note}>
          Category, suspected impact, location selection and private
          sample-photo upload will be added in later milestones.
        </Text>

        <Pressable style={styles.button} onPress={submitDemo}>
          <Text style={styles.buttonText}>Preview Submission</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        This prototype does not accept real emergencies, live road reports,
        or identifying personal information.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, gap: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 18, gap: 14 },
  label: { fontWeight: '700', fontSize: 15, color: '#0f172a' },
  input: {
    height: 130, padding: 14, borderWidth: 1,
    borderColor: '#cbd5e1', borderRadius: 12,
    fontSize: 14, color: '#0f172a',
  },
  counter: { textAlign: 'right', fontSize: 12, color: '#64748b' },
  note: { fontSize: 12, color: '#64748b', lineHeight: 20 },
  button: {
    backgroundColor: '#0f766e', padding: 16,
    alignItems: 'center', borderRadius: 13,
  },
  buttonText: { color: '#fff', fontWeight: '800' },
});
