"use client";

import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import app, { auth, db } from './client';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxPhotoSize = 2 * 1024 * 1024;

export async function saveProfilePhoto(file: File): Promise<string> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Vous devez être connecté pour modifier votre photo.');
  if (!allowedImageTypes.has(file.type)) throw new Error('Choisissez une image JPG, PNG ou WebP.');
  if (file.size > maxPhotoSize) throw new Error('La photo ne doit pas dépasser 2 Mo.');

  const photoRef = ref(getStorage(app), `profile-photos/${user.uid}/avatar`);
  await uploadBytes(photoRef, file, { contentType: file.type });
  const photoURL = await getDownloadURL(photoRef);
  await updateDoc(doc(db, 'collaborators', user.uid), { photoURL });
  return photoURL;
}
