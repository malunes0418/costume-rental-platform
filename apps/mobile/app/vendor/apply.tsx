import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { applyForVendor } from "../../lib/api";
import { Colors, Typography, Spacing, Radius } from "../../constants/design";

export default function VendorApplyScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token || !storeName) return;
    setLoading(true);
    try {
      await applyForVendor({ store_name: storeName, store_description: description }, token);
      router.replace("/vendor");
    } catch (e) {
      console.error(e);
      alert("Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Application</Text>
      <Text style={styles.subtitle}>Join our curated marketplace of high-end theatrical wear.</Text>
      
      <Text style={styles.label}>Store Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Royal Garments"
        placeholderTextColor={Colors.textDim}
        value={storeName}
        onChangeText={setStoreName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell us about the quality and style of your collection..."
        placeholderTextColor={Colors.textDim}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.btnCrimson} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnCrimsonText}>Submit Application</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing[6], paddingTop: 60 },
  title: { fontFamily: Typography.displayBold, fontSize: Typography["2xl"], color: Colors.gold, marginBottom: Spacing[1] },
  subtitle: { fontFamily: Typography.body, fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing[8] },
  label: { fontFamily: Typography.bodySemibold, fontSize: Typography.xs, color: Colors.textMuted, marginBottom: Spacing[2], textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing[4], color: Colors.text, fontFamily: Typography.body, marginBottom: Spacing[6], fontSize: Typography.base },
  textArea: { height: 120, textAlignVertical: "top" },
  btnCrimson: { backgroundColor: Colors.crimson, padding: Spacing[4], borderRadius: Radius.full, alignItems: "center", marginTop: Spacing[4] },
  btnCrimsonText: { fontFamily: Typography.bodySemibold, color: Colors.white, fontSize: Typography.base },
});
