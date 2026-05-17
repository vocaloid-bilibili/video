import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import Home from './pages/HomePage.tsx'
import Editor from './pages/EditorPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

const media = window.matchMedia("(prefers-color-scheme: dark)");
function updateTheme() {
  if (media.matches) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
updateTheme();
media.addEventListener("change", updateTheme);
