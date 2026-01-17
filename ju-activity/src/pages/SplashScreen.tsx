import type { ElementType } from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import {
  ArrowRight,
  Calendar,
  Users,
  Award,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function SplashScreen() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: easeOutExpo },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      {/* Animated skyblue/white gradient */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, #ffffff 0%, #e0f2fe 28%, #7dd3fc 55%, #ffffff 100%)",
          backgroundSize: "200% 200%",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Soft floating blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-sky-300/50 blur-3xl"
          animate={shouldReduceMotion ? undefined : { x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-white/70 blur-3xl"
          animate={shouldReduceMotion ? undefined : { x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.06, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-28 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-400/40 blur-3xl"
          animate={shouldReduceMotion ? undefined : { x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Extra highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_60%)]" />

      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl font-extrabold tracking-tight sm:text-6xl"
        >
          JU-AMS
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mt-4 max-w-xl text-lg text-slate-700"
        >
          Jazeera University Activity Management System  
          <span className="block mt-1 text-sm text-slate-600">
            Smart • Fast • Reliable
          </span>
        </motion.p>

        {/* Feature icons */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap justify-center gap-6"
        >
          <Feature icon={Calendar} text="Events" />
          <Feature icon={Users} text="Students" />
          <Feature icon={Award} text="Achievements" />
          <Feature icon={Sparkles} text="Modern UI" />
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="mt-12">
          <Button
            size="lg"
            className="group rounded-2xl bg-sky-600 px-8 py-6 font-semibold text-white shadow-lg hover:bg-sky-500"
            onClick={() => navigate("/login")}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-6 flex flex-col items-center text-slate-500"
        >
          <span className="text-sm">Scroll</span>
          <ChevronDown className="mt-1 h-5 w-5 animate-bounce" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Feature({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-4 text-slate-800 shadow-sm backdrop-blur-md">
      <Icon className="h-6 w-6 text-sky-700" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
