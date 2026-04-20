import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../constants/design";
import { getCostume, CostumeDetailResponse, resolveAsset } from "../../lib/api";

export default function CostumeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [data, setData] = useState<CostumeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    getCostume(parseInt(id, 10))
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load costume details"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Costume not found"}</Text>
        <TouchableOpacity style={styles.btnGhost} onPress={() => router.back()}>
          <Text style={styles.btnGhostText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { costume, avgRating, ratingCount } = data;
  const imageUrl = costume.CostumeImages?.find((img) => img.is_primary)?.image_url || costume.CostumeImages?.[0]?.image_url;
  const tags = [costume.category, costume.theme, costume.size].filter(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Section */}
        <View style={[styles.imageContainer, { height: width * 1.1 }]}>
          {imageUrl ? (
            <Image
              source={{ uri: resolveAsset(imageUrl) }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.emojiLarge}>🎭</Text>
            </View>
          )}
          {costume.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{costume.category}</Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{costume.name}</Text>
              {tags.length > 0 && (
                <Text style={styles.tags}>{tags.join(" · ")}</Text>
              )}
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₱{Number(costume.base_price_per_day).toFixed(0)}</Text>
              <Text style={styles.priceLabel}>/ day</Text>
            </View>
          </View>

          {/* Ratings */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.goldLight} />
            <Text style={styles.ratingText}>
              {avgRating ? Number(avgRating).toFixed(1) : "New"}
            </Text>
            {ratingCount > 0 && (
              <Text style={styles.reviewCount}>({ratingCount} reviews)</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this costume</Text>
            <Text style={styles.description}>
              {costume.description || "No description provided for this costume."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer / CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="heart-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCrimson}>
          <Text style={styles.btnCrimsonText}>Check Availability</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  scrollContent: {
    paddingBottom: 100, // Space for footer
  },
  imageContainer: {
    width: "100%",
    backgroundColor: Colors.surface2,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiLarge: {
    fontSize: 80,
  },
  badge: {
    position: "absolute",
    top: Spacing[4],
    left: Spacing[4],
    backgroundColor: Colors.goldDim,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(200,155,60,0.3)",
  },
  badgeText: {
    color: Colors.goldLight,
    fontFamily: Typography.bodySemibold,
    fontSize: Typography.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contentContainer: {
    padding: Spacing[5],
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing[4],
    marginBottom: Spacing[3],
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.displayBold,
    fontSize: Typography["2xl"],
    color: Colors.text,
    lineHeight: 34,
    marginBottom: Spacing[1],
  },
  tags: {
    fontFamily: Typography.body,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xl,
    color: Colors.goldLight,
    lineHeight: 28,
  },
  priceLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.xs,
    color: Colors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[1],
  },
  ratingText: {
    fontFamily: Typography.bodySemibold,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  reviewCount: {
    fontFamily: Typography.body,
    fontSize: Typography.sm,
    color: Colors.textDim,
    marginLeft: Spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing[6],
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.lg,
    color: Colors.text,
    marginBottom: Spacing[3],
  },
  description: {
    fontFamily: Typography.body,
    fontSize: Typography.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing[4],
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCrimson: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.crimson,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCrimsonText: {
    fontFamily: Typography.bodySemibold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  btnGhost: {
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnGhostText: {
    fontFamily: Typography.bodySemibold,
    color: Colors.text,
  },
  errorText: {
    fontFamily: Typography.body,
    color: Colors.error,
    fontSize: Typography.base,
    textAlign: "center",
  },
});
