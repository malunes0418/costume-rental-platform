import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Colors, Typography, Spacing, Radius } from "../../constants/design";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    
    try {
      await login(email.trim(), password);
      router.back();
    } catch (e: any) {
      setError(e.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.iconLarge}>🎭</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to save favorites and book costumes.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnCrimson, isSubmitting && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnCrimsonText}>Log in</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <TouchableOpacity onPress={() => router.replace("/auth/register")}>
            <Text style={styles.linkText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    padding: Spacing[6],
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing[8],
  },
  iconLarge: {
    fontSize: 48,
    marginBottom: Spacing[3],
  },
  title: {
    fontFamily: Typography.displayBold,
    fontSize: Typography["2xl"],
    color: Colors.text,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: "center",
  },
  form: {
    gap: Spacing[4],
  },
  inputGroup: {
    gap: Spacing[2],
  },
  label: {
    fontFamily: Typography.bodySemibold,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing[4],
    color: Colors.text,
    fontFamily: Typography.body,
    fontSize: Typography.base,
  },
  errorContainer: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBdr,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  errorText: {
    color: Colors.error,
    fontFamily: Typography.body,
    fontSize: Typography.sm,
  },
  btnCrimson: {
    backgroundColor: Colors.crimson,
    padding: Spacing[4],
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing[2],
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnCrimsonText: {
    fontFamily: Typography.bodySemibold,
    color: Colors.white,
    fontSize: Typography.base,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing[8],
  },
  footerText: {
    fontFamily: Typography.body,
    color: Colors.textMuted,
  },
  linkText: {
    fontFamily: Typography.bodySemibold,
    color: Colors.goldLight,
  },
});
