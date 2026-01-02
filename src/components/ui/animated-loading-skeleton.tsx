import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface GridConfig {
    numCards: number
    cols: number
    xBase: number
    yBase: number
    xStep: number
    yStep: number
}

const AnimatedLoadingSkeleton = () => {
    const [windowWidth, setWindowWidth] = useState(0)
    const controls = useAnimation()

    const getGridConfig = (width: number): GridConfig => {
        const numCards = 6
        const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1
        return {
            numCards,
            cols,
            xBase: 40,
            yBase: 60,
            xStep: 210,
            yStep: 230
        }
    }

    const generateSearchPath = (config: GridConfig) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config
        const rows = Math.ceil(numCards / cols)
        let allPositions = []

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row * cols + col) < numCards) {
                    allPositions.push({
                        x: xBase + (col * xStep),
                        y: yBase + (row * yStep)
                    })
                }
            }
        }

        const numRandomCards = 4
        const shuffledPositions = allPositions
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandomCards)

        shuffledPositions.push(shuffledPositions[0])

        return {
            x: shuffledPositions.map(pos => pos.x),
            y: shuffledPositions.map(pos => pos.y),
            scale: Array(shuffledPositions.length).fill(1.2),
            transition: {
                duration: shuffledPositions.length * 2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1] as const,
                times: shuffledPositions.map((_, i) => i / (shuffledPositions.length - 1))
            }
        }
    }

    useEffect(() => {
        setWindowWidth(window.innerWidth)
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const config = getGridConfig(windowWidth)
        controls.start(generateSearchPath(config))
    }, [windowWidth, controls])

    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
    }

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 }
        })
    }

    const glowVariants = {
        animate: {
            boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.2)",
                "0 0 35px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.2)"
            ],
            scale: [1, 1.1, 1],
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    }

    const config = getGridConfig(windowWidth)

    return (
        <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-xl p-4">
            <motion.div
                variants={frameVariants}
                initial="hidden"
                animate="visible"
                className="relative w-full max-w-4xl"
            >
                {/* Search icon with animation */}
                <motion.div
                    animate={controls}
                    className="absolute z-10"
                    style={{ willChange: 'transform' }}
                >
                    <motion.div
                        variants={glowVariants}
                        animate="animate"
                        className="bg-tranquili-blue rounded-full p-3 shadow-lg"
                    >
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Grid of animated cards */}
                <div className={`grid gap-4 ${
                    config.cols === 3 ? 'grid-cols-3' :
                    config.cols === 2 ? 'grid-cols-2' :
                    'grid-cols-1'
                }`}>
                    {[...Array(config.numCards)].map((_, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                            {/* Card placeholders */}
                            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

export default AnimatedLoadingSkeleton
