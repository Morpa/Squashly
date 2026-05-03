interface LogoProps {
	size?: number;
	animated?: boolean;
}

export function SquashlyLogo({ size = 32, animated = false }: LogoProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<linearGradient
					id="logoGrad"
					x1="0"
					y1="0"
					x2="40"
					y2="40"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor="#9d8fff" />
					<stop offset="100%" stopColor="#6c5ce7" />
				</linearGradient>
				<linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#e8e8f0" stopOpacity="0.9" />
					<stop offset="100%" stopColor="#8888aa" stopOpacity="0.6" />
				</linearGradient>
			</defs>

			{/* Background circle */}
			<circle cx="20" cy="20" r="19" fill="url(#logoGrad)" />
			<circle cx="20" cy="20" r="19" fill="black" fillOpacity="0.1" />

			{/* Stack of horizontal lines (commits) */}
			<rect
				x="9"
				y="9"
				width="22"
				height="3.5"
				rx="1.75"
				fill="white"
				fillOpacity="0.9"
			/>
			<rect
				x="9"
				y="15"
				width="18"
				height="3.5"
				rx="1.75"
				fill="white"
				fillOpacity="0.65"
			/>
			<rect
				x="9"
				y="21"
				width="14"
				height="3.5"
				rx="1.75"
				fill="white"
				fillOpacity="0.4"
			/>

			{/* Compress/squash arrow pointing down */}
			<path
				d="M20 27.5 L16 32 L24 32 Z"
				fill="white"
				fillOpacity="0.95"
				style={animated ? { animation: "bounce 1.5s infinite" } : undefined}
			/>
			<rect
				x="18.5"
				y="26"
				width="3"
				height="3"
				rx="0.5"
				fill="white"
				fillOpacity="0.95"
			/>
		</svg>
	);
}
