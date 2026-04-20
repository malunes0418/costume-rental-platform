import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getVendorProfile, listVendorCostumes, VendorProfile } from "../../lib/api";
import { Colors, Typography, Spacing, Radius } from "../../constants/design";

export default function VendorDashboardScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const res = await getVendorProfile(token!);
        setProfile(res.data);
        if (res.data?.status === "APPROVED") {
          const costRes = await listVendorCostumes(token!);
          setCostumes(costRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Become a Vendor</Text>
        <Text style={styles.subtitle}>Start renting out your luxurious costumes today.</Text>
        <TouchableOpacity style={styles.btnCrimson} onPress={() => router.push("/vendor/apply")}>
          <Text style={styles.btnCrimsonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{profile.store_name}</Text>
        <Text style={styles.status}>STATUS: {profile.status}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Listings</Text>
          <TouchableOpacity style={styles.btnAdd}>
            <Text style={styles.btnAddText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={costumes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardPrice}>${item.base_price_per_day}/day</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No costumes listed yet.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: Spacing[6] },
  title: { fontFamily: Typography.displayBold, fontSize: Typography["2xl"], color: Colors.gold, marginBottom: Spacing[2] },
  subtitle: { fontFamily: Typography.body, fontSize: Typography.base, color: Colors.textMuted, marginBottom: Spacing[6], textAlign: "center" },
  status: { fontFamily: Typography.bodySemibold, fontSize: Typography.xs, color: Colors.goldLight, letterSpacing: 1 },
  header: { padding: Spacing[6], borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface, paddingTop: 60 },
  content: { flex: 1, padding: Spacing[4] },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing[4] },
  sectionTitle: { fontFamily: Typography.displayBold, fontSize: Typography.xl, color: Colors.text },
  btnAdd: { backgroundColor: Colors.surface3, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  btnAddText: { fontFamily: Typography.bodySemibold, color: Colors.goldLight, fontSize: Typography.sm },
  list: { paddingBottom: Spacing[6] },
  card: { backgroundColor: Colors.surface2, padding: Spacing[4], borderRadius: Radius.md, marginBottom: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontFamily: Typography.bodySemibold, fontSize: Typography.base, color: Colors.text },
  cardPrice: { fontFamily: Typography.body, fontSize: Typography.sm, color: Colors.goldLight, marginTop: Spacing[1] },
  empty: { fontFamily: Typography.body, color: Colors.textDim, textAlign: "center", marginTop: Spacing[8] },
  btnCrimson: { backgroundColor: Colors.crimson, paddingHorizontal: Spacing[8], paddingVertical: Spacing[3], borderRadius: Radius.full },
  btnCrimsonText: { fontFamily: Typography.bodySemibold, color: Colors.white, fontSize: Typography.base },
});
