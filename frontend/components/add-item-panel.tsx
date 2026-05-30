"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Camera, Upload } from "lucide-react"
import { toast } from "sonner"
import type { Category, WardrobeItem } from "@/lib/wardrobe-data"
import { uploadClothingItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { goldBorder } from "@/lib/design-tokens"

interface AddItemPanelProps {
  category: Category
  onAdd: (item: WardrobeItem) => void
}

export function AddItemPanel({ category, onAdd }: AddItemPanelProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleAdd = async () => {
    if (!preview) {
      toast.error("Add a photo first.")
      return
    }
    setSubmitting(true)
    const result = await uploadClothingItem(preview)
    const id = result.id ?? crypto.randomUUID()
    onAdd({
      id,
      name: `New ${category.slice(0, -1)}`,
      brand: "Your wardrobe",
      imageUrl: preview,
      image: preview,
      category,
      tag: "Secondhand",
      wears: 0,
      status: "wardrobe",
      listed: false,
      readyToPartWith: false,
    })
    toast.success("Piece added to your wardrobe.")
    setPreview(null)
    setSubmitting(false)
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
      className={cn("flex h-full min-h-[420px] flex-col rounded-2xl bg-[rgba(248,235,215,0.35)] p-6 shadow-sm", goldBorder)}
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground">Add to wardrobe</h3>
        <p className="mt-1 text-xs text-muted-foreground">Upload or capture a new {category.toLowerCase()} piece.</p>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={cn("mb-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-[#FFFFF8]/70 transition-colors hover:border-primary/40", "border-[rgba(201,169,106,0.45)]")}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-contain p-4" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-xs">Tap to upload photo</span>
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Upload className="h-3.5 w-3.5" /> Photo
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Camera className="h-3.5 w-3.5" /> Camera
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!preview || submitting}
        className={cn(
          "mt-3 rounded-full px-4 py-2.5 text-sm font-medium transition-opacity",
          preview
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        {submitting ? "Adding…" : "Add to hanger"}
      </button>
    </motion.aside>
  )
}
