/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'neo-light': 'var(--neo-shadow-light)',
  			'neo-inset': 'var(--neo-shadow-inset)',
  			'neo-hover': 'var(--neo-shadow-hover)',
  			'glow-primary': 'var(--glow-primary)',
  			'glow-accent': 'var(--glow-accent)',
  			'glow-cyber': 'var(--glow-cyber)',
  		},
  		backgroundImage: {
  			'gradient-primary': 'var(--gradient-primary)',
  			'gradient-secondary': 'var(--gradient-secondary)',
  			'gradient-accent': 'var(--gradient-accent)',
  			'gradient-cyber': 'var(--gradient-cyber)',
  		},
  		backdropBlur: {
  			'xs': '2px',
  		},
  		transitionTimingFunction: {
  			'neo': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  			'cyber': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  		},
  		transitionDuration: {
  			'fast': '150ms',
  			'normal': '300ms',
  			'slow': '500ms',
  			'cyber': '400ms',
  		},
  		spacing: {
  			'18': '4.5rem', // 72px for header height
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: 0
  				}
  			},
  			'gradient-shift': {
  				'0%': { 'background-position': '0% 50%' },
  				'50%': { 'background-position': '100% 50%' },
  				'100%': { 'background-position': '0% 50%' }
  			},
  			'pulse-modern': {
  				'0%, 100%': { opacity: 1 },
  				'50%': { opacity: 0.5 }
  			},
  			'fade-in': {
  				from: { opacity: 0 },
  				to: { opacity: 1 }
  			},
  			'slide-up': {
  				from: {
  					opacity: 0,
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: 1,
  					transform: 'translateY(0)'
  				}
  			},
  			'scale-in': {
  				from: {
  					opacity: 0,
  					transform: 'scale(0.95)'
  				},
  				to: {
  					opacity: 1,
  					transform: 'scale(1)'
  				}
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0px)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			'cyber-flow': {
  				'0%': { 'background-position': '0% 50%' },
  				'50%': { 'background-position': '100% 50%' },
  				'100%': { 'background-position': '0% 50%' }
  			},
  			'pulse-cyber': {
  				'0%, 100%': { opacity: 1 },
  				'50%': { opacity: 0.7 }
  			},
  			'float-cyber': {
  				'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
  				'33%': { transform: 'translateY(-10px) rotate(1deg)' },
  				'66%': { transform: 'translateY(-5px) rotate(-1deg)' }
  			},
  			'glow-pulse': {
  				'0%, 100%': { boxShadow: 'var(--glow-primary)' },
  				'50%': { boxShadow: 'var(--glow-cyber)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'cyber-flow': 'cyber-flow 4s ease infinite',
  			'pulse-cyber': 'pulse-cyber 2s ease-in-out infinite',
  			'fade-in': 'fade-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'slide-up': 'slide-up 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'scale-in': 'scale-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'float': 'float 3s ease-in-out infinite',
  			'float-cyber': 'float-cyber 3s ease-in-out infinite',
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
//  /** @type {import('tailwindcss').Config} */
//  export default {
// 	content: ["./src/**/*.{html,js}"],
// 	theme: {
// 	  extend: {},
// 	},
// 	plugins: [],
//   }