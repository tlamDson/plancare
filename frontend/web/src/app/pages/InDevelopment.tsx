/**
 * In Development Page
 */

import { Link } from "react-router-dom";
import { Home, ArrowLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function AnimatedTools() {
  return (
    <div className="relative flex justify-center items-center w-full h-40 mb-6">
      <motion.div
        className="z-10"
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Wrench className="w-24 h-24 text-primary/40" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

export default function InDevelopment() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-blue-50 dark:to-slate-900">
      <motion.div
        className="bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-2xl p-10 md:p-16 flex flex-col items-center max-w-lg w-full border border-primary/10 backdrop-blur-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AnimatedTools />
        <motion.h2
          className="text-3xl md:text-4xl font-semibold mb-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          In Development
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-md mx-auto mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          This feature is currently under construction. We're working hard to bring it to you soon!
        </motion.p>
        <div className="flex items-center justify-center gap-4 w-full">
          <Button variant="outline" asChild className="w-32">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
          <Button asChild className="w-32">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
