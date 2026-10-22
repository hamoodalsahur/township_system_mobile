
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function AboutScreen() {
  const [serverUrl, setServerUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState('');

  async function testConnection() {
    const url = serverUrl.trim().replace(/\/+$/, '');

    if (
      !/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):\d{2,5}$/.test(url)
    ) {
      setResult('Enter your PC private-network URL, for example http://192.168.1.23:3000');
      return;
    }

    setChecking(true);
    setResult('Connecting...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `${url}/api/v2/hazards`,
        { signal: controller.signal, cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data: unknown = await response.json();

      if (
        typeof data !== 'object' ||
        data === null ||
        !('reports' in data) ||
        !Array.isArray(data.reports)
      ) {
        throw new Error('Unexpected backend response');
      }

      setResult(
        `Connected successfully! ${data.reports.length} fictional reports available.`
      );
    } catch (error) {
      setResult(
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : 'Connection failed. Check your PC IP and Wi-Fi.'
      );
    } finally {
      clearTimeout(timeout);
      setChecking(false);
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>TOWNSHIP INTELLIGENCE</Text>
      <Text style={styles.title}>About & Connection</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Resident Mobile Prototype</Text>
        <Text style={styles.body}>
          Fictional Township Road & Hazard Intelligence System
          demonstration for Bandar Bukit Raja.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Current Mode: Mock Demo</Text>
        <Text style={styles.body}>
          The app currently uses bundled fictional reports.
          Testing the backend connection does not switch the
          Reports or Submit screens to live backend data.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Backend Connection Test</Text>

        <Text style={styles.body}>
          Enter the private-network address of your Windows PC.
          This only reads fictional reports.
        </Text>

        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://192.168.1.23:3000"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Pressable
          style={[styles.button, checking && styles.disabled]}
          onPress={testConnection}
          disabled={checking}
        >
          {checking
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={styles.buttonText}>Test Connection</Text>
          }
        </Pressable>

        {result ? (
          <Text accessibilityRole="text" style={styles.result}>
            {result}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Safety & Privacy</Text>
        <Text style={styles.body}>
          This is not an emergency service, live road monitor,
          navigation application, or source of verified closures.
          Do not submit actual incidents or personal information.
          Existing management actions and private photos remain
          restricted to the management application.
        </Text>
      </View>

      <Text style={styles.footer}>
        Mobile M1 · Local development only
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
    padding: 22,
    paddingTop: 24,
    gap: 16,
    paddingBottom: 40,
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
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 18,
    gap: 12,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 23,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    color: '#0f172a',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  result: {
    fontSize: 13,
    lineHeight: 20,
    color: '#0f766e',
  },
  footer: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 12,
  },
});
