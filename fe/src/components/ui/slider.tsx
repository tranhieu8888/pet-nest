import * as React from "react"

export interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export const Slider: React.FC<SliderProps> = ({ value, onValueChange, min = 0, max = 100, step = 1, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([Number(e.target.value), value[1]])
  }
  const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([value[0], Number(e.target.value)])
  }
  return (
    <div className={`flex items-center space-x-2 ${className || ""}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className="w-full accent-blue-600"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[1]}
        onChange={handleChange2}
        className="w-full accent-blue-600"
      />
    </div>
  )
} 