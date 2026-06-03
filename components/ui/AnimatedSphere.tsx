'use client';

import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface AnimatedSphereProps {
  onClick: () => void;
  isRecording?: boolean;
}

export default function AnimatedSphere({ onClick, isRecording = false }: AnimatedSphereProps) {
  return (
    <div className="relative">
      {/* Outer glow rings */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 -m-12 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-xl"
      />

      {/* Main sphere container */}
      <motion.button
        onClick={onClick}
        className="relative w-64 h-64 rounded-full focus:outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={
          isRecording
            ? {
                scale: [1, 1.03, 1],
              }
            : {}
        }
        transition={
          isRecording
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : { duration: 0.3 }
        }
      >
        {/* Sphere gradient background */}
        <div className="absolute inset-0 rounded-full sphere-gradient shadow-sphere" />

        {/* Glass effect overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-white/10 to-transparent" />

        {/* Highlight */}
        <motion.div
          animate={{
            opacity: [0.6, 0.9, 0.6],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-8 left-8 w-20 h-20 rounded-full bg-white/30 blur-2xl"
        />

        {/* Inner glow */}
        <motion.div
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-600/30 blur-xl"
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={
              isRecording
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }
                : {
                    scale: [1, 1.05, 1],
                  }
            }
            transition={
              isRecording
                ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }
                : {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          >
            <Mic size={64} className="text-white drop-shadow-2xl" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Particle effects */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/60 rounded-full"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * Math.PI * 2) / 8) * 80],
              y: [0, Math.sin((i * Math.PI * 2) / 8) * 80],
              opacity: [0.6, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Floating particles when recording */}
        {isRecording &&
          [...Array(12)].map((_, i) => (
            <motion.div
              key={`rec-${i}`}
              className="absolute w-1 h-1 bg-blue-300 rounded-full"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 200],
                y: [0, (Math.random() - 0.5) * 200],
                opacity: [0.8, 0],
                scale: [1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.15,
              }}
            />
          ))}
      </motion.button>

      {/* Recording pulse effect */}
      {isRecording && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 -m-4 rounded-full border-2 border-red-400"
          />
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute inset-0 -m-6 rounded-full border-2 border-red-400"
          />
        </>
      )}
    </div>
  );
}
