import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import Home from './pages/HomePage.tsx'
import Editor from './pages/EditorPage.tsx'
import { toast, Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  </StrictMode>,
)

// 处理暗色模式
const media = window.matchMedia("(prefers-color-scheme: dark)");
function updateTheme() {
  if (media.matches) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
updateTheme();
media.addEventListener("change", updateTheme);

// 处理错误
window.addEventListener("error", (event: ErrorEvent) => {
  toast.error(event.message ?? "未知错误");
  console.error("全局错误:", event.error);
})
window.addEventListener("unhandledrejection", (event) => { 
  toast.error("异步错误" + (event.reason?.message ?? String(event.reason))); 
  console.error("Promise错误:", event.reason); 
});