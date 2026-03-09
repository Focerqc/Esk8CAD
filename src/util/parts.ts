import { useState, useEffect } from 'react';
import { getSupabaseClient, Part } from '../lib/supabase';

export const mapSlugToDbCategory = (slug?: string): string | undefined => {
  if (!slug || slug.trim() === "") return undefined;

  const dbCategories = [
    "Truck", "Bushing", "Bearing", "Wheel", "Tire", "Wheel Hub", "Pulley",
    "Sprocket", "Idler", "Thumbwheel", "Motor Mount", "Mount", "Anti-sink plate",
    "Riser", "Deck", "Foothold / Bindings", "Motor", "Battery", "BMS", "ESC",
    "Charger case", "Charge Port", "Connector", "Fuse holder", "Battery building parts",
    "Enclosure", "Cover", "Fender", "Guard / Bumper", "Heatsink", "Gland", "Headlight",
    "Remote", "Shocks / Damper", "Drill hole Jig", "Stand", "Complete board", "Miscellaneous"
  ];

  const lowerCat = slug.toLowerCase().replace(/[-/_ ]+/g, '');

  for (const dbCat of dbCategories) {
    const lowerDbCat = dbCat.toLowerCase().replace(/[-/_ ]+/g, '');
    if (lowerDbCat === lowerCat) {
      return dbCat;
    }
  }
  return slug;
};

export const useParts = (platform?: string, category?: string) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const fetchParts = async () => {
      const client = getSupabaseClient();
      if (!client) {
        if (mounted) {
          setError("Configuration Error");
          setIsLoading(false);
        }
        return;
      }

      try {
        let query = client.from('parts').select('*, brands!left(name), part_categories!left(name), fabrication_methods!left(name), models!left(name)')
          .eq('status', 'approved')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        // If a platform is specified, we'll fetch then filter in JS to avoid malformed PostgREST 'or' logic tree errors
        // especially when mixing legacy arrays and joined tables.

        const { data, error: sbError } = await query;

        if (sbError) {
          console.error("[useParts] Supabase query returned error:", sbError);
          throw sbError;
        }

        if (mounted) {
          let structuredParts: Part[] = (data || []).map((part: any) => {
            const types = [];
            if (part.part_categories?.name) types.push(part.part_categories.name);
            else if (part.type_of_part && part.type_of_part.length) types.push(...part.type_of_part);

            if (part.is_oem && !types.includes('OEM')) {
              types.push('OEM');
            }

            const pBrand = part.brands?.name ? [part.brands.name] : (part.platform || []);
            const pFab = part.fabrication_methods?.name ? [part.fabrication_methods.name] : (part.fabrication_method || []);

            return {
              id: part.id,
              title: part.title || "Unknown Part",
              image_src: part.image_src || "",
              external_url: part.external_url || "",
              platform: pBrand,
              type_of_part: types,
              fabrication_method: pFab,
              board_model: part.models?.name || part.board_model || "",
              author: part.author || part.submitted_by || "Unknown User",
              specs: part.specs || {},
              created_at: part.created_at,
              is_oem: part.is_oem || false,
              dropbox_url: part.dropbox_url || undefined
            };
          });

          // Client-side filtering for platform to handle hybrid schema and case-insensitivity
          if (platform && platform !== 'all') {
            const target = platform.toLowerCase();
            structuredParts = structuredParts.filter(p =>
              p.platform?.some(bp => bp.toLowerCase() === target) ||
              p.board_model?.toLowerCase().includes(target)
            );
          }

          // Restore category filtering in JS
          let activeCategory = category;
          if (!activeCategory && typeof window !== 'undefined') {
            const path = window.location.pathname.toLowerCase();
            if (path.includes('/tags/')) {
              activeCategory = path.split('/tags/')[1].replace(/\/$/, '');
            }
          }

          const mappedCategory = mapSlugToDbCategory(activeCategory);
          if (mappedCategory) {
            const targetCat = mappedCategory.toLowerCase();
            structuredParts = structuredParts.filter(p =>
              p.type_of_part?.some(t => t.toLowerCase() === targetCat)
            );
          }

          setParts(structuredParts);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("[useParts] Error fetching parts:", err);
          let errorMessage = "Database connection timed out - Retrying";
          if (err instanceof TypeError && err.message === 'Failed to fetch') {
            errorMessage = "Failed to fetch from Database (Possible CORS issue or network offline). Please ensure https://esk8cad.com is allowed in Supabase.";
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (typeof err === 'string') {
            errorMessage = err;
          }
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchParts();

    return () => {
      mounted = false;
    };
  }, [platform, category]);

  return { parts, isLoading, error };
};

// --- LEGACY STUB EXPORTS ---
export default [] as any[];
export const streetParts = [] as any[];
export const offRoadParts = [] as any[];
export const miscParts = [] as any[];
export const servisasParts = [] as any[];
export const acedeckParts = [] as any[];
export const apexParts = [] as any[];
export const backfireParts = [] as any[];
export const bioboardsParts = [] as any[];
export const boardnamicsParts = [] as any[];
export const defiantParts = [] as any[];
export const evolveParts = [] as any[];
export const exwayParts = [] as any[];
export const fluxmotionParts = [] as any[];
export const hoytParts = [] as any[];
export const lacroixParts = [] as any[];
export const linnpowerParts = [] as any[];
export const mboardsParts = [] as any[];
export const mbsParts = [] as any[];
export const meepoParts = [] as any[];
export const newbeeParts = [] as any[];
export const propelParts = [] as any[];
export const radiumParts = [] as any[];
export const stoogeParts = [] as any[];
export const summerboardParts = [] as any[];
export const trampaParts = [] as any[];
export const wowgoParts = [] as any[];

export const truckParts = [] as any[];
export const bushingParts = [] as any[];
export const bearingParts = [] as any[];
export const wheelParts = [] as any[];
export const tireParts = [] as any[];
export const wheelHubParts = [] as any[];
export const pulleyParts = [] as any[];
export const sprocketParts = [] as any[];
export const idlerParts = [] as any[];
export const thumbwheelParts = [] as any[];
export const motorMountParts = [] as any[];
export const mountParts = [] as any[];
export const antiSinkPlateParts = [] as any[];
export const riserParts = [] as any[];
export const deckParts = [] as any[];
export const footholdBindingsParts = [] as any[];
export const motorParts = [] as any[];
export const batteryParts = [] as any[];
export const bmsParts = [] as any[];
export const escParts = [] as any[];
export const chargerCaseParts = [] as any[];
export const chargePortParts = [] as any[];
export const connectorParts = [] as any[];
export const fuseHolderParts = [] as any[];
export const batteryBuildingParts = [] as any[];
export const enclosureParts = [] as any[];
export const coverParts = [] as any[];
export const fenderParts = [] as any[];
export const guardBumperParts = [] as any[];
export const heatsinkParts = [] as any[];
export const glandParts = [] as any[];
export const headlightParts = [] as any[];
export const remoteParts = [] as any[];
export const shocksDamperParts = [] as any[];
export const drillHoleJigParts = [] as any[];
export const standParts = [] as any[];
export const completeBoardParts = [] as any[];
export const miscellaneousParts = [] as any[];
