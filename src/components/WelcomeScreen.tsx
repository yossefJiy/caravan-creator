import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Sparkles, Star, Shield, Award, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import welcomeBg from '@/assets/welcome-foodtruck-bg.jpg';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background with parallax effect */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${welcomeBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
      </motion.div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          
          {/* Logo / Hero Icon */}
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.2 }}
          >
            <motion.div className="relative" animate={floatingAnimation}>
              {/* Outer glow ring */}
              <motion.div 
                className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 via-gold/20 to-primary/20 blur-xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Main icon container */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-gold/20 backdrop-blur-md flex items-center justify-center border-2 border-primary/40 shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Truck className="w-16 h-16 sm:w-20 sm:h-20 text-primary drop-shadow-lg" />
                </motion.div>
              </div>
              
              {/* Sparkle badge */}
              <motion.div 
                className="absolute -top-1 -right-1 w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center shadow-lg border-2 border-white/20"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div 
            className="space-y-3 sm:space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              שלום וברוכים הבאים! 
              <motion.span 
                className="inline-block mr-2"
                animate={{ rotate: [0, 20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                👋
              </motion.span>
            </motion.h1>
            <motion.h2 
              className="text-xl sm:text-2xl lg:text-3xl font-semibold bg-gradient-to-l from-primary via-gold to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              בואו נבנה את הפודטראק המושלם עבורכם
            </motion.h2>
          </motion.div>

          {/* Company introduction */}
          <motion.div 
            className="max-w-xl mx-auto space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-lg sm:text-xl text-foreground/90">
              אנחנו <span className="font-bold text-primary">אליה קרוואנים</span>
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              מומחים לייצור פודטראקים ומשאיות מזון יוקרתיות בישראל. 
              בתהליך קצר נתאים עבורכם את הפודטראק המושלם!
            </p>
          </motion.div>

          {/* Steps Preview - Improved design */}
          <motion.div 
            className="py-6 sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="relative flex justify-center items-center gap-2 sm:gap-4">
              {[
                { step: 1, label: 'פרטים', icon: '👤', color: 'from-blue-500/20 to-blue-600/20' },
                { step: 2, label: 'דגם', icon: '🚐', color: 'from-green-500/20 to-green-600/20' },
                { step: 3, label: 'ציוד', icon: '🔧', color: 'from-orange-500/20 to-orange-600/20' },
                { step: 4, label: 'סיכום', icon: '✅', color: 'from-purple-500/20 to-purple-600/20' },
              ].map(({ step, label, icon, color }, index) => (
                <motion.div 
                  key={step} 
                  className="flex flex-col items-center gap-2 relative"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.12, type: "spring", stiffness: 200 }}
                >
                  {/* Connector line */}
                  {index < 3 && (
                    <motion.div 
                      className="absolute top-6 -left-3 sm:-left-5 w-4 sm:w-6 h-0.5 bg-gradient-to-l from-border to-transparent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.1 + index * 0.12 }}
                    />
                  )}
                  
                  <motion.div 
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br backdrop-blur-sm",
                      "border border-border/50 flex items-center justify-center text-xl sm:text-2xl",
                      "shadow-lg hover:shadow-xl transition-shadow duration-300",
                      color
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {icon}
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust badges - Enhanced */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 sm:gap-4 py-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            {[
              { icon: Award, text: 'ייצור מקומי באיכות גבוהה', color: 'text-gold' },
              { icon: ChefHat, text: 'ציוד מקצועי ביותר', color: 'text-primary' },
              { icon: Truck, text: 'משלוח לכל הארץ', color: 'text-gold' },
            ].map((badge, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-card/70 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-border/50 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <badge.icon className={cn("w-4 h-4", badge.color)} />
                <span>{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button - Premium design */}
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
          >
            <motion.button
              onClick={onStart}
              className={cn(
                'group relative inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl',
                'bg-gradient-to-l from-primary via-primary to-primary/90 text-primary-foreground font-bold text-lg sm:text-xl',
                'shadow-xl hover:shadow-2xl transition-all duration-300',
                'overflow-hidden'
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={{ translateX: ["100%", "-100%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              
              <span className="relative z-10">בואו נתחיל!</span>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Security badge */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            <Shield className="w-4 h-4 text-green-500" />
            <span>הפרטים שלכם מאובטחים ונשמרים בסודיות מלאה</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
