"use client";

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './client';

export const defaultDocumentFooter = [
  'SMART VISUEL Sarl - SIEGE : YAMOUSSOUKRO - Centre commercial mo faitai local n°20 N° RCCM : CI-TDI-01-2022-B12-00624 - N° CC : 2242970-A.',
  'Régime d’imposition : TEE - Direction régionale des impôts de Yamoussoukro',
  'BP : 1538 Yamoussoukro - Tél : 225 27 30 64 02 78 / Cel : 225 07 08 09 09 04 - 07 59 72 52 72',
].join('\n');

const settingsRef = doc(db, 'appSettings', 'commercialDocuments');

export async function getDocumentFooter(): Promise<string> {
  const snapshot = await getDoc(settingsRef);
  return snapshot.exists() && typeof snapshot.data().footerText === 'string'
    ? snapshot.data().footerText
    : defaultDocumentFooter;
}

export async function saveDocumentFooter(footerText: string): Promise<void> {
  await setDoc(settingsRef, { footerText }, { merge: true });
}
