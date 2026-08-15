/**
 * Image compression and processing utilities for profile avatars and file attachments
 */

export const compressAndCropImage = (
  file: File,
  targetSize: number = 256,
  quality: number = 0.88
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Basic file type validation
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image. Please upload PNG, JPG, JPEG, or WEBP."));
      return;
    }

    // Reject files larger than 10MB to prevent memory issues
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Image size exceeds 10MB. Please choose a smaller image."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Unable to create canvas context"));
            return;
          }

          // Center crop calculation for perfect square/circle avatar
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          // Draw cropped & scaled square
          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          // Convert to JPEG base64 Data URL
          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export interface PresetAvatar {
  id: string;
  name: string;
  category: "student" | "academic" | "creative" | "tech" | "minimal";
  url: string;
  badge?: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Academic & Student Archetypes
  {
    id: "scholar_felix",
    name: "Scholar Felix",
    category: "student",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=ScholarFelix&backgroundColor=b6e3f4",
    badge: "Scholar",
  },
  {
    id: "study_sarah",
    name: "Focus Sarah",
    category: "student",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=StudySarah&backgroundColor=ffdfbf",
    badge: "Focus",
  },
  {
    id: "research_amara",
    name: "Dr. Amara",
    category: "academic",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=ResearchAmara&backgroundColor=ffd5dc",
    badge: "Research",
  },
  {
    id: "tech_zane",
    name: "Zane Coder",
    category: "tech",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=TechZane&backgroundColor=c0aede",
    badge: "Dev",
  },
  {
    id: "creative_maya",
    name: "Maya Artist",
    category: "creative",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=CreativeMaya&backgroundColor=d1d4f9",
    badge: "Design",
  },
  {
    id: "bookworm_leo",
    name: "Leo Bookworm",
    category: "student",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=BookwormLeo&backgroundColor=c1f4c5",
    badge: "Reader",
  },
  // Fun & Tech Characters
  {
    id: "quantum_bot",
    name: "AI Tutor Bot",
    category: "tech",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=QuantumBot&backgroundColor=b6e3f4",
    badge: "AI",
  },
  {
    id: "cyber_spark",
    name: "Cyber Spark",
    category: "tech",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberSpark&backgroundColor=c0aede",
    badge: "Robo",
  },
  {
    id: "explorer_alex",
    name: "Alex Explorer",
    category: "student",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=ExplorerAlex&backgroundColor=ffdfbf",
    badge: "Honor",
  },
  {
    id: "campus_champ",
    name: "Campus Champion",
    category: "academic",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=CampusChampion&backgroundColor=d1d4f9",
    badge: "Dean's List",
  },
  {
    id: "cheerful_student",
    name: "Joyful Scholar",
    category: "creative",
    url: "https://api.dicebear.com/7.x/big-smile/svg?seed=JoyfulScholar&backgroundColor=ffd5dc",
    badge: "Optimist",
  },
  {
    id: "study_genius",
    name: "Math Whiz",
    category: "academic",
    url: "https://api.dicebear.com/7.x/micah/svg?seed=MathWhiz&backgroundColor=c1f4c5",
    badge: "STEM",
  },
];

export const getDefaultAvatar = (name?: string | null, email?: string | null): string => {
  const seed = (name || email || "Student").trim();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=4f46e5`;
};
