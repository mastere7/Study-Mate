import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Sparkles,
  Check,
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  User,
  GraduationCap,
  Bot,
  Palette,
} from "lucide-react";
import { PRESET_AVATARS, compressAndCropImage, getDefaultAvatar, PresetAvatar } from "../../utils/imageUtils";

interface AvatarSelectorProps {
  currentAvatarUrl?: string;
  userName?: string;
  userEmail?: string;
  onSelectAvatar: (url: string) => void;
  onClose?: () => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatarUrl,
  userName = "Student",
  userEmail = "",
  onSelectAvatar,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"presets" | "upload">("presets");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultInitialsUrl = getDefaultAvatar(userName, userEmail);
  const activeAvatar = currentAvatarUrl || defaultInitialsUrl;

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setIsProcessingUpload(true);
    try {
      const base64Image = await compressAndCropImage(file, 256, 0.88);
      onSelectAvatar(base64Image);
      setActiveTab("presets");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process photo. Please try another image.");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const filteredPresets = PRESET_AVATARS.filter((preset) => {
    if (selectedCategory === "all") return true;
    return preset.category === selectedCategory;
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Header: Current Active Avatar Hero */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img
              src={activeAvatar}
              alt="Current Profile Avatar"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-md bg-white dark:bg-slate-800"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultInitialsUrl;
              }}
            />
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                fileInputRef.current?.click();
              }}
              className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <span>Profile Avatar</span>
              {currentAvatarUrl && currentAvatarUrl.startsWith("data:image") && (
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  Custom Photo
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Choose an avatar character or upload your own photo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {currentAvatarUrl && (
            <button
              type="button"
              onClick={() => onSelectAvatar("")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 font-bold transition-all text-[11px]"
              title="Reset to default initials avatar"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm text-[11px] cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Navigation Sub-tabs: Presets vs Upload */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "presets"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Avatar Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "upload"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your Photo</span>
          </button>
        </div>

        {activeTab === "presets" && (
          <div className="hidden sm:flex items-center gap-1">
            {["all", "student", "academic", "tech"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-[11px] font-medium flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* TAB 1: PRESET AVATARS GALLERY */}
      {activeTab === "presets" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
            {/* Option 0: Default Initials Avatar */}
            <button
              type="button"
              onClick={() => onSelectAvatar(defaultInitialsUrl)}
              className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer ${
                activeAvatar === defaultInitialsUrl
                  ? "bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300"
              }`}
              title="Initials Avatar (Default)"
            >
              <div className="relative">
                <img
                  src={defaultInitialsUrl}
                  alt="Default Initials"
                  className="w-10 h-10 rounded-xl object-cover"
                />
                {activeAvatar === defaultInitialsUrl && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-full">
                Initials
              </span>
            </button>

            {/* Presets List */}
            {filteredPresets.map((preset) => {
              const isSelected = activeAvatar === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectAvatar(preset.url)}
                  className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300"
                  }`}
                  title={preset.name}
                >
                  <div className="relative">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-10 h-10 rounded-xl object-cover bg-white dark:bg-slate-900"
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-full">
                    {preset.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM PHOTO UPLOAD */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
              isDragOver
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50 scale-[0.99]"
                : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30"
            }`}
          >
            {isProcessingUpload ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Optimizing and cropping your photo...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    Click to browse or drag & drop photo
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Supports PNG, JPG, JPEG, WEBP, or GIF (Auto-cropped to circle)
                  </p>
                </div>
                <span className="mt-1 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] shadow-xs">
                  Select Image File
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
