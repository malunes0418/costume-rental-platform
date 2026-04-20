import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "next/router";
import { Link, useRouter as useExpoRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../constants/design";
import { listCostumes, Costume, resolveAsset, CostumeListQuery } from "../../lib/api";

const CATEGORIES = [
  { id: "", label: "All", emoji: "🎭" },
  { id: "superhero", label: "Superhero", emoji: "🦸" },
  { id: "halloween", label: "Halloween", emoji: "🎃" },
  { id: "historical", label: "Historical", emoji: "👑" },
  { id: "fantasy", label: "Fantasy", emoji: "🧙" },
  { id: "theatrical", label: "Theatrical", emoji: "🎭" },
  { id: "vintage", label: "Vintage", emoji: "🎩" },
];

function CostumeCard({ costume }: { costume: Costume }) {
  const router = useExpoRouter();
  const imageUrl = costume.CostumeImages?.find((img) => img.is_primary)?.image_url || costume.CostumeImages?.[0]?.image_url;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/costume/${costume.id}`)}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: resolveAsset(imageUrl) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.emojiLarge}>
              {CATEGORIES.find((c) => c.id === costume.category)?.emoji || "🎭"}
            </Text>
          </View>
        )}
        {costume.category && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{costume.category}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {costume.name}
            </Text>
            <Text style={styles.cardTags} numberOfLines={1}>
              {[costume.category, costume.theme, costume.size].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <View style={styles.cardPriceContainer}>
            <Text style={styles.cardPrice}>₱{Number(costume.base_price_per_day).toFixed(0)}</Text>
            <Text style={styles.cardPriceLabel}>/ day</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [query, setQuery] = useState<CostumeListQuery>({ page: 1, pageSize: 12 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchCostumes = async (refresh = false) => {
    try {
      const q = refresh ? { ...query, page: 1 } : query;
      if (refresh) setQuery(q);

      const res = await listCostumes(q);
      
      setCostumes(prev => refresh ? res.data : [...prev, ...res.data]);
      setHasMore(res.page * res.pageSize < res.total);
    } catch (error) {
      console.error("Failed to load costumes:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCostumes(true);
  }, [query.q, query.category]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCostumes(true);
  }, [query]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setQuery(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
      fetchCostumes();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header / Search */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search costumes..."
            placeholderTextColor={Colors.textDim}
            returnKeyType="search"
            onSubmitEditing={(e) => setQuery(prev => ({ ...prev, q: e.nativeEvent.text }))}
          />
        </View>
      </View>

      <FlatList
        data={costumes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CostumeCard costume={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
        ListHeaderComponent={
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => {
                const isActive = (query.category || "") === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setQuery(prev => ({ ...prev, category: item.id || undefined }))}
                  >
                    <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emojiLarge}>🎭</Text>
              <Text style={styles.emptyText}>No costumes found.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && !isRefreshing ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing[2],
    color: Colors.text,
    fontFamily: Typography.body,
    fontSize: Typography.base,
  },
  listContent: {
    padding: Spacing[4],
    paddingTop: 0,
    gap: Spacing[4],
  },
  categoriesContainer: {
    marginHorizontal: -Spacing[4],
    marginBottom: Spacing[4],
    paddingVertical: Spacing[3],
  },
  categoriesList: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  categoryPillActive: {
    backgroundColor: Colors.crimson,
    borderColor: Colors.crimson2,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    color: Colors.textMuted,
    fontFamily: Typography.bodySemibold,
    fontSize: Typography.sm,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing[4],
    ...Shadow.card,
  },
  imageContainer: {
    aspectRatio: 4 / 3,
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
    backgroundColor: Colors.surface2,
  },
  emojiLarge: {
    fontSize: 48,
  },
  badge: {
    position: "absolute",
    top: Spacing[3],
    left: Spacing[3],
    backgroundColor: Colors.goldDim,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(200,155,60,0.3)",
  },
  badgeText: {
    color: Colors.goldLight,
    fontFamily: Typography.bodySemibold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardBody: {
    padding: Spacing[4],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing[3],
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.lg,
    color: Colors.text,
    marginBottom: 2,
  },
  cardTags: {
    fontFamily: Typography.body,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  cardPriceContainer: {
    alignItems: "flex-end",
  },
  cardPrice: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xl,
    color: Colors.goldLight,
    lineHeight: 28,
  },
  cardPriceLabel: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loaderContainer: {
    padding: Spacing[4],
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: Spacing[12],
    alignItems: "center",
    gap: Spacing[4],
  },
  emptyText: {
    fontFamily: Typography.display,
    fontSize: Typography.lg,
    color: Colors.textMuted,
  },
});
