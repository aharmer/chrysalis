import { EntomologicalData, SpecimenRecord } from '@/types';

// A run is saved in a hidden folder next to the images, so it survives the browser closing:
//
//   .chrysalis/session.json     every record's status, extracted data and review state
//
// Images are never copied. They are read back from the folder and matched to records by filename.

const META_DIR = '.chrysalis';
const SESSION_FILE = 'session.json';
const SCHEMA_VERSION = 1;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|bmp|gif)$/i;
const STATUSES: SpecimenRecord['status'][] = ['pending', 'processing', 'success', 'error'];

const SAVE_DELAY_MS = 500;
const SAVE_RETRY_MS = 5000;
const WRITE_ATTEMPTS = 3;
const WRITE_RETRY_DELAY_MS = 250;

type SavedRecord = Pick<SpecimenRecord, 'filename' | 'status' | 'errorMsg' | 'reviewed' | 'data' | 'rawText' | 'confidence'>;

/** Saved so that the rest of a resumed run uses the same prompt as the part already done. */
export interface SessionSettings {
  prompt: string;
  temperature: number;
}

interface SessionFile {
  app: 'chrysalis';
  schema: number;
  savedAt: string;
  settings: SessionSettings;
  records: SavedRecord[];
  /** Filenames deleted from the list, so reopening the folder doesn't queue them for Gemini again. */
  removed: string[];
}

export interface OpenedSession {
  records: SpecimenRecord[];
  settings: SessionSettings | null;
  /** Saved results whose image is no longer in the folder. Kept in the file, not shown. */
  orphans: SavedRecord[];
  removed: string[];
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const supportsFolderAccess = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export const pickFolder = () => window.showDirectoryPicker({ id: 'chrysalis', mode: 'readwrite' });

/** Browsers forget folder permission between visits. Must be called from a click. */
export const requestFolderPermission = async (handle: FileSystemDirectoryHandle) =>
  (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';

function isNotFound(err: unknown) {
  return err instanceof DOMException && (err.name === 'NotFoundError' || err.name === 'TypeMismatchError');
}

async function readSessionFile(root: FileSystemDirectoryHandle): Promise<SessionFile | null> {
  let file: File;
  try {
    const meta = await root.getDirectoryHandle(META_DIR);
    file = await (await meta.getFileHandle(SESSION_FILE)).getFile();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }

  // Refuse to open a file we can't understand: carrying on would overwrite it with an empty session.
  let parsed: SessionFile;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error(`${META_DIR}/${SESSION_FILE} is not valid JSON. It may have been edited by hand or only partly synced.`);
  }
  if (!parsed || !Array.isArray(parsed.records)) {
    throw new Error(`${META_DIR}/${SESSION_FILE} doesn't look like a Chrysalis session.`);
  }
  if (parsed.schema > SCHEMA_VERSION) {
    throw new Error('This folder was saved by a newer version of Chrysalis. Reload the page to update.');
  }
  return parsed;
}

/** Lists the images in a folder and merges in whatever was saved for them. */
export async function openSession(
  root: FileSystemDirectoryHandle,
  createRecord: (filename: string, imageUrl: string) => SpecimenRecord,
): Promise<OpenedSession> {
  const session = await readSessionFile(root);
  const removed = new Set(session?.removed ?? []);
  const saved = new Map((session?.records ?? []).map(r => [r.filename, r]));

  const handles: FileSystemFileHandle[] = [];
  for await (const entry of root.values()) {
    if (entry.kind === 'file' && IMAGE_EXTENSIONS.test(entry.name) && !removed.has(entry.name)) handles.push(entry);
  }
  handles.sort((a, b) => collator.compare(a.name, b.name));

  const records = await Promise.all(handles.map(async handle => {
    const record = createRecord(handle.name, URL.createObjectURL(await handle.getFile()));
    const previous = saved.get(handle.name);
    saved.delete(handle.name);
    if (!previous) return record;

    const status = STATUSES.includes(previous.status) ? previous.status : 'pending';
    const data: EntomologicalData = { ...record.data, ...previous.data };
    return {
      ...record,
      // An image that was mid-flight when the browser closed never got its result, so it goes back in the queue.
      status: status === 'processing' ? 'pending' : status,
      errorMsg: previous.errorMsg,
      reviewed: Boolean(previous.reviewed),
      data,
      rawText: previous.rawText,
      confidence: previous.confidence,
    } satisfies SpecimenRecord;
  }));

  return { records, settings: session?.settings ?? null, orphans: [...saved.values()], removed: [...removed] };
}

/**
 * Write one file, retrying a couple of times.
 *
 * The browser writes to a temporary file and swaps it in when the stream closes, so a crash can't leave
 * half a file. It refuses the swap if anything else touched the file in the meantime, and Dropbox, OneDrive
 * and virus scanners all do that to files that have just changed. Waiting and writing again usually gets it.
 */
async function writeSessionFile(root: FileSystemDirectoryHandle, text: string) {
  const meta = await root.getDirectoryHandle(META_DIR, { create: true });
  let retried = false;
  for (let attempt = 1; ; attempt++) {
    let writable: FileSystemWritableFileStream | undefined;
    try {
      writable = await (await meta.getFileHandle(SESSION_FILE, { create: true })).createWritable();
      await writable.write(text);
      await writable.close();
      if (retried) await meta.removeEntry(`${SESSION_FILE}.crswap`).catch(() => undefined);
      return;
    } catch (err) {
      retried = true;
      await writable?.abort().catch(() => undefined);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw new Error('Chrysalis is no longer allowed to write to this folder. Close it and open it again.');
      }
      if (attempt >= WRITE_ATTEMPTS) {
        throw new Error(
          `Couldn't save progress after ${WRITE_ATTEMPTS} tries: ${errorText(err)} ` +
            'If this folder is synced by Dropbox or OneDrive, try pausing syncing.',
        );
      }
      await wait(WRITE_RETRY_DELAY_MS * attempt);
    }
  }
}

const toSaved = (r: SpecimenRecord): SavedRecord => ({
  filename: r.filename,
  status: r.status,
  errorMsg: r.errorMsg,
  reviewed: r.reviewed,
  data: r.data,
  rawText: r.rawText,
  confidence: r.confidence,
});

/** Keeps one folder's session file up to date. Writes are debounced, run one at a time, and skipped if nothing changed. */
export class SessionSaver {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private queue: Promise<boolean> = Promise.resolve(true);
  private latest: { records: SpecimenRecord[]; settings: SessionSettings } | null = null;
  private written: string | null = null;
  private stopped = false;
  private readonly orphans: SavedRecord[];
  private readonly removed: Set<string>;

  constructor(
    private readonly root: FileSystemDirectoryHandle,
    private readonly onStatus: (error: string | null) => void,
    previous: Pick<OpenedSession, 'orphans' | 'removed'>,
  ) {
    this.orphans = previous.orphans;
    this.removed = new Set(previous.removed);
  }

  private body(records: SpecimenRecord[], settings: SessionSettings) {
    return { settings, records: [...records.map(toSaved), ...this.orphans], removed: [...this.removed] };
  }

  /** Records what's already on disk, so that merely opening a folder doesn't write to it. */
  markClean(records: SpecimenRecord[], settings: SessionSettings) {
    this.latest = { records, settings };
    this.written = JSON.stringify(this.body(records, settings));
  }

  markRemoved(filename: string) {
    this.removed.add(filename);
  }

  schedule(records: SpecimenRecord[], settings: SessionSettings) {
    if (this.stopped) return;
    this.latest = { records, settings };
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  /** Resolves to true once everything is on disk. */
  flush(): Promise<boolean> {
    clearTimeout(this.timer);
    this.queue = this.queue.then(() => this.write());
    return this.queue;
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  private async write(): Promise<boolean> {
    if (!this.latest) return true;
    const body = this.body(this.latest.records, this.latest.settings);
    const key = JSON.stringify(body);
    if (key === this.written) return true;

    try {
      const file: SessionFile = { app: 'chrysalis', schema: SCHEMA_VERSION, savedAt: new Date().toISOString(), ...body };
      await writeSessionFile(this.root, JSON.stringify(file, null, 1));
      this.written = key;
      if (!this.stopped) this.onStatus(null);
      return true;
    } catch (err) {
      if (!this.stopped) {
        this.onStatus(errorText(err));
        this.timer = setTimeout(() => void this.flush(), SAVE_RETRY_MS);
      }
      return false;
    }
  }
}

// Recently opened folders, remembered in IndexedDB (directory handles can be stored there, not in localStorage).

export interface RecentFolder {
  name: string;
  handle: FileSystemDirectoryHandle;
  openedAt: string;
}

const DB_NAME = 'chrysalis';
const STORE = 'recent-folders';
const MAX_RECENT = 8;

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function listRecentFolders(): Promise<RecentFolder[]> {
  try {
    const all = await tx<RecentFolder[]>('readonly', s => s.getAll() as IDBRequest<RecentFolder[]>);
    return all.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  } catch {
    return [];
  }
}

export async function rememberFolder(handle: FileSystemDirectoryHandle) {
  try {
    for (const recent of await listRecentFolders()) {
      if (await recent.handle.isSameEntry(handle)) await tx('readwrite', s => s.delete(recent.openedAt));
    }
    const openedAt = new Date().toISOString();
    await tx('readwrite', s => s.put({ name: handle.name, handle, openedAt } satisfies RecentFolder, openedAt));
    for (const old of (await listRecentFolders()).slice(MAX_RECENT)) await tx('readwrite', s => s.delete(old.openedAt));
  } catch {
    // Remembering folders is a convenience only.
  }
}

export async function forgetFolder(recent: RecentFolder) {
  try {
    await tx('readwrite', s => s.delete(recent.openedAt));
  } catch {
    // Ignore.
  }
}
