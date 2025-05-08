import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './Home'
import { SignUp } from './SignUp'
import { Login } from './Login'
import { RequestPage } from './RequestPage'
import { StudentDashboard } from './StudentDashboard'
import { WardenDashboard } from './WardenDashboard'
import { EditWardenProfile } from './EditWardenProfile'

export const Router = () => {
  return (
    <div>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/signup' element={<SignUp/>}/>
            <Route path='/login' element={<Login/>}/>
            <Route path='/requestpage' element={<RequestPage/>}/>
            <Route path='/studentdashboard' element={<StudentDashboard/>}/>
            <Route path='/wardendashboard' element={<WardenDashboard/>}/>
            <Route path='/editwardenprofile' element={<EditWardenProfile/>}/>
          </Routes>
        </BrowserRouter>
    </div>
  )
}
