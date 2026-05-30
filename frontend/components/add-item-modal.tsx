"use client"

import { useRef, useState } from "react"
import { Plus, Upload, Camera, Sparkles, ScanLine } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { categories, type Category, type WardrobeItem } from "@/lib/wardrobe-data"
import { uploadClothingItem } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AddItemModalProps {
  onAdd: (item: WardrobeItem) => void
  defaultCategory?: Category
}

type Mode = "choose" | "upload" | "camera"

export function AddItemModal({ onAdd, defaultCategory }: AddItemModalProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("choose")
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [category, setCategory] = useState<Category>(defaultCategory ?? "Tops")
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setMode("choose")
    setName("")
    setBrand("")
    setCategory(defaultCategory ?? "Tops")
    setPreview(null)
    setSubmitting(false)
  }

  /**
   * handleImageUpload
   * Reads the selected file as a Base64 data URL for an instant preview. The
   * Base64 string is later sent to uploadClothingItem(base64) on save, which
   * POSTs to http://localhost:3000/api/wardrobe/upload.
   */
  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please give your item a name.")
      return
    }
    setSubmitting(true)
    // uploadClothingItem(base64) -> POST http://localhost:3000/api/wardrobe/upload
    const result = await uploadClothingItem(preview ?? "")
    onAdd({
      id: result.id ?? crypto.randomUUID(),
      name: name.trim(),
      brand: brand.trim() || "Unbranded",
      imageUrl: preview ?? "",
      image: preview ?? undefined,
      category,
      tag: "Secondhand",
      wears: 0,
      status: "wardrobe",
      listed: false,
      readyToPartWith: false,
    })
    toast.success(`${name.trim()} added to your wardrobe.`)
    setOpen(false)
    reset()
  }

  /** Mock in-store scan that surfaces a Smart Match warning toast. */
  const simulateInStoreScan = () => {
    toast("Smart Match Found", {
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      description:
        "You already own a highly similar item (White Crewneck). Consider wearing what you have or checking the Marketplace before purchasing!",
      duration: 7000,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new item</DialogTitle>
          <DialogDescription>Upload from your library or scan an item in-store.</DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setMode("upload")}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-card-foreground">Upload File</span>
            </button>
            <button
              onClick={() => setMode("camera")}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Camera className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-card-foreground">
                Capture from Camera
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">In-Store Mode</span>
              </span>
            </button>
          </div>
        )}

        {mode === "camera" && (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-secondary">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ScanLine className="h-8 w-8" />
                <span className="text-xs">In-Store camera preview</span>
              </div>
            </div>
            <Button onClick={simulateInStoreScan} variant="secondary" className="rounded-full">
              <ScanLine className="h-4 w-4" /> Simulate In-Store Scan
            </Button>
            <button
              onClick={() => setMode("upload")}
              className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Or add the item details manually
            </button>
          </div>
        )}

        {mode === "upload" && (
          <div className="flex flex-col gap-4 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary transition-colors hover:border-primary"
            >
              {preview ? (
                <img src={preview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Click to choose an image</span>
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
                if (file) handleImageUpload(file)
              }}
            />

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Linen Shirt"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="item-brand">Brand</Label>
                <Input
                  id="item-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Patagonia"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        category === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={submitting} className="rounded-full">
              {submitting ? "Saving..." : "Save to Wardrobe"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
