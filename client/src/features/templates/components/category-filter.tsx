// Category filter toolbar component wrapping 40px high segmented control with normalized kit matching.
'use client';

import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control';

/** Helper normalizing category strings to handle & vs and and casing. */
export function normalizeCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pure predicate checking whether a template category matches active filter. */
export function matchCategory(templateCategory: string | undefined | null, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === 'all') return true;
  if (!templateCategory) return false;

  const normTemplate = normalizeCategory(templateCategory);
  const normFilter = normalizeCategory(filterCategory);

  if (normTemplate === normFilter) return true;
  if (normFilter === 'k-12 school' && (normTemplate.includes('k-12') || normTemplate.includes('school'))) {
    return true;
  }
  if (normFilter === 'university' && (normTemplate.includes('university') || normTemplate.includes('higher ed') || normTemplate.includes('college'))) {
    return true;
  }
  if (normFilter === 'vocational and stem' && (normTemplate.includes('vocational') || normTemplate.includes('stem'))) {
    return true;
  }

  return false;
}

/** Props for CategoryFilter component. */
export interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onChange: (category: string) => void;
  totalCount: number;
  categoryCounts?: Record<string, number>;
  className?: string;
}

/** React component rendering category filter segmented control for blueprint templates and kits. */
export function CategoryFilter({
  categories,
  selectedCategory,
  onChange,
  totalCount,
  categoryCounts = {},
  className = '',
}: CategoryFilterProps) {
  // Canonical categories list ensuring standard order: All, K-12 School, University, Vocational and STEM
  const options: SegmentedControlOption[] = [
    {
      value: 'all',
      label: `All ${totalCount}`,
    },
  ];

  // Standard preset categories preferred
  const presets = [
    { key: 'K-12 School', label: 'K-12 School' },
    { key: 'University', label: 'University' },
    { key: 'Vocational and STEM', label: 'Vocational and STEM' },
  ];

  // Map presets if they exist in data or have counts
  const addedKeys = new Set<string>();

  for (const preset of presets) {
    const normPreset = normalizeCategory(preset.key);
    // Find matching category in data
    const matchedDataCat = categories.find((c) => normalizeCategory(c) === normPreset);
    const count = categoryCounts[preset.key] ?? (matchedDataCat ? categoryCounts[matchedDataCat] : undefined);

    if (matchedDataCat || (count !== undefined && count > 0) || categories.length === 0) {
      options.push({
        value: preset.key,
        label: preset.label,
        count: count,
      });
      if (matchedDataCat) addedKeys.add(matchedDataCat);
    }
  }

  // Add any additional dynamic categories present in data not covered by presets
  for (const cat of categories) {
    if (!addedKeys.has(cat)) {
      const formattedLabel = cat.replace('&', 'and');
      options.push({
        value: cat,
        label: formattedLabel,
        count: categoryCounts[cat],
      });
      addedKeys.add(cat);
    }
  }

  return (
    <div className={`overflow-x-auto scrollbar-none max-w-full ${className}`}>
      <SegmentedControl
        options={options}
        value={selectedCategory}
        onChange={onChange}
        ariaLabel="Filter kits by curriculum category"
      />
    </div>
  );
}
