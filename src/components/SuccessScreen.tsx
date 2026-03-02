import { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useTruckData } from '@/hooks/useTruckData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

interface SuccessScreenProps {
  onReset: () => void;
  customerName?: string;
}

// Gallery images from the main website
const websiteGalleryImages = [
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0010_IMG-20251118-WA0116.jpg', alt: 'פרויקט פודטראק 1' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0007_IMG-20251118-WA0121.jpg', alt: 'פרויקט פודטראק 2' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0006_IMG-20251118-WA0123.jpg', alt: 'פרויקט פודטראק 3' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0025_IMG-20251118-WA0039.jpg', alt: 'פרויקט פודטראק 4' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0016_IMG-20251118-WA0107.jpg', alt: 'פרויקט פודטראק 5' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/08/WhatsApp-Image-2025-07-24-at-11.19.27-2.jpeg', alt: 'פרויקט פודטראק 6' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/08/WhatsApp-Image-2025-07-24-at-11.19.22.jpeg', alt: 'פרויקט פודטראק 7' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0053_20240610_132346.jpg', alt: 'פרויקט פודטראק 8' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0058_20240409_094335.jpg', alt: 'פרויקט פודטראק 9' },
  { src: 'https://eliya-caravans.co.il/wp-content/uploads/2025/11/foodtrucks_0030_20250619_121825.jpg', alt: 'פרויקט פודטראק 10' },
];

export const SuccessScreen = ({ onReset, customerName }: SuccessScreenProps) => {
  const { getContent } = useSiteContent();
  const { data: truckTypes = [] } = useTruckData();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Combine truck type images + website gallery images
  const truckImages = truckTypes
    .filter(t => t.image)
    .map(t => ({ src: t.image, alt: t.nameHe }));
  
  const galleryImages = [...truckImages, ...websiteGalleryImages];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-svh bg-background">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-scale-in px-4 pt-8 pb-[calc(10rem+env(safe-area-inset-bottom))]">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          {customerName 
            ? `${customerName}, ${getContent('success_title', 'הבקשה נשלחה בהצלחה!')}`
            : getContent('success_title', 'הבקשה נשלחה בהצלחה!')}
        </h2>
        
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          {getContent('success_message', 'קיבלנו את הפרטים שלך ונחזור אליך בהקדם עם הצעת מחיר מותאמת אישית לפודטראק החלומות שלך.')}
        </p>

        {/* Gallery Carousel */}
        {galleryImages.length > 0 && (
          <div className="w-full max-w-md mb-8">
            <p className="text-sm text-muted-foreground mb-3">הצצה לפרויקטים שלנו</p>
            <div className="relative">
              <Carousel opts={{ direction: 'rtl', loop: true }} className="w-full">
                <CarouselContent>
                  {galleryImages.map((img, index) => (
                    <CarouselItem key={index} className="basis-2/3 sm:basis-1/2">
                      <button
                        onClick={() => openLightbox(index)}
                        className="w-full overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-colors"
                      >
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-3 h-8 w-8" />
                <CarouselNext className="-right-3 h-8 w-8" />
              </Carousel>
              {/* Fade edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
            </div>
          </div>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-3xl p-2 bg-black/95 border-none">
            {galleryImages[lightboxIndex] && (
              <div className="relative">
                <img
                  src={galleryImages[lightboxIndex].src}
                  alt={galleryImages[lightboxIndex].alt}
                  className="w-full max-h-[80vh] object-contain rounded-lg"
                />
                <p className="text-center text-white/70 text-sm mt-2">
                  {galleryImages[lightboxIndex].alt}
                </p>
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryImages.length)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={() => setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute top-1/2 left-2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="p-6 rounded-2xl bg-accent border border-primary/20 max-w-md mb-8">
          <p className="text-sm text-accent-foreground">
            💡 <strong>טיפ:</strong> בזמן ההמתנה, תוכל/י ללמוד עלינו ועל עבודתינו באתר שלנו
          </p>
        </div>

        <div className="flex flex-col sm:flex-row-reverse items-center gap-3 mb-8">
          <a
            href="https://eliya-caravans.co.il/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <span>לאתר שלנו</span>
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>{getContent('success_button', 'התחל תהליך חדש')}</span>
          </button>
        </div>
      </div>

      {/* Fixed Credits footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="container py-3 overflow-hidden">
          <div className="block text-center mb-2">
            <span className="text-slate-300 text-xs md:text-sm font-normal" style={{ maxWidth: '75%', display: 'inline-block' }}>רוצה גם מערכת הזמנות משוכללת לעסק שלך?</span>
          </div>
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <img src="/images/credits/jiy.svg" alt="JIY" className="h-4 md:h-6 brightness-0 invert opacity-60 hover:opacity-90 transition-opacity" />
              <span className="text-slate-400 text-[10px] md:text-sm font-medium">Marketing</span>
            </a>
            <div className="w-px h-4 bg-slate-600" />
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <img src="/images/credits/storytell.svg" alt="Storytell" className="h-4 md:h-6 brightness-0 invert opacity-60 hover:opacity-90 transition-opacity" />
              <span className="text-slate-400 text-[10px] md:text-sm font-medium">UX/UI</span>
            </a>
            <div className="w-px h-4 bg-slate-600" />
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <img src="/images/credits/converto.svg" alt="Converto" className="h-4 md:h-6 brightness-0 invert opacity-60 hover:opacity-90 transition-opacity" />
              <span className="text-slate-400 text-[10px] md:text-sm font-medium">Built by</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
