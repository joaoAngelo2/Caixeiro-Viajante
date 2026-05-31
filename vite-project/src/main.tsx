import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Ag from './Ag.tsx'
import {Routes,Route,BrowserRouter } from "react-router";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <StrictMode>
          <Routes>
            <Route path='/' element={<App/>}/>
            <Route path='/ag' element={<Ag/>}/>
          </Routes>
        </StrictMode>
    </BrowserRouter>
)
