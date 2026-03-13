import { getSupabaseClient } from './supabase';

export const PROFILE_BUCKETS = {
  avatar: 'avatars',
  wallpaper: 'wallpapers',
};

export const PROFILE_ASSET_MODERATION = {
  approved: 'approved',
  pendingReview: 'pending_review',
  rejected: 'rejected',
};

const inferFileExtension = (uri = '') => {
  const cleanUri = uri.split('?')[0];
  const extension = cleanUri.split('.').pop()?.toLowerCase();

  if (extension && extension.length <= 5) {
    return extension;
  }

  return 'jpg';
};

const inferContentType = (extension) => {
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
};

export const isRemoteAssetUrl = (uri = '') => /^https?:\/\//i.test(uri);

export const shouldUploadProfileAsset = (uri = '') =>
  Boolean(uri) && !isRemoteAssetUrl(uri);

export const reviewProfileAssetSource = (uri = '') => {
  if (!uri) {
    return {
      accepted: true,
      moderationStatus: PROFILE_ASSET_MODERATION.approved,
    };
  }

  if (
    uri.startsWith('file:') ||
    uri.startsWith('blob:') ||
    uri.startsWith('content:') ||
    uri.startsWith('data:image/') ||
    isRemoteAssetUrl(uri)
  ) {
    return {
      accepted: true,
      moderationStatus: shouldUploadProfileAsset(uri)
        ? PROFILE_ASSET_MODERATION.pendingReview
        : PROFILE_ASSET_MODERATION.approved,
    };
  }

  return {
    accepted: false,
    moderationStatus: PROFILE_ASSET_MODERATION.rejected,
    message: 'La fuente del archivo no parece valida.',
  };
};

export async function uploadProfileAsset({
  bucket,
  fileUri,
  userId,
  prefix = 'asset',
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todavia no esta configurado. Completa .env antes de subir archivos.',
    };
  }

  if (!fileUri || !userId) {
    return {
      ok: false,
      message: 'Falta userId o fileUri para subir el archivo.',
    };
  }

  try {
    const extension = inferFileExtension(fileUri);
    const contentType = inferContentType(extension);
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();
    const assetPath = `${userId}/${prefix}-${Date.now()}.${extension}`;

    const { error } = await client.storage.from(bucket).upload(assetPath, arrayBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data } = client.storage.from(bucket).getPublicUrl(assetPath);

    return {
      ok: true,
      path: assetPath,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos subir el archivo.',
    };
  }
}
