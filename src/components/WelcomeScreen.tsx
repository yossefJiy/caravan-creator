import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import welcomeBg from "@/assets/welcome-foodtruck-bg.jpg";
import logo from "@/assets/eluya_nigrarim.svg";
import { useSiteContent } from "@/hooks/useSiteContent";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const { getContent } = useSiteContent();

  return (
    <div className="min-h-svh relative overflow-hidden bg-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${welcomeBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-900/70" />
      </div>

      {/* Content */}
      <div className="relative min-h-svh flex items-center justify-center p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={logo} 
              alt="אליה נגררים" 
              className="h-16 sm:h-20 object-contain"
            />
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              שלום וברוכים הבאים
            </h1>
            <h2 className="text-lg sm:text-xl text-primary font-medium">
              {getContent('welcome_title', 'בואו נבנה את הפודטראק המושלם עבורכם')}
            </h2>
          </motion.div>

          {/* Company introduction */}
          <motion.div
            className="max-w-lg mx-auto space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-base sm:text-lg text-slate-300">
              {getContent('welcome_subtitle', 'אנחנו באליה קרוואנים מומחים לייצור פודטראקים בגימור גבוה ומחומרי גלם איכותיים.')}
            </p>
          </motion.div>

          {/* Steps Preview */}
          <motion.div
            className="py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex justify-center items-center gap-4 sm:gap-6">
              {[
                { step: 1, label: "פרטים" },
                { step: 2, label: "דגם" },
                { step: 3, label: "ציוד" },
                { step: 4, label: "סיכום" },
              ].map(({ step, label }, index) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm sm:text-base font-medium text-slate-300">
                    {step}
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={onStart}
              className={cn(
                "inline-flex items-center gap-3 px-10 sm:px-14 py-4 rounded-xl",
                "bg-primary text-slate-900 font-bold text-lg",
                "hover:brightness-105 transition-all duration-200",
                "border border-primary/30",
              )}
            >
              <span>{getContent('welcome_button', 'בואו נתחיל')}</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Simple footer text */}
          <motion.p
            className="text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            הפרטים שלכם מאובטחים ונשמרים בסודיות מלאה
          </motion.p>
        </div>
      </div>

      {/* Credits Strip */}
      <div className="absolute bottom-0 left-0 right-0 py-3 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8">
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <span className="text-slate-500 text-[10px] md:text-xs">Marketing</span>
              <img src="/images/credits/jiy.svg" alt="JIY" className="h-4 md:h-6 opacity-60 hover:opacity-90 transition-opacity" />
            </a>
            <div className="hidden md:block w-px h-5 bg-slate-700" />
            <div className="w-12 h-px md:hidden bg-slate-700" />
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <span className="text-slate-500 text-[10px] md:text-xs">UX/UI</span>
              <img src="/images/credits/storytell.svg" alt="Storytell" className="h-4 md:h-6 opacity-60 hover:opacity-90 transition-opacity" />
            </a>
            <div className="hidden md:block w-px h-5 bg-slate-700" />
            <div className="w-12 h-px md:hidden bg-slate-700" />
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-100 transition-opacity">
              <span className="text-slate-500 text-[10px] md:text-xs">Built by</span>
              <img src="/images/credits/converto.svg" alt="Converto" className="h-4 md:h-6 opacity-60 hover:opacity-90 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
