import { BusinessCard } from '@/components/BusinessCard';
import { supabase } from '@/lib/supabase';
import { getAllBusinesses } from '@/services/businesses';
import { getShadowStyle } from '@/utils/shadowHelper';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Phone, MessageCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type UserRole = 'buyer' | 'seller' | 'admin';

export default function BusinessesScreen() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [filteredAttractions, setFilteredAttractions] = useState<any[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'promos' | 'businesses' | 'attractions'>('all');
  const [promos, setPromos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCanton, setSelectedCanton] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCantonModal, setShowCantonModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [gettingMyLocation, setGettingMyLocation] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);

  // Helper para comparar strings sin acentos y en minúsculas
  const normalizeStr = (s: any) =>
    (s ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Listas únicas de opciones derivadas de los comercios cargados
  const provinces: string[] = Array.from(
    new Set(
      (businesses || [])
        .map((b) => b.locations?.province_loc)
        .filter((v: any) => !!v)
    )
  );
  const cantons: string[] = Array.from(
    new Set(
      (businesses || [])
        .map((b) => b.locations?.canton_loc)
        .filter((v: any) => !!v)
    )
  );
  const districts: string[] = Array.from(
    new Set(
      (businesses || [])
        .map((b) => b.locations?.district_loc)
        .filter((v: any) => !!v)
    )
  );
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (auth.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role_prf')
          .eq('id_prf', auth.user.id)
          .single();
        if (profile) setRole(profile.role_prf);
      }

      const data = await getAllBusinesses();
      const list =
        data?.filter((b) => b.moderation_status_bus !== 'rejected') ?? [];
      setBusinesses(list);

      // Promos aprobadas (públicas)
      const approvedPromise = supabase
        .from('promotions')
        .select(`
          id_prm,
          business_id_prm,
          title_prm,
          description_prm,
          discount_type_prm,
          discount_value_prm,
          start_at_prm,
          end_at_prm
        `)
        .eq('moderation_status_prm', 'approved')
        .order('created_at_prm', { ascending: false })
        .limit(200);

      // Promos del dueño (cualquier estado) para que el seller las vea igual que en Gestión
      const minePromise = userId
        ? supabase
          .from('promotions')
          .select(`
              id_prm,
              business_id_prm,
              title_prm,
              description_prm,
              discount_type_prm,
              discount_value_prm,
              start_at_prm,
              end_at_prm
            `)
          .eq('created_by_prm', userId)
          .order('created_at_prm', { ascending: false })
          .limit(200)
        : null;

      const [approvedRes, mineRes] = await Promise.all([approvedPromise, minePromise]);

      const approvedList = approvedRes.data ?? [];
      const mineList = mineRes?.data ?? [];

      // Merge sin duplicados
      const mergedById: Record<string, any> = {};
      [...approvedList, ...mineList].forEach((p: any) => {
        if (!mergedById[p.id_prm]) mergedById[p.id_prm] = p;
      });
      const mergedPromos = Object.values(mergedById);

      // Cargar nombres de negocios para las promos
      const bizIds = Array.from(
        new Set(
          mergedPromos
            .map((p: any) => p.business_id_prm)
            .filter((v) => !!v)
        )
      );

      let bizMap: Record<string, any> = {};
      if (bizIds.length > 0) {
        const { data: bizRows } = await supabase
          .from('businesses')
          .select('id_bus, name_bus, locations ( province_loc, canton_loc, district_loc )')
          .in('id_bus', bizIds);
        bizMap = (bizRows ?? []).reduce((acc: any, b: any) => {
          acc[b.id_bus] = b;
          return acc;
        }, {});
      }

      // Opcional: primera imagen del negocio (si RLS lo permite)
      let imageMap: Record<string, any> = {};
      if (bizIds.length > 0) {
        const { data: imgRows } = await supabase
          .from('business_images')
          .select('business_id_bim, bucket_bim, path_bim, sort_order_bim')
          .in('business_id_bim', bizIds)
          .order('sort_order_bim', { ascending: true });

        imageMap = (imgRows ?? []).reduce((acc: any, img: any) => {
          const key = img.business_id_bim;
          if (!acc[key] || img.sort_order_bim < acc[key].sort_order_bim) {
            acc[key] = img;
          }
          return acc;
        }, {});
      }

      const enriched = mergedPromos.map((p: any) => ({
        ...p,
        businesses: bizMap[p.business_id_prm] ?? null,
        business_images: imageMap[p.business_id_prm]
          ? [imageMap[p.business_id_prm]]
          : [],
      }));

      setPromos(enriched);

      // Cargar atracciones
      const { data: attractionsData } = await supabase
        .from('attractions')
        .select(`
          id_atr,
          name_atr,
          description_atr,
          moderation_status_atr,
          is_active_atr,
          attraction_images ( bucket_aim, path_aim, sort_order_aim ),
          locations ( district_loc, canton_loc, province_loc )
        `)
        .neq('moderation_status_atr', 'rejected')
        .order('created_at_atr', { ascending: false })
        .limit(200);

      setAttractions(attractionsData ?? []);
    } catch (e) {
      console.error('[BUSINESSES]', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    setGettingMyLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGettingMyLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await response.json();
      const addr = data?.address || {};

      const province = addr.state || addr.province || '';
      const canton = addr.county || addr.municipality || '';
      const district = addr.city || addr.town || addr.village || addr.suburb || '';

      setSelectedProvince(province || null);
      setSelectedCanton(canton || null);
      setSelectedDistrict(district || null);
    } catch (e) {
      console.error('[MY_LOCATION]', e);
    } finally {
      setGettingMyLocation(false);
    }
  };

  useEffect(() => {
    let list = businesses;
    // Filtros por pestaña (por ahora no segmentamos datasets)
    if (filter === 'all' || filter === 'businesses' || filter === 'attractions' || filter === 'promos') {
      list = businesses;
    }

    // Filtrar por selects (provincia, cantón, distrito)
    if (selectedProvince || selectedCanton || selectedDistrict) {
      list = list.filter((b) => {
        const loc = b.locations || {};
        const matchesProvince = selectedProvince
          ? normalizeStr(loc.province_loc) === normalizeStr(selectedProvince)
          : true;
        const matchesCanton = selectedCanton
          ? normalizeStr(loc.canton_loc) === normalizeStr(selectedCanton)
          : true;
        const matchesDistrict = selectedDistrict
          ? normalizeStr(loc.district_loc) === normalizeStr(selectedDistrict)
          : true;
        return matchesProvince && matchesCanton && matchesDistrict;
      });
    }

    // Búsqueda por nombre
    if (search.trim()) {
      const q = normalizeStr(search);
      list = list.filter((b) => normalizeStr(b.name_bus).includes(q));
    }

    setFiltered(list);

    // Filtrar atracciones con la misma lógica
    let attractionsList = attractions;
    if (selectedProvince || selectedCanton || selectedDistrict) {
      attractionsList = attractionsList.filter((a) => {
        const loc = a.locations || {};
        const matchesProvince = selectedProvince
          ? normalizeStr(loc.province_loc) === normalizeStr(selectedProvince)
          : true;
        const matchesCanton = selectedCanton
          ? normalizeStr(loc.canton_loc) === normalizeStr(selectedCanton)
          : true;
        const matchesDistrict = selectedDistrict
          ? normalizeStr(loc.district_loc) === normalizeStr(selectedDistrict)
          : true;
        return matchesProvince && matchesCanton && matchesDistrict;
      });
    }

    if (search.trim()) {
      const q = normalizeStr(search);
      attractionsList = attractionsList.filter((a) => normalizeStr(a.name_atr).includes(q));
    }

    setFilteredAttractions(attractionsList);
  }, [filter, businesses, attractions, search, selectedProvince, selectedCanton, selectedDistrict]);

  const matchesLocation = (loc?: any) => {
    if (!loc) return true;
    const matchesProvince = selectedProvince
      ? normalizeStr(loc.province_loc) === normalizeStr(selectedProvince)
      : true;
    const matchesCanton = selectedCanton
      ? normalizeStr(loc.canton_loc) === normalizeStr(selectedCanton)
      : true;
    const matchesDistrict = selectedDistrict
      ? normalizeStr(loc.district_loc) === normalizeStr(selectedDistrict)
      : true;
    return matchesProvince && matchesCanton && matchesDistrict;
  };

  const filteredPromos = promos.filter((p) => matchesLocation(p.businesses?.locations));

  const renderFiltersHeader = () => (
    <>
      {/* Selects de ubicación y búsqueda */}
      <View style={styles.searchBlock}>
        <View style={styles.selectsRow}>
          <Pressable
            style={styles.locationSelector}
            onPress={() => setShowProvinceModal(true)}
          >
            <Text style={styles.locationSelectorText}>
              {selectedProvince || 'Provincia'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.locationSelector}
            onPress={() => setShowCantonModal(true)}
          >
            <Text style={styles.locationSelectorText}>
              {selectedCanton || 'Cantón'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.locationSelector}
            onPress={() => setShowDistrictModal(true)}
          >
            <Text style={styles.locationSelectorText}>
              {selectedDistrict || 'Distrito'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.myLocationButton}
            onPress={handleUseMyLocation}
            disabled={gettingMyLocation}
          >
            <Text style={styles.myLocationText}>
              {gettingMyLocation ? '...' : 'Mi ubicación'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setSelectedProvince(null);
              setSelectedCanton(null);
              setSelectedDistrict(null);
            }}
          >
            <Text style={styles.clearText}>Limpiar</Text>
          </Pressable>
        </View>

        <View style={styles.searchInputWrapper}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar negocios, productos, atracciones…"
            placeholderTextColor="#9AA0A6"
            style={styles.searchInput}
            selectionColor="#10b981"
            cursorColor="#10b981"
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(
          [
            { id: 'all', label: 'Todo' },
            { id: 'businesses', label: 'Negocios' },
            { id: 'attractions', label: 'Atracciones' },
            { id: 'promos', label: 'Promos' },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setFilter(t.id)}
            style={filter === t.id ? styles.tabActive : styles.tabInactive}
          >
            <Text
              style={
                filter === t.id
                  ? styles.tabActiveText
                  : styles.tabInactiveText
              }
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filter === 'all' && filteredPromos.length > 0 && (
        <View style={styles.promosBlock}>
          <Text style={styles.sectionTitle}>Promociones destacadas</Text>
          <Text style={styles.sectionSubtitle}>
            Descubre ofertas y negocios cercanos
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promosRow}
          >
            {filteredPromos.map((promo) => {
              const hero = promo.business_images?.find((img: any) => img.path_bim);
              const imageUrl = hero
                ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
                : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
              const discountLabel = promo.discount_type_prm === 'percentage'
                ? `${promo.discount_value_prm}% de descuento`
                : 'Promoción';

              return (
                <Pressable
                  key={promo.id_prm}
                  style={styles.promoCard}
                  onPress={() => {
                    setSelectedPromo(promo);
                    setShowPromoModal(true);
                  }}
                >
                  <Image source={{ uri: imageUrl }} style={styles.promoImage} />
                  <View style={styles.promoOverlay} />
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>{discountLabel}</Text>
                  </View>
                  <View style={styles.promoTextBox}>
                    <Text style={styles.promoTitle}>{promo.title_prm}</Text>
                    <Text style={styles.promoBusiness} numberOfLines={1}>
                      {promo.businesses?.name_bus ?? ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  );

  const renderBusinessCard = (item: any) => {
    const location = item.locations
      ? [
        item.locations.district_loc,
        item.locations.canton_loc,
        item.locations.province_loc,
      ]
        .filter(Boolean)
        .join(', ')
      : null;

    // Separar logo de otras imágenes
    const logo = item.business_images?.find((img: any) => img.bucket_bim === 'business-logos');
    const galleryImages = item.business_images?.filter((img: any) => img.bucket_bim === 'business-images') || [];

    console.log(`🏪 ${item.name_bus} - Logo:`, logo, `Gallery:`, galleryImages.length);

    return (
      <BusinessCard
        name={item.name_bus}
        description={item.description_bus}
        whatsapp={item.whatsapp_phone_bus}
        status={item.moderation_status_bus}
        location={location}
        logo={logo}
        businessImages={galleryImages}
        onPress={() => {
          router.push({
            pathname: '/(app)/(tabs)/businesses/[id]',
            params: { id: item.id_bus },
          });
        }}
      />
    );
  };

  let content: React.ReactElement | null = null;

  if (filter === 'promos') {
    content = (
      <ScrollView contentContainerStyle={styles.container}>
        {renderFiltersHeader()}
        <Text style={styles.sectionTitle}>Promos</Text>
        {filteredPromos.length === 0 ? (
          <Text style={styles.empty}>No hay promos disponibles</Text>
        ) : (
          <View style={styles.gridFullWidth}>
            {filteredPromos.reduce((rows: any[][], promo: any, idx: number) => {
              if (idx % 3 === 0) rows.push([]);
              rows[rows.length - 1].push(promo);
              return rows;
            }, []).map((row: any[], rowIdx: number) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((promo) => {
                  const hero = promo.business_images?.find((img: any) => img.path_bim);
                  const imageUrl = hero
                    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
                    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
                  const discountLabel = promo.discount_type_prm === 'percentage'
                    ? `${promo.discount_value_prm}% desc`
                    : 'Promoción';

                  return (
                    <Pressable
                      key={promo.id_prm}
                      style={styles.gridCardItem}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/(tabs)/promotions/[id]',
                          params: { id: promo.id_prm },
                        })
                      }
                    >
                      <View style={styles.gridCardInner}>
                        <Image source={{ uri: imageUrl }} style={styles.gridCardImage} />
                        <View style={styles.discountBadgeSmall}>
                          <Text style={styles.discountBadgeTextSmall}>{discountLabel}</Text>
                        </View>
                        <View style={styles.gridCardContent}>
                          <Text style={styles.gridCardTitle} numberOfLines={2}>
                            {promo.title_prm}
                          </Text>
                          <Text style={styles.gridCardType} numberOfLines={1}>
                            {promo.businesses?.name_bus ?? 'Negocio'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  } else if (filter === 'all') {
    content = (
      <ScrollView contentContainerStyle={styles.container}>
        {renderFiltersHeader()}

        <View style={styles.sectionTitleWrapper}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Negocios</Text>
        </View>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No hay comercios disponibles</Text>
        ) : (
          <View style={styles.gridFullWidth}>
            {filtered.reduce((rows: any[][], item: any, idx: number) => {
              if (idx % 3 === 0) rows.push([]);
              rows[rows.length - 1].push(item);
              return rows;
            }, []).map((row: any[], rowIdx: number) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((item) => {
                  const hero = item.business_images?.find((img: any) => img.path_bim);
                  const imageUrl = hero
                    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
                    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
                  return (
                    <View key={item.id_bus} style={styles.gridCardWrapper}>
                      <Pressable
                        style={styles.gridCardItem}
                        onPress={() => {
                          router.push({
                            pathname: '/(app)/(tabs)/businesses/[id]',
                            params: { id: item.id_bus },
                          });
                        }}
                      >
                        <View style={styles.gridCardInner}>
                          <Image source={{ uri: imageUrl }} style={styles.gridCardImage} />
                          
                          <View style={styles.gridCardContent}>
                            <Text style={styles.gridCardTitle} numberOfLines={2}>
                              {item.name_bus}
                            </Text>
                            <Text style={styles.gridCardType} numberOfLines={2}>
                              {item.description_bus || 'Sin descripción'}
                            </Text>
                            {item.whatsapp_phone_bus && (
                              <View style={styles.whatsappContactRow}>
                                <Phone size={14} color="#25D366" strokeWidth={2} />
                                <Text style={styles.gridCardWhatsapp} numberOfLines={1}>
                                  {item.whatsapp_phone_bus}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.gridCardFooter}>
                            <Text style={styles.gridCardLocation}>
                              {item.locations
                                ? [item.locations.district_loc, item.locations.canton_loc]
                                  .filter(Boolean)
                                  .join(', ')
                                : 'Sin ubicación'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                      
                      {/* WhatsApp Button - Outside to avoid overflow cut */}
                      {item.whatsapp_phone_bus && (
                        <Pressable
                          style={styles.whatsappButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            const phone = item.whatsapp_phone_bus.replace(/\D/g, '');
                            const url = `https://wa.me/${phone}`;
                            Linking.openURL(url);
                          }}
                        >
                          <Phone size={20} color="#fff" strokeWidth={2.5} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionTitleWrapper}>
          <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>Atracciones</Text>
        </View>
        {filteredAttractions.length === 0 ? (
          <Text style={styles.empty}>No hay atracciones disponibles</Text>
        ) : (
          <View style={styles.gridFullWidth}>
            {filteredAttractions.reduce((rows: any[][], item: any, idx: number) => {
              if (idx % 3 === 0) rows.push([]);
              rows[rows.length - 1].push(item);
              return rows;
            }, []).map((row: any[], rowIdx: number) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((item) => {
                  const hero = item.attraction_images?.find((img: any) => img.path_aim);
                  const imageUrl = hero
                    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_aim}/${hero.path_aim}`
                    : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80';

                  return (
                    <Pressable
                      key={item.id_atr}
                      style={styles.gridCardItem}
                      onPress={() => {
                        // Navegar a detalle de atracción (crear ruta si es necesario)
                        // Por ahora solo navegamos a la atracción
                      }}
                    >
                      <View style={styles.gridCardInner}>
                        <Image source={{ uri: imageUrl }} style={styles.gridCardImage} />
                        <View style={styles.gridCardContent}>
                          <Text style={styles.gridCardTitle} numberOfLines={2}>
                            {item.name_atr}
                          </Text>
                          <Text style={styles.gridCardType} numberOfLines={1}>
                            Atracción
                          </Text>
                        </View>
                        <View style={styles.gridCardFooter}>
                          <Text style={styles.gridCardLocation}>
                            {item.locations
                              ? [item.locations.district_loc, item.locations.canton_loc]
                                .filter(Boolean)
                                .join(', ')
                              : 'Sin ubicación'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionTitleWrapper}>
          <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>Promos</Text>
        </View>
        {filteredPromos.length === 0 ? (
          <Text style={styles.empty}>No hay promos disponibles</Text>
        ) : (
          <View style={styles.gridFullWidth}>
            {filteredPromos.reduce((rows: any[][], promo: any, idx: number) => {
              if (idx % 3 === 0) rows.push([]);
              rows[rows.length - 1].push(promo);
              return rows;
            }, []).map((row: any[], rowIdx: number) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((promo) => {
                  const hero = promo.business_images?.find((img: any) => img.path_bim);
                  const imageUrl = hero
                    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
                    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
                  const discountLabel = promo.discount_type_prm === 'percentage'
                    ? `${promo.discount_value_prm}% desc`
                    : 'Promoción';

                  return (
                    <Pressable
                      key={promo.id_prm}
                      style={styles.gridCardItem}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/(tabs)/promotions/[id]',
                          params: { id: promo.id_prm },
                        })
                      }
                    >
                      <View style={styles.gridCardInner}>
                        <Image source={{ uri: imageUrl }} style={styles.gridCardImage} />
                        <View style={styles.discountBadgeSmall}>
                          <Text style={styles.discountBadgeTextSmall}>{discountLabel}</Text>
                        </View>
                        <View style={styles.gridCardContent}>
                          <Text style={styles.gridCardTitle} numberOfLines={2}>
                            {promo.title_prm}
                          </Text>
                          <Text style={styles.gridCardType} numberOfLines={1}>
                            {promo.businesses?.name_bus ?? 'Negocio'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  } else {
    // business-only or attractions-only (placeholder) flows use FlatList with 3 columns
    const renderGridBusinessCard = (item: any) => {
      const hero = item.business_images?.find((img: any) => img.path_bim);
      const imageUrl = hero
        ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
        : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';

      return (
        <View style={styles.gridCardWrapper}>
          <Pressable
            style={styles.gridCardItem}
            onPress={() => {
              router.push({
                pathname: '/(app)/(tabs)/businesses/[id]',
                params: { id: item.id_bus },
              });
            }}
          >
            <View style={styles.gridCardInner}>
              <Image source={{ uri: imageUrl }} style={styles.gridCardImage} />
              
              <View style={styles.gridCardContent}>
                <Text style={styles.gridCardTitle} numberOfLines={2}>{item.name_bus}</Text>
                <Text style={styles.gridCardType} numberOfLines={2}>
                  {item.description_bus || 'Sin descripción'}
                </Text>
                {item.whatsapp_phone_bus && (
                  <View style={styles.whatsappContactRow}>
                    <Phone size={14} color="#25D366" strokeWidth={2} />
                    <Text style={styles.gridCardWhatsapp} numberOfLines={1}>
                      {item.whatsapp_phone_bus}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.gridCardFooter}>
                <Text style={styles.gridCardLocation}>
                  {item.locations
                    ? [item.locations.district_loc, item.locations.canton_loc]
                      .filter(Boolean)
                      .join(', ')
                    : 'Sin ubicación'}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      );
    };

    content = (
      <View style={styles.flatListWrapper}>
        <FlatList
          data={filter === 'attractions' ? filteredAttractions : filtered}
          numColumns={3}
          columnWrapperStyle={styles.gridColumnWrapper}
          contentContainerStyle={styles.gridListContainer}
          keyExtractor={(item) => filter === 'attractions' ? item.id_atr : item.id_bus}
          ListHeaderComponent={renderFiltersHeader}
        renderItem={({ item }) => {
          if (filter === 'attractions') {
            const hero = item.attraction_images?.find((img: any) => img.path_aim);
            const imageUrl = hero
              ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_aim}/${hero.path_aim}`
              : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80';

            return (
              <Pressable style={styles.gridCardItem}>
                <View style={styles.gridCardInner}>
                  <Image source={{ uri: imageUrl }} style={styles.gridCardImage} />
                  <View style={styles.gridCardContent}>
                    <Text style={styles.gridCardTitle} numberOfLines={2}>
                      {item.name_atr}
                    </Text>
                    <Text style={styles.gridCardType} numberOfLines={1}>
                      Atracción
                    </Text>
                  </View>
                  <View style={styles.gridCardFooter}>
                    <Text style={styles.gridCardLocation}>
                      {item.locations
                        ? [item.locations.district_loc, item.locations.canton_loc]
                          .filter(Boolean)
                          .join(', ')
                        : 'Sin ubicación'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          } else {
            return renderGridBusinessCard(item);
          }
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {filter === 'attractions' ? 'No hay atracciones disponibles' : 'No hay comercios disponibles'}
            </Text>
          ) : null
        }
        />
      </View>
    );
  }

  const modals = (
    <>
      <OptionsModal
        visible={showProvinceModal}
        title="Selecciona provincia"
        options={provinces}
        selected={selectedProvince}
        onClose={() => setShowProvinceModal(false)}
        onSelect={(val) => {
          setSelectedProvince(val);
          setShowProvinceModal(false);
        }}
      />
      <OptionsModal
        visible={showCantonModal}
        title="Selecciona cantón"
        options={cantons}
        selected={selectedCanton}
        onClose={() => setShowCantonModal(false)}
        onSelect={(val) => {
          setSelectedCanton(val);
          setShowCantonModal(false);
        }}
      />
      <OptionsModal
        visible={showDistrictModal}
        title="Selecciona distrito"
        options={districts}
        selected={selectedDistrict}
        onClose={() => setShowDistrictModal(false)}
        onSelect={(val) => {
          setSelectedDistrict(val);
          setShowDistrictModal(false);
        }}
      />
    </>
  );

  return (
    <>
      {content}
      {selectedPromo && (
        <Modal
          visible={showPromoModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPromoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardPromo}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={2}>{selectedPromo.title_prm}</Text>
                <Pressable onPress={() => setShowPromoModal(false)}>
                  <Ionicons name="close" size={22} color="#111" />
                </Pressable>
              </View>

              <Image
                source={{ uri: (() => {
                  const hero = selectedPromo.business_images?.find((img: any) => img.path_bim);
                  return hero
                    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
                    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
                })() }}
                style={styles.modalHero}
              />

              <View style={styles.modalBodyPromo}>
                <Text style={styles.modalBusiness}>{selectedPromo.businesses?.name_bus ?? 'Negocio'}</Text>
                {selectedPromo.description_prm ? (
                  <Text style={styles.modalDescription}>{selectedPromo.description_prm}</Text>
                ) : null}

                <View style={styles.modalInfoRow}>
                  <Ionicons name="pricetag" size={16} color="#111" />
                  <Text style={styles.modalInfoText}>
                    {selectedPromo.discount_type_prm === 'percentage'
                      ? `${selectedPromo.discount_value_prm}% de descuento`
                      : 'Promoción disponible'}
                  </Text>
                </View>

                {(selectedPromo.start_at_prm || selectedPromo.end_at_prm) && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="calendar" size={16} color="#111" />
                    <Text style={styles.modalInfoText}>
                      {selectedPromo.start_at_prm
                        ? new Date(selectedPromo.start_at_prm).toLocaleDateString('es-CR')
                        : 'Desde ahora'}
                      {selectedPromo.end_at_prm
                        ? `  ·  Hasta ${new Date(selectedPromo.end_at_prm).toLocaleDateString('es-CR')}`
                        : ''}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setShowPromoModal(false);
                  router.push({
                    pathname: '/(app)/(tabs)/promotions/[id]',
                    params: { id: selectedPromo.id_prm },
                  });
                }}
              >
                <Text style={styles.modalPrimaryText}>Ver detalle completo</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      {modals}
    </>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f7f8fa',
  },
  flex: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  searchBlock: {
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 40,
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    width: '100%' as any,
  },
  selectsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
  },
  locationSelectorText: {
    color: '#374151',
    fontWeight: '600',
  },
  myLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#cce4ff',
    borderRadius: 10,
  },
  myLocationText: {
    color: '#10b981',
    fontWeight: '700',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
  },
  clearText: {
    color: '#374151',
    fontWeight: '700',
  },
  searchInputWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 14,
    color: '#111827',
    borderWidth: 0,
    backgroundColor: 'transparent',
    // RN Web: mitigate default focus ring/border
    outlineWidth: 0 as any,
    outlineColor: 'transparent' as any,
  },
  loading: {
    padding: 24,
    textAlign: 'center',
  },
  promosBlock: {
    marginBottom: 14,
    paddingHorizontal: 40,
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    width: '100%' as any,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  sectionTitleWrapper: {
    paddingHorizontal: 40,
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    width: '100%' as any,
  },
  sectionSubtitle: {
    color: '#555',
    marginTop: 4,
  },
  promosRow: {
    marginTop: 10,
    gap: 12,
  },
  promoCard: {
    width: 260,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#111',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  promoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  promoBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  promoTextBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  promoBusiness: {
    color: '#f8fafc',
    marginTop: 2,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCardPromo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  modalHero: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  modalBodyPromo: {
    gap: 8,
  },
  modalBusiness: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  modalDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInfoText: {
    color: '#111',
    fontWeight: '600',
  },
  modalPrimaryBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 4,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 12,
    gap: 4,
    marginBottom: 6,
    maxWidth: Platform.OS === 'web' ? 1400 : undefined,
    marginHorizontal: Platform.OS === 'web' ? 'auto' as any : 12,
    width: Platform.OS === 'web' ? '100%' as any : undefined,
  },
  tabActive: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f4f5f6',
  },
  tabActiveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Platform.OS === 'web' ? 14 : 12,
  },
  tabInactiveText: {
    color: '#444',
    fontWeight: '600',
    fontSize: Platform.OS === 'web' ? 14 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  createButton: {
    padding: 14,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignItems: 'center',
  },
  createText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: '#666',
  },
  flatListWrapper: {
    flex: 1,
    width: '100%' as any,
    alignSelf: 'stretch' as any,
  },
  gridListContainer: {
    paddingVertical: 12,
    paddingBottom: 32,
    paddingHorizontal: 40,
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    width: '100%' as any,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 10,
    gap: 10,
  },
  gridCardWrapper: {
    position: 'relative',
    flex: 1 / 3,
    minWidth: 0,
  },
  gridCardItem: {
    flex: 1,
  },
  gridCardInner: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'visible',
    elevation: 3,
    ...getShadowStyle({
      color: '#000',
      offsetY: 3,
      opacity: 0.12,
      radius: 6,
    }),
    position: 'relative',
  },
  gridCardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e5e7eb',
  },
  gridCardContent: {
    padding: 12,
    paddingBottom: 10,
    flex: 1,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 16,
  },
  gridCardType: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 14,
    minHeight: 28,
  },
  gridCardWhatsapp: {
    fontSize: 10,
    color: '#25D366',
    fontWeight: '700',
    marginLeft: 6,
  },
  whatsappContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  gridCardFooter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  gridCardLocation: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  callButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 5,
    elevation: 4,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  discountBadgeSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeTextSmall: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    width: '100%',
  },
  gridFullWidth: {
    width: '100%',
    paddingHorizontal: 40,
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    marginBottom: 8,
  },
  whatsappButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

/* ---------- Location Picker Modal ---------- */
/* ---------- Options Modal (generic select) ---------- */
function OptionsModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string | null;
  onSelect: (val: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{title}</Text>

        <Pressable
          style={{ padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 12, backgroundColor: '#f8fafc' }}
          onPress={() => onSelect(null)}
        >
          <Text style={{ fontWeight: '600', color: '#111' }}>Todos</Text>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>No aplicar filtro</Text>
        </Pressable>

        <ScrollView>
          {options.map((opt) => (
            <Pressable
              key={opt}
              style={{ padding: 12, borderWidth: 1, borderColor: selected === opt ? '#10b981' : '#e5e7eb', borderRadius: 8, marginBottom: 8 }}
              onPress={() => onSelect(opt)}
            >
              <Text style={{ color: '#111', fontWeight: '500' }}>{opt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          style={{ marginTop: 12, backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center' }}
          onPress={onClose}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
