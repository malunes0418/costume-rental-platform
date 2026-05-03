"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVendorCostume, deleteVendorCostume } from "@/lib/vendor";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { X, UploadCloud } from "lucide-react";

interface EditCostumeModalProps {
  costume: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCostumeModal({ costume, onClose, onSuccess }: EditCostumeModalProps) {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (costume) {
      setName(costume.name || "");
      setDescription(costume.description || "");
      setPrice(costume.base_price_per_day?.toString() || "");
      setDeposit(costume.deposit_amount?.toString() || "");
      setSize(costume.size || "");
      setCategory(costume.category || "");
      
      const existingImages = costume.CostumeImages || costume.costume_images || [];
      if (Array.isArray(existingImages)) {
        setImages(existingImages.map((img: any) => img.image_url || img));
      } else {
        setImages([]);
      }
    }
  }, [costume]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 15 - images.length;
      const allowedFiles = filesArray.slice(0, remainingSlots);
      
      if (filesArray.length > remainingSlots) {
        toast.warning(`Only 15 images allowed. Added the first ${remainingSlots}.`);
      }

      // Convert images to Base64 strings
      const base64Images = await Promise.all(
        allowedFiles.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        })
      );
      
      setImages(prev => [...prev, ...base64Images]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !costume) return;

    if (images.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }

    setSubmitting(true);
    try {
      await updateVendorCostume(costume.id, {
        name,
        description,
        base_price_per_day: parseFloat(price),
        deposit_amount: parseFloat(deposit) || 0,
        size,
        category,
        images
      }, token);
      
      toast.success("Costume updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update costume.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !costume) return;
    if (!confirm("Are you sure you want to delete this costume? This action cannot be undone.")) return;

    setSubmitting(true);
    try {
      await deleteVendorCostume(costume.id, token);
      toast.success("Costume deleted successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete costume.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!costume) return null;

  return (
    <Dialog open={!!costume} onOpenChange={(val) => {
      if (!val) onClose();
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Costume</DialogTitle>
          <DialogDescription>
            Update the details and pictures for this listing.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Costume Name <span className="text-destructive">*</span></Label>
              <Input 
                id="edit-name" 
                placeholder="e.g. Victorian Vampire" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input 
                id="edit-category" 
                placeholder="e.g. Historical, Fantasy" 
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price per day ($) <span className="text-destructive">*</span></Label>
              <Input 
                id="edit-price" 
                type="number" 
                min="0"
                step="0.01"
                placeholder="25.00" 
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deposit">Security Deposit ($)</Label>
              <Input 
                id="edit-deposit" 
                type="number" 
                min="0"
                step="0.01"
                placeholder="50.00" 
                value={deposit}
                onChange={e => setDeposit(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-size">Size</Label>
              <Input 
                id="edit-size" 
                placeholder="e.g. Medium, US 8, Adjustable" 
                value={size}
                onChange={e => setSize(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                placeholder="Detailed description of the costume..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border/50">
            <div>
              <Label>Pictures ({images.length}/15) <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Upload clear, high-quality images of the costume.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-lg border border-border/50 overflow-hidden bg-muted">
                  <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3 text-foreground" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-[10px] text-primary-foreground text-center py-0.5 font-medium">
                      Primary
                    </span>
                  )}
                </div>
              ))}
              
              {images.length < 15 && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                  <UploadCloud className="size-6 text-primary/50 mb-2" />
                  <span className="text-xs font-medium text-primary/80">Upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
