import { Variants } from "framer-motion";

// Animation variants for cards with primary/selected state
export const cardVariants: Variants = {
  primary: {
    scale: [1, 1.02, 1],
    borderColor: "#ef4444",
    backgroundColor: "#dbeafe",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: { 
      duration: 0.4,
      ease: "easeInOut" 
    }
  },
  notPrimary: {
    scale: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    transition: { 
      duration: 0.3,
      ease: "easeOut" 
    }
  }
};

// Animation variants for badge elements
export const badgeVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      delay: 0.1,
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    transition: { 
      duration: 0.2
    }
  }
};

// Animation for item addition to a list
export const itemAddVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// Animation for hover effects
export const hoverVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// Animation for page transitions
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
}; 