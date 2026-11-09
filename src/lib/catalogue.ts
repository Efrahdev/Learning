/**
 * The library as plain data (no functions, no cycles), for the React islands on the home page and the map.
 * Built at build time from the folder tree in content.ts, then passed to the islands as props.
 */
import { allFolders, allPages, getLibrary, type Folder, type Page } from './content';
import type { Accent } from './accents';

export interface LessonItem {
  id: string;
  title: string;
  href: string;
  summary: string;
  minutes?: number;
  tags: string[];
  interactive: boolean; // an older lesson that opens as its own animated app
  accent: Accent;
  subject: string; // top-level folder path, e.g. "technology"
  icon?: string; // nearest folder icon
  trail: string[]; // folder titles from the subject down, e.g. ["Technology", "AI"]
}

export interface FolderItem {
  path: string;
  slug: string;
  title: string;
  href: string;
  icon?: string;
  accent: Accent;
  blurb?: string;
  count: number; // lessons anywhere inside
  interactive: number; // how many of those are interactive
  folders: FolderItem[];
  lessons: LessonItem[];
}

export interface Catalogue {
  subjects: FolderItem[];
  lessons: LessonItem[]; // every lesson, in library order
  totals: { subjects: number; topics: number; lessons: number; interactive: number };
}

function lessonItem(p: Page, trail: Folder[]): LessonItem {
  const icon = [...trail].reverse().find((f) => f.icon)?.icon;
  return {
    id: p.id,
    title: p.data.title,
    href: p.href,
    summary: p.data.summary ?? '',
    minutes: p.data.minutes,
    tags: p.data.tags ?? [],
    interactive: Boolean(p.data.legacy),
    accent: p.folder.accent,
    subject: trail[0]?.path ?? '',
    icon,
    trail: trail.map((f) => f.title),
  };
}

function folderItem(f: Folder, trail: Folder[]): FolderItem {
  const here = [...trail, f];
  const lessons = f.pages.map((p) => lessonItem(p, here));
  const folders = f.folders.map((c) => folderItem(c, here));
  const inside = allPages(f);
  return {
    path: f.path,
    slug: f.slug,
    title: f.title,
    href: f.href,
    icon: f.icon ?? trail.slice().reverse().find((t) => t.icon)?.icon,
    accent: f.accent,
    blurb: f.blurb,
    count: inside.length,
    interactive: inside.filter((p) => p.data.legacy).length,
    folders,
    lessons,
  };
}

const flatten = (f: FolderItem): LessonItem[] => [...f.lessons, ...f.folders.flatMap(flatten)];

export async function getCatalogue(): Promise<Catalogue> {
  const root = await getLibrary();
  const subjects = root.folders.map((f) => folderItem(f, []));
  const lessons = subjects.flatMap(flatten);
  return {
    subjects,
    lessons,
    totals: {
      subjects: subjects.length,
      topics: allFolders(root).filter((f) => f.depth > 1).length,
      lessons: lessons.length,
      interactive: lessons.filter((l) => l.interactive).length,
    },
  };
}
