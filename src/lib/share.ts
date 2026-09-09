/**
 * Sharing a lesson as a link.
 *
 * The whole workspace — files, stdin, notes, chosen lens — is compressed into
 * the URL fragment. No backend, no database, no accounts: paste the link into a
 * class chat and every student opens your exact program, annotations and all.
 *
 * The fragment never reaches a server, which is also why this is the private
 * option rather than an upload.
 */

export interface SharePayload {
  v: 1;
  files: Array<{ n: string; s: string }>;
  /** Pre-supplied stdin. */
  i?: string;
  /** Notes, keyed by step index. */
  t?: Record<string, string>;
  /** Which lens to open on. */
  l?: string;
}

const PREFIX_COMPRESSED = 'z';
const PREFIX_PLAIN = 'u';

/** Links live in a URL, so the alphabet has to be URL-safe. */
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function collapse(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload);

  if (typeof CompressionStream === 'undefined') {
    return PREFIX_PLAIN + toBase64Url(new TextEncoder().encode(json));
  }

  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return PREFIX_COMPRESSED + toBase64Url(await collapse(stream));
}

export async function decodeShare(token: string): Promise<SharePayload | null> {
  try {
    const prefix = token[0];
    const bytes = fromBase64Url(token.slice(1));

    let json: string;
    if (prefix === PREFIX_COMPRESSED) {
      if (typeof DecompressionStream === 'undefined') return null;
      const stream = new Blob([bytes as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      json = new TextDecoder().decode(await collapse(stream));
    } else if (prefix === PREFIX_PLAIN) {
      json = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(json) as SharePayload;
    return parsed.v === 1 && Array.isArray(parsed.files) ? parsed : null;
  } catch {
    // A truncated or hand-edited link is not worth an error message; the app
    // simply opens with whatever was already saved.
    return null;
  }
}

/** The share token in the current URL, if there is one. */
export function readShareToken(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith('p=')) return null;
  const token = hash.slice(2);
  return token.length > 1 ? token : null;
}

export async function buildShareUrl(payload: SharePayload): Promise<string> {
  const token = await encodeShare(payload);
  return `${window.location.origin}${window.location.pathname}#p=${token}`;
}
