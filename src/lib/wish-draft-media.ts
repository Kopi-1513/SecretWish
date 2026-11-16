
const DB_NAME = "secretwish-media-drafts";
const STORE_NAME = "media";

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open media storage."));
  });
}

export async function saveWishDraftMedia(
  id: string,
  file: Blob
): Promise<void> {
  const db = await openMediaDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, id);

    tx.oncomplete = () => resolve();

    tx.onerror = () =>
      reject(tx.error ?? new Error("Unable to save media."));

    tx.onabort = () =>
      reject(tx.error ?? new Error("Media storage transaction was aborted."));
  });

  db.close();
}

export async function getWishDraftMedia(
  id: string
): Promise<Blob | null> {
  const db = await openMediaDb();

  const result = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);

    request.onsuccess = () =>
      resolve((request.result as Blob | undefined) ?? null);

    request.onerror = () =>
      reject(request.error ?? new Error("Unable to read media."));
  });

  db.close();
  return result;
}

export async function deleteWishDraftMedia(id: string): Promise<void> {
  const db = await openMediaDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);

    tx.oncomplete = () => resolve();

    tx.onerror = () =>
      reject(tx.error ?? new Error("Unable to delete media."));
  });

  db.close();
}

export async function clearWishDraftMedia(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteWishDraftMedia(id)));
}
