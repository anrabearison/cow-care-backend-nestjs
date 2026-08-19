import * as request from 'supertest';

export interface ParsedCookie {
  value: string;
  attrs: Record<string, string | boolean>;
}

/**
 * Parse un cookie depuis le header Set-Cookie de la réponse.
 *
 * @param cookieHeader  Valeur du header Set-Cookie (string ou string[])
 * @param name          Nom du cookie à extraire
 * @returns             Cookie parsé avec sa valeur et ses attributs, ou null si non trouvé
 */
export function parseCookie(
  cookieHeader: string | string[] | undefined,
  name: string,
): ParsedCookie | null {
  if (!cookieHeader) return null;
  const list = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  const cookieStr = list.find(c => c.startsWith(`${name}=`));
  if (!cookieStr) return null;
  const parts = cookieStr.split(';').map(p => p.trim());
  const [nameValue, ...attributes] = parts;
  const value = nameValue.substring(name.length + 1);
  const attrs: Record<string, string | boolean> = {};
  for (const attr of attributes) {
    const [k, v] = attr.split('=');
    attrs[k.toLowerCase()] = v !== undefined ? v : true;
  }
  return { value, attrs };
}

/**
 * Effectue un login et retourne le token CSRF depuis le cookie Set-Cookie.
 * Utile pour les tests e2e qui ont besoin du token CSRF après login.
 *
 * @param agent           Instance supertest.agent() avec persistance des cookies
 * @param email           Email de l'utilisateur
 * @param password        Mot de passe
 * @param csrfCookieName  Nom du cookie CSRF (défaut: 'csrf_token')
 * @returns               Valeur du token CSRF
 * @throws                Si le cookie CSRF n'est pas trouvé dans la réponse de login
 */
export async function loginAndGetCsrfToken(
  agent: ReturnType<typeof request.agent>,
  email: string,
  password: string,
  csrfCookieName = 'csrf_token',
): Promise<string> {
  const loginResponse = await agent
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(201);
  const parsed = parseCookie(loginResponse.header['set-cookie'], csrfCookieName);
  if (!parsed) {
    throw new Error(`Impossible de récupérer le cookie CSRF ('${csrfCookieName}') après le login.`);
  }
  return parsed.value;
}
