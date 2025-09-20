import { useMemo } from "react";
import * as SimpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

// Create an array of all available icons, ensuring every item is a valid icon object.
const allIcons: SimpleIcon[] = Object.values(SimpleIcons).filter(
    // This is a "type predicate" that checks if a value is a valid icon.
    (value): value is SimpleIcon =>
        typeof value === "object" && value !== null && "slug" in value
);

export const useIconSlugs = (slugs: string[] | undefined) => {
    const icons = useMemo(() => {
        // If no slugs are provided, return an empty array.
        if (!slugs) {
            return [];
        }

        // For each slug, find the corresponding icon object in our array.
        return (
            slugs
                .map((slug) => allIcons.find((icon) => icon.slug === slug))
                // Filter out any slugs that didn't match an icon.
                .filter((icon): icon is SimpleIcon => icon !== undefined)
        );
    }, [slugs]);

    return icons;
};