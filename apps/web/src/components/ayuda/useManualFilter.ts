"use client";
import { useState, useMemo } from "react";

export interface ManualSection {
  icon: React.ElementType;
  title: string;
  content: string;
}

export function useManualFilter(sections: ManualSection[]) {
  const [filterText, setFilterText] = useState("");

  const filteredSections = useMemo(() => {
    if (!filterText.trim()) return sections;

    const searchTerm = filterText.toLowerCase();
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(searchTerm) ||
        section.content.toLowerCase().includes(searchTerm)
    );
  }, [sections, filterText]);

  return { filterText, setFilterText, filteredSections };
}
