// Minimal IndexedDB key-value wrapper. Node credentials live here — never in localStorage (spec §31, §38).

const DB_NAME = 'mihomo-forge'
const STORE = 'kv'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export const idbGet = <T>(key: string) => run<T | undefined>('readonly', (s) => s.get(key))
export const idbSet = (key: string, value: unknown) => run('readwrite', (s) => s.put(value, key))
export const idbDelete = (key: string) => run('readwrite', (s) => s.delete(key))
