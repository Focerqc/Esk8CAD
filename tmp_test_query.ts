import { getSupabaseClient } from './src/lib/supabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function testQuery() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    const platform = 'mbs'; // Test with the slug from the URL

    // Test the exact query from useParts.ts
    console.log(`\n--- Testing useParts Query for platform: ${platform} ---`);
    let query = supabase
        .from('parts')
        .select(`
            *,
            brands!inner(name, slug),
            part_categories!parts_category_id_fkey(name, slug),
            models!parts_model_id_fkey(name, slug)
        `)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .eq('brands.slug', platform);

    const { data: partsData, error: partsError } = await query;
    if (partsError) {
        console.error("Query Error:", partsError);
    } else {
        console.log(`Query Success. Found ${partsData?.length || 0} parts.`);
        if (partsData && partsData.length > 0) {
            console.log("First part sample:", JSON.stringify(partsData[0], null, 2));
        }
    }

    // Try a simpler query just to see if we can get anything
    console.log(`\n--- Testing Fallback Query for platform: ${platform} ---`);
    let fallbackQuery = supabase
        .from('parts')
        .select(`
            id,
            title,
            platform_id,
            brands!parts_platform_id_fkey(name, slug)
        `)
        .eq('status', 'approved');
        
    const { data: fData, error: fError } = await fallbackQuery;
    
    if (fError) {
        console.error("Fallback Error:", fError);
    } else if (fData) {
        console.log(`Fallback Success. Found ${fData.length} parts overall.`);
        // Manually filter to see if any match our target
        const matched = fData.filter(d => d.brands?.slug === platform);
        console.log(`Parts matching brand slug '${platform}': ${matched.length}`);
        if (matched.length > 0) {
            console.log("Sample matched part:", JSON.stringify(matched[0], null, 2));
        }
    }
}

testQuery();
