import { useState } from 'react';
import { CheckCircle2, ArrowRight, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
}

export const SuccessScreen = ({ onReset }: SuccessScreenProps) => {
  const { getContent } = useSiteContent();
  const { data: truckTypes = [] } = useTruckData();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Collect all truck images for gallery
  const galleryImages = truckTypes
    .filter(t => t.image)
    .map(t => ({ src: t.image, alt: t.nameHe }));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-scale-in px-4">
      <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-success" />
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
        {getContent('success_title', 'הבקשה נשלחה בהצלחה!')}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {getContent('success_message', 'קיבלנו את הפרטים שלכם ונחזור אליכם בהקדם עם הצעת מחיר מותאמת אישית לפודטראק החלומות שלכם.')}
      </p>

      {/* Gallery Carousel */}
      {galleryImages.length > 0 && (
        <div className="w-full max-w-md mb-8">
          <p className="text-sm text-muted-foreground mb-3">🖼️ הצצה לפרויקטים שלנו</p>
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
              {/* Nav buttons */}
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
          💡 <strong>טיפ:</strong> בזמן ההמתנה, תוכלו לעיין בגלריית הפרויקטים שלנו באתר לקבלת השראה נוספת.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href="https://eliya-caravans.co.il/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
        >
          <span>לאתר שלנו</span>
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>{getContent('success_button', 'התחל תהליך חדש')}</span>
        </button>
      </div>

      {/* Credits strip */}
      <div className="mt-12 pt-6 border-t border-border/50 w-full max-w-md">
        <div className="block text-center mb-3">
          <span className="text-muted-foreground/70 text-[10px] md:text-xs font-semibold whitespace-nowrap" style={{ maxWidth: '75%', display: 'inline-block' }}>רוצים גם מערכת הזמנות משוכללת לעסק שלכם?</span>
        </div>
        <div className="flex flex-row items-center justify-center gap-4 md:gap-6">
          <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <img src="/images/credits/jiy.svg" alt="JIY" className="h-3 md:h-5 brightness-0 opacity-50 hover:opacity-80 transition-opacity" />
            <span className="text-muted-foreground/60 text-[9px] md:text-xs">Marketing</span>
          </a>
          <div className="w-px h-3 bg-border" />
          <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <img src="/images/credits/storytell.svg" alt="Storytell" className="h-3 md:h-5 brightness-0 opacity-50 hover:opacity-80 transition-opacity" />
            <span className="text-muted-foreground/60 text-[9px] md:text-xs">UX/UI</span>
          </a>
          <div className="w-px h-3 bg-border" />
          <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <img src="/images/credits/converto.svg" alt="Converto" className="h-3 md:h-5 brightness-0 opacity-50 hover:opacity-80 transition-opacity" />
            <span className="text-muted-foreground/60 text-[9px] md:text-xs">Built by</span>
          </a>
        </div>
      </div>
    </div>
  );
};
