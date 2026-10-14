export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const errorResponse = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return errorResponse('Authentification requise.', 401);

  const body = await request.json().catch(() => null);
  const employeeId = body?.employeeId;
  const password = body?.password;
  if (typeof employeeId !== 'string' || !employeeId || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return errorResponse('Employé ou mot de passe invalide (8 à 128 caractères).', 400);
  }

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  const remoteOrigin = process.env.GESTIONSV_ADMIN_API_ORIGIN;
  if (!serviceAccountJson && remoteOrigin) {
    try {
      const origin = new URL(remoteOrigin);
      if (origin.protocol !== 'https:' || origin.origin === new URL(request.url).origin) throw new Error('Invalid remote origin');
      const response = await fetch(new URL('/api/admin/collaborators/password', origin), {
        method: 'POST',
        headers: { authorization, 'content-type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
        cache: 'no-store',
      });
      return new Response(await response.text(), {
        status: response.status,
        headers: { 'content-type': 'application/json' },
      });
    } catch {
      return errorResponse('Le service de modification du mot de passe est indisponible.', 503);
    }
  }

  if (!serviceAccountJson) return errorResponse('Le service administrateur Firebase n’est pas configuré.', 503);

  let app;
  try {
    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) throw new Error('Firebase project mismatch');
    serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, '\n');
    app = getApps().find(app => app.name === 'gestion-sv-admin')
      ?? initializeApp({ credential: cert(serviceAccount) }, 'gestion-sv-admin');
  } catch {
    return errorResponse('La configuration du service administrateur Firebase est invalide.', 503);
  }

  const [{ getAuth }, { getFirestore }] = await Promise.all([
    import('firebase-admin/auth'),
    import('firebase-admin/firestore'),
  ]);
  const adminAuth = getAuth(app);
  let adminId: string;
  try {
    adminId = (await adminAuth.verifyIdToken(authorization.slice(7), true)).uid;
  } catch {
    return errorResponse('Session expirée. Reconnectez-vous.', 401);
  }

  try {
    const allowedAdminIds = (process.env.FIREBASE_PASSWORD_MANAGER_UIDS ?? '')
      .split(',').map(uid => uid.trim()).filter(Boolean);
    if (!allowedAdminIds.includes(adminId)) return errorResponse('Accès réservé aux administrateurs autorisés.', 403);
    const firestore = getFirestore(app);
    const administrator = await firestore.doc(`collaborators/${adminId}`).get();
    if (administrator.data()?.role !== 'Admin') return errorResponse('Accès réservé aux administrateurs.', 403);
    const employee = await firestore.doc(`collaborators/${employeeId}`).get();
    if (employee.data()?.role !== 'Employee') return errorResponse('Ce compte n’est pas un employé actif.', 403);

    await adminAuth.updateUser(employeeId, { password });
    try {
      await adminAuth.revokeRefreshTokens(employeeId);
      return Response.json({ ok: true });
    } catch (error) {
      console.error('Employee session revocation failed:', error instanceof Error ? error.message : 'unknown error');
      return Response.json({ ok: true, sessionWarning: true });
    }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/user-not-found') {
      return errorResponse('Compte Firebase introuvable pour cet employé.', 404);
    }
    console.error('Employee password update failed:', error instanceof Error ? error.message : 'unknown error');
    return errorResponse('Impossible de modifier le mot de passe pour le moment.', 500);
  }
}
