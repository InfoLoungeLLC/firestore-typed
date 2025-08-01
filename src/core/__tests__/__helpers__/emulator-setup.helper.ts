import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import type { App } from 'firebase-admin/app'
import type { Firestore } from 'firebase-admin/firestore'

export interface EmulatorSetup {
  app: App
  firestore: Firestore
}

/**
 * Sets up Firebase emulator for testing
 */
export function setupEmulator(): EmulatorSetup {
  // Set emulator host
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'

  // Initialize app with same project ID as emulator
  const app = initializeApp({
    projectId: 'demo-firestore-typed',
  })
  const firestore = getFirestore(app)

  return { app, firestore }
}

/**
 * Clears all data in the emulator (including subcollections)
 */
export async function clearEmulatorData(firestore: Firestore): Promise<void> {
  await deleteCollectionRecursively(firestore, await firestore.listCollections())
}

/**
 * Recursively deletes collections and their subcollections
 */
async function deleteCollectionRecursively(
  firestore: Firestore,
  collections: FirebaseFirestore.CollectionReference[],
): Promise<void> {
  for (const collection of collections) {
    const docs = await collection.listDocuments()
    for (const doc of docs) {
      // Delete subcollections first
      const subcollections = await doc.listCollections()
      if (subcollections.length > 0) {
        await deleteCollectionRecursively(firestore, subcollections)
      }
      // Then delete the document
      await doc.delete()
    }
  }
}

/**
 * Tears down the emulator setup
 */
export async function teardownEmulator(setup: EmulatorSetup): Promise<void> {
  await deleteApp(setup.app)
  delete process.env.FIRESTORE_EMULATOR_HOST
}
