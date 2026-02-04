'use client';

import { useState, useRef, useCallback } from 'react';
import { api, StorageInfo } from '@/lib/web/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  helpText?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'heroes',
  label = 'Image',
  helpText,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load storage info on first interaction
  const loadStorageInfo = useCallback(async () => {
    if (storageInfo) return;
    try {
      const info = await api.admin.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to load storage info:', err);
    }
  }, [storageInfo]);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const result = await api.admin.uploadImage(file, folder);
      onChange(result.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = async () => {
    if (value) {
      try {
        await api.admin.deleteImage(value);
      } catch (err) {
        // Ignore deletion errors
      }
      onChange('');
    }
  };

  const idealSize = storageInfo?.idealSizes[folder as keyof typeof storageInfo.idealSizes]
    || { description: '1200x800 recommended' };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      {value ? (
        <div className="image-upload__preview">
          <img src={value} alt="Preview" className="image-upload__image" />
          <div className="image-upload__actions">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Replace
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={handleRemove}
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-upload__dropzone ${dragOver ? 'image-upload__dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            loadStorageInfo();
            fileInputRef.current?.click();
          }}
        >
          {uploading ? (
            <div className="image-upload__uploading">
              <span className="image-upload__spinner" />
              Uploading...
            </div>
          ) : (
            <>
              <div className="image-upload__icon">📷</div>
              <div className="image-upload__text">
                <strong>Click to upload</strong> or drag and drop
              </div>
              <div className="image-upload__hint">
                JPG, PNG or WebP (max 5MB)
                <br />
                Ideal size: {idealSize.description}
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Manual URL input */}
      <div className="image-upload__url">
        <input
          type="text"
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL..."
          style={{ fontSize: '13px', marginTop: '8px' }}
        />
      </div>

      {helpText && <p className="form-help">{helpText}</p>}

      {error && <p className="form-error">{error}</p>}

      <style jsx>{`
        .image-upload__preview {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--card-border);
        }

        .image-upload__image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }

        .image-upload__actions {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px;
          background: linear-gradient(transparent, rgba(0,0,0,0.6));
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .image-upload__actions .btn {
          background: rgba(255,255,255,0.9);
          color: var(--text);
        }

        .image-upload__dropzone {
          border: 2px dashed var(--card-border);
          border-radius: 12px;
          padding: 32px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--bg-alt);
        }

        .image-upload__dropzone:hover,
        .image-upload__dropzone--active {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .image-upload__icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .image-upload__text {
          color: var(--text);
          margin-bottom: 4px;
        }

        .image-upload__hint {
          font-size: 12px;
          color: var(--text-muted);
        }

        .image-upload__uploading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .image-upload__spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--card-border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .image-upload__url {
          position: relative;
        }

        .form-help {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .form-error {
          font-size: 13px;
          color: var(--error);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
