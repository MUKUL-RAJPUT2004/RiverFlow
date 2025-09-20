"use client";

import { useMemo, useEffect, useState } from "react";
import * as SimpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export const useIconSlugs = (slugs: string[] | undefined) => {
    const [icons, setIcons] = useState<SimpleIcon[] | undefined>(undefined);

    const iconSlugs = useMemo(
        () =>
            slugs?.reduce((acc, slug) => {
                // Add this comment on the line right before the error
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const icon = (SimpleIcons as any).Get(slug);
                if (icon) {
                    acc.push(icon);
                }
                return acc;
            }, [] as SimpleIcon[]) ?? [],
        [slugs],
    );

    useEffect(() => {
        setIcons(iconSlugs);
    }, [iconSlugs]);

    return icons;
};