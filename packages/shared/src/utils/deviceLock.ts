/**
 * Utility untuk autentikasi menggunakan Kunci Layar / Biometrik Bawaan Android (WebAuthn Platform Authenticator)
 */

export interface DeviceLockOptions {
  rpName?: string
  userName?: string
  userDisplayName?: string
}

export interface DeviceLockResult {
  success: boolean
  error?: string
  isFallback?: boolean
}

/**
 * Cek apakah platform authenticator (Kunci Layar Android / Biometrik bawaan) tersedia
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!window.isSecureContext) return false
  if (!window.PublicKeyCredential) return false

  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    }
    return false
  } catch (err) {
    console.warn('Gagal memeriksa platform authenticator:', err)
    return false
  }
}

/**
 * Panggil dialog kunci bawaan Android (Sidik Jari / PIN / Pola layar HP)
 */
export async function promptAndroidDeviceLock(options: DeviceLockOptions = {}): Promise<DeviceLockResult> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window tidak tersedia' }
  }

  // Jika bukan konteks aman (bukan HTTPS dan bukan localhost)
  if (!window.isSecureContext) {
    return {
      success: false,
      error: 'Fitur kunci layar memerlukan koneksi aman (HTTPS atau localhost).',
      isFallback: true,
    }
  }

  // Cek ketersediaan WebAuthn platform authenticator
  const available = await isPlatformAuthenticatorAvailable()
  if (!available) {
    return {
      success: false,
      error: 'Kunci biometrik / kunci layar bawaan tidak terdeteksi pada perangkat ini.',
      isFallback: true,
    }
  }

  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const userId = new Uint8Array(16)
    window.crypto.getRandomValues(userId)

    const hostname = window.location.hostname
    const rpEntity: PublicKeyCredentialRpEntity = {
      name: options.rpName || 'KBM Percetakan',
    }

    // WebAuthn melarang raw IPv4 sebagai rp.id, tapi localhost diperbolehkan
    if (hostname && !/^[0-9.]+$/.test(hostname)) {
      rpEntity.id = hostname
    }

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: rpEntity,
      user: {
        id: userId,
        name: options.userName || 'kbm_user',
        displayName: options.userDisplayName || 'KBM User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Menggunakan kunci layar Android bawaan
        userVerification: 'required',        // Wajib biometrik/PIN/pola layar
        residentKey: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    }

    const credential = await navigator.credentials.create({
      publicKey: creationOptions,
    })

    if (credential) {
      return { success: true }
    } else {
      return { success: false, error: 'Verifikasi kunci dibatalkan' }
    }
  } catch (err: any) {
    console.warn('Device lock verification error:', err)
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Kunci layar dibatalkan atau tidak cocok' }
    }
    if (err.name === 'AbortError') {
      return { success: false, error: 'Proses verifikasi dihentikan' }
    }
    return { success: false, error: err.message || 'Gagal memverifikasi kunci perangkat' }
  }
}
