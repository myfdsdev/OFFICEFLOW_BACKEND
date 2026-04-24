/**
 * pages.config.js - Page routing configuration
 */

import AccessDenied from './pages/AccessDenied';
import AdminDashboard from './pages/AdminDashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import AttendanceReports from './pages/AttendanceReports';
import Checkout from './pages/Checkout';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import DirectMessages from './pages/DirectMessages';
import EmployeeDetails from './pages/EmployeeDetails';
import Groups from './pages/Groups';
import LeaveRequests from './pages/LeaveRequests';
import MyProfile from './pages/MyProfile';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProjectBoard from './pages/ProjectBoard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';
import Login from './pages/Login';
import Register from './pages/Register';

export const PAGES = {
    "AccessDenied": AccessDenied,
    "AdminDashboard": AdminDashboard,
    "AttendanceHistory": AttendanceHistory,
    "AttendanceReports": AttendanceReports,
    "Checkout": Checkout,
    "CompleteProfile": CompleteProfile,
    "Dashboard": Dashboard,
    "DirectMessages": DirectMessages,
    "EmployeeDetails": EmployeeDetails,
    "Groups": Groups,
    "LeaveRequests": LeaveRequests,
    "MyProfile": MyProfile,
    "Pricing": Pricing,
    "PrivacyPolicy": PrivacyPolicy,
    "ProjectBoard": ProjectBoard,
    "Projects": Projects,
    "Settings": Settings,
    "Welcome": Welcome,
    "Login": Login,
    "Register": Register,
};

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};