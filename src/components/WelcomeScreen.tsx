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

  const steps = [
    { step: 1, label: "פרטים" },
    { step: 2, label: "דגם" },
    { step: 3, label: "ציוד" },
    { step: 4, label: "סיכום" },
  ];

  return (
    <div className="min-h-svh flex flex-col lg:flex-row">
      {/* Right side - Navy content panel */}
      <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2 text-white order-1 lg:order-none min-h-[60svh] lg:min-h-svh" style={{ backgroundColor: '#0a1f3d' }}>
        {/* Logo */}
        <motion.div
          className="mb-8"
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
          className="text-center space-y-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            שלום{"\n"}וברוכים הבאים!
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-md mx-auto">
            {getContent('welcome_title', 'מוכנים להרכיב את הפודטראק שלכם')}
            <br />
            {getContent('welcome_subtitle', 'ב-4 שלבים?')}
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="mb-10 w-full max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative flex items-center justify-between">
            {/* Connecting line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-px bg-white/30" />
            {steps.map(({ step, label }) => (
              <div key={step} className="relative flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: '#0a1f3d' }}>
                  {step}
                </div>
                <span className="text-xs text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={onStart}
            className={cn(
              "inline-flex items-center gap-3 px-12 sm:px-16 py-4 rounded-xl",
              "bg-primary text-primary-foreground font-bold text-lg",
              "hover:brightness-105 transition-all duration-200",
            )}
          >
            <span>{getContent('welcome_button', 'בואו נתחיל')}</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Privacy text */}
        <motion.p
          className="mt-6 text-sm text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          הפרטים שלך מאובטחים ונשמרים בסודיות מלאה
        </motion.p>

        {/* Credits */}
        <motion.div
          className="absolute bottom-3 left-0 right-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-center gap-3 md:gap-6">
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              <img src="/images/credits/jiy.svg" alt="JIY" className="h-3 md:h-4 brightness-0 invert opacity-30 hover:opacity-60 transition-opacity" />
              <span className="text-white/30 text-[9px] md:text-xs">Marketing</span>
            </a>
            <div className="w-px h-3 bg-white/20" />
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              <img src="/images/credits/storytell.svg" alt="Storytell" className="h-3 md:h-4 brightness-0 invert opacity-30 hover:opacity-60 transition-opacity" />
              <span className="text-white/30 text-[9px] md:text-xs">UX/UI</span>
            </a>
            <div className="w-px h-3 bg-white/20" />
            <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              <img src="/images/credits/converto.svg" alt="Converto" className="h-3 md:h-4 brightness-0 invert opacity-30 hover:opacity-60 transition-opacity" />
              <span className="text-white/30 text-[9px] md:text-xs">Built by</span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Left side - Image */}
      <div className="relative lg:w-1/2 min-h-[40svh] lg:min-h-svh order-2 lg:order-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${welcomeBg})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    </div>
  );
};
