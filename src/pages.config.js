import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Import from './pages/Import';
import Leads from './pages/Leads';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Home": Home,
    "Import": Import,
    "Leads": Leads,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};