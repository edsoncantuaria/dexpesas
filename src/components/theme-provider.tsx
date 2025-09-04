// src/components/theme-provider.tsx
"use client"

import * as React from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  attribute = "class",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    // No SSR, não podemos acessar o localStorage, então usamos o tema padrão.
    if (typeof window === "undefined") {
      return defaultTheme
    }
    // No cliente, tentamos ler do localStorage.
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const setTheme = (newTheme: Theme) => {
    // Só executa no cliente
    if (typeof window !== "undefined") {
      // 1. Salva a nova preferência no localStorage.
      localStorage.setItem(storageKey, newTheme)
      
      // 2. Aplica a classe ao `<html>` para a mudança ser imediata.
      const root = window.document.documentElement
      root.classList.remove("light", "dark")

      let effectiveTheme = newTheme;
      if (newTheme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      root.classList.add(effectiveTheme)
    }

    // 3. Atualiza o estado do React.
    setThemeState(newTheme)
  }


  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
