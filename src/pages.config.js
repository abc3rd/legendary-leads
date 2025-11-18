import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Leads from './pages/Leads';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Import": Import,
    "Leads": Leads,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};