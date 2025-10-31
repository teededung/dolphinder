import { z } from "zod";
import type { DeveloperDB } from "../types/developer";

// Define the Dev schema for validation
const DevSchema = z.object({
    name: z.string(),
    username: z.string(),
    avatar: z.string().optional(),
    github: z.string(),
    linkedin: z.string().optional(),
    telegram: z.string().optional(),
    website: z.string().optional(),
    bio: z.string().optional(),
    slushWallet: z.string().optional(),
    walrusBlobId: z.string().optional(),
});

export type Dev = z.infer<typeof DevSchema>;

/**
 * Map Supabase DeveloperDB type to frontend Dev type
 */
export function mapSupabaseDeveloperToDev(dbDev: DeveloperDB): Dev {
    return {
        name: dbDev.name,
        username: dbDev.username,
        avatar: dbDev.avatar || undefined,
        github: dbDev.github || "",
        linkedin: dbDev.linkedin || undefined,
        telegram: dbDev.telegram || undefined,
        website: dbDev.website || undefined,
        bio: dbDev.bio || undefined,
        slushWallet: dbDev.slush_wallet || undefined,
        walrusBlobId: dbDev.walrus_blob_id || undefined,
    };
}

/**
 * Get a specific developer by username from JSON files
 * (Kept for backward compatibility with individual profile pages that may still use JSON)
 */
export async function getDeveloperByUsername(username: string): Promise<Dev | null> {
    try {
        const devModule = await import(`./developers/${username}.json`);
        return DevSchema.parse(devModule.default);
    } catch (error) {
        console.error(`Error loading developer profile for ${username}:`, error);
        return null;
    }
}
