import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ReservationDocument } from '../types';

export class SupabaseStorageService {
  private bucketName = 'reservation-documents';

  /**
   * Uploads a document to the private 'reservation-documents' Supabase bucket.
   * Path format: `{userId}/{reservationId}/{timestamp}_{fileName}`
   * Enforces RLS: only the owner or TU Admin can access.
   */
  async uploadPrivateDocument(
    file: File,
    userId: string,
    reservationId: string
  ): Promise<ReservationDocument> {
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${reservationId}/${timestamp}_${safeFileName}`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase Storage upload error:', error);
        throw new Error(`Gagal mengunggah dokumen: ${error.message}`);
      }

      // Generate a temporary signed download URL (valid for 1 hour)
      const { data: signedData } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 3600);

      return {
        id: `doc_${timestamp}`,
        name: file.name,
        sizeBytes: file.size,
        type: file.type || 'application/pdf',
        url: signedData?.signedUrl || '#',
        storagePath: storagePath,
        uploadedAt: new Date().toISOString(),
      };
    }

    // Demo Mode fallback:
    return {
      id: `doc_${timestamp}`,
      name: file.name,
      sizeBytes: file.size,
      type: file.type || 'application/pdf',
      url: URL.createObjectURL(file),
      storagePath: storagePath,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a fresh temporary signed URL for an authorized user.
   */
  async getSecureDownloadUrl(storagePath: string): Promise<string> {
    if (!storagePath) return '#';

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 3600);

      if (error || !data?.signedUrl) {
        console.error('Failed to create signed URL:', error);
        throw new Error('Akses berkas ditolak atau tautan kedaluwarsa.');
      }
      return data.signedUrl;
    }

    return '#';
  }
}

export const supabaseStorageService = new SupabaseStorageService();
