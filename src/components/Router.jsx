import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './Home';
import { SignUp } from './SignUp';
import { Login } from './Login';
import { RequestPage } from './RequestPage';
import { StudentDashboard } from './StudentDashboard';
import { WardenDashboard } from './WardenDashboard';
import { EditWardenProfile } from './EditWardenProfile';
import { EditStudentProfile } from './EditStudentProfile';
import { NavBar } from './NavBar'; // Import your NavBar component
import { AdminDashboard } from './AdminDashboard';
import { ManageStudents } from './ManageStudents';
import { ManageWardens } from './ManageWardens';
import { ManageRequests } from './ManageRequests';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!hideNavbar && <NavBar />} {/* Conditionally render the NavBar */}
      {children}
    </>
  );
};

export const Router = () => {
  return (
    <div>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/login' element={<Login />} />
            <Route path='/requestpage' element={<RequestPage />} />
            <Route path='/studentdashboard' element={<StudentDashboard />} />
            <Route path='/wardendashboard' element={<WardenDashboard />} />
            <Route path='/editwardenprofile' element={<EditWardenProfile />} />
            <Route path='/editstudentprofile' element={<EditStudentProfile />} />
            <Route path='/admindashboard' element={<AdminDashboard />} />
            <Route path='/managestudents' element={<ManageStudents />} />
            <Route path='/managewardens' element={<ManageWardens />} />
            <Route path='/managerequests' element={<ManageRequests />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
};
