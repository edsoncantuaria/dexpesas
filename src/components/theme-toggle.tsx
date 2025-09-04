// src/components/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (!mounted) {
    // Render a placeholder or disabled button until mounted
    return <Button variant="outline" size="icon" disabled={true} aria-label="Toggle theme" />
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
