import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { Colors, Typography, Spacing, Radius } from "../../constants/design";

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  if (!token) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.iconLarge}>🎭</Text>
        <Text style={styles.title}>Welcome to CostumeStay</Text>
        <Text style={styles.subtitle}>Log in to manage your account and bookings.</Text>
        <TouchableOpacity 
          style={styles.btnCrimson} 
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.btnCrimsonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Profile Info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuGroup}>
        <MenuItem icon="person-outline" title="Personal Information" />
        <MenuItem icon="card-outline" title="Payments & Payouts" />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/vendor")}>
          <Ionicons name="storefront-outline" size={24} color={Colors.goldLight} />
          <Text style={[styles.menuItemText, { color: Colors.goldLight }]}>Vendor Dashboard</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textDim} style={styles.menuItemArrow} />
        </TouchableOpacity>
        <MenuItem icon="settings-outline" title="Settings" />
      </View>

      <View style={styles.menuGroup}>
        <MenuItem icon="help-circle-outline" title="Help Center" />
        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.crimson2} />
          <Text style={[styles.menuItemText, { color: Colors.crimson2 }]}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MenuItem({ icon, title }: { icon: any; title: string }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <Ionicons name={icon} size={24} color={Colors.textMuted} />
      <Text style={styles.menuItemText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={Colors.textDim} style={styles.menuItemArrow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing[6],
  },
  iconLarge: {
    fontSize: 64,
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xl,
    color: Colors.text,
    marginBottom: Spacing[2],
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.base,
    color: Colors.textMuted,
    marginBottom: Spacing[6],
    textAlign: "center",
  },
  btnCrimson: {
    backgroundColor: Colors.crimson,
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
  },
  btnCrimsonText: {
    fontFamily: Typography.bodySemibold,
    color: Colors.white,
    fontSize: Typography.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing[5],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.goldDim,
  },
  avatarText: {
    fontFamily: Typography.displayBold,
    fontSize: Typography["2xl"],
    color: Colors.goldLight,
  },
  userInfo: {
    marginLeft: Spacing[4],
    flex: 1,
  },
  userName: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.lg,
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: Typography.body,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  menuGroup: {
    marginTop: Spacing[6],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontFamily: Typography.body,
    fontSize: Typography.base,
    color: Colors.text,
    marginLeft: Spacing[3],
    flex: 1,
  },
  menuItemArrow: {
    marginLeft: "auto",
  },
});
