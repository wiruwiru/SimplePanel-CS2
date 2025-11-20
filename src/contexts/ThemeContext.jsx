"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("default");
  const [themes, setThemes] = useState([]);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themesResponse = await fetch("/api/themes");
        if (!themesResponse.ok) {
          throw new Error("Failed to fetch themes list");
        }

        const { themes: themeFiles } = await themesResponse.json();
        const loadedThemes = [];

        for (const themeName of themeFiles) {
          try {
            const response = await fetch(`/themes/${themeName}.json`);
            if (response.ok) {
              const themeData = await response.json();
              loadedThemes.push({
                id: themeName,
                ...themeData,
              });
            } else {
              console.error(`Theme ${themeName}.json not found`);
            }
          } catch (error) {
            console.error(`Error loading theme ${themeName}:`, error);
          }
        }

        setThemes(loadedThemes);
      } catch (error) {
        console.error("Error loading themes:", error);
        setThemes([
          { id: "default", name: "Default", colors: {} },
          { id: "dark", name: "Dark", colors: {} },
        ]);
      }
    };

    if (typeof window !== "undefined") {
      loadThemes();
    }
  }, []);

  const applyTheme = useCallback(async (themeName) => {
    try {
      if (typeof window === "undefined") return;

      const response = await fetch(`/themes/${themeName}.json`);
      if (!response.ok) {
        throw new Error(`Theme ${themeName}.json not found`);
      }

      const themeData = await response.json();
      Object.entries(themeData.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });

      localStorage.setItem("theme", themeName);
    } catch (error) {
      console.error(`Error applying theme ${themeName}:`, error);
      if (themeName !== "default") {
        applyTheme("default");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "default";
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, [applyTheme]);

  useEffect(() => {
    if (themes.length > 0) {
      applyTheme(theme);
    }
  }, [theme, themes, applyTheme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themes, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}