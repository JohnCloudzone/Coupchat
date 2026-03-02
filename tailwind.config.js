/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 2s infinite',
                'float-slow': 'float 8s ease-in-out 1s infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'slide-up': 'slide-up 0.3s ease-out',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'slide-in-left': 'slide-in-left 0.3s ease-out',
                'fade-in': 'fade-in 0.3s ease-out',
                'bounce-in': 'bounce-in 0.5s ease-out',
                'typing': 'typing 1.4s infinite',
                'ripple': 'ripple 0.6s ease-out',
                'shake': 'shake 0.5s ease-in-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'gradient-shift': 'gradient-shift 8s ease infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                'float': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(3deg)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 5px var(--glow-color, #8b5cf6)' },
                    '50%': { boxShadow: '0 0 20px var(--glow-color, #8b5cf6), 0 0 40px var(--glow-color, #8b5cf6)' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-in-right': {
                    '0%': { transform: 'translateX(20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-in-left': {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'bounce-in': {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'typing': {
                    '0%': { opacity: '0.2' },
                    '20%': { opacity: '1' },
                    '100%': { opacity: '0.2' },
                },
                'ripple': {
                    '0%': { transform: 'scale(0)', opacity: '1' },
                    '100%': { transform: 'scale(4)', opacity: '0' },
                },
                'shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                'glow': {
                    '0%': { textShadow: '0 0 5px var(--glow-color, #8b5cf6)' },
                    '100%': { textShadow: '0 0 20px var(--glow-color, #8b5cf6), 0 0 40px var(--glow-color, #8b5cf6)' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
            },
            screens: {
                'xs': '375px',
            },
        },
    },
    plugins: [],
};
