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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Colors, Typography, Spacing, Radius } from "../../constants/design";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    
    try {
      await register(email.trim(), password, name.trim() || undefined);
      router.back();
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.iconLarge}>✨</Text>
          <Text style={styles.title}>Join SnapCos</Text>
          <Text style={styles.subtitle}>Create an account to start your theatrical journey.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Doe"
              placeholderTextColor={Colors.textDim}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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
              autoComplete="password-new"
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnCrimson, isSubmitting && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnCrimsonText}>Create account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/auth/login")}>
            <Text style={styles.linkText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow: 1,
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
