import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Gallery } from './components/Gallery'
import { EditorLayout } from './components/EditorLayout'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/edit/:id" element={<EditorLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
