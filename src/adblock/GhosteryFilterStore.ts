const DATABASE_NAME = "vortex-filter-cache";
const STORE_NAME = "engines";
const ENGINE_KEY = "ghostery-2.20";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open filter cache"));
  });
}

export async function loadGhosteryEngine(): Promise<Uint8Array | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(ENGINE_KEY);
      request.onsuccess = () => {
        const value: unknown = request.result;
        if (value instanceof Uint8Array) resolve(value);
        else if (value instanceof ArrayBuffer) resolve(new Uint8Array(value));
        else resolve(null);
      };
      request.onerror = () => reject(request.error ?? new Error("Could not read filter cache"));
    });
  } finally { database.close(); }
}

export async function saveGhosteryEngine(engine: Uint8Array): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(engine, ENGINE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save filter cache"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Filter cache transaction aborted"));
    });
  } finally { database.close(); }
}
