/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Import from './pages/Import.jsx';
import Leads from './pages/Leads';
import Sequences from './pages/Sequences';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import MapView from './pages/MapView';
import TaskBoard from './pages/TaskBoard';
import VoiceOutreach from './pages/VoiceOutreach';
import Messaging from './pages/Messaging.jsx';
import SocialScraper from './pages/SocialScraper.jsx';
import RoundRobin from './pages/RoundRobin.jsx';
import Webhooks from './pages/Webhooks.jsx';
import WorkflowEngine from './pages/WorkflowEngine';
import TeamDashboard from './pages/TeamDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Home": Home,
    "Import": Import,
    "Leads": Leads,
    "Sequences": Sequences,
    "Settings": Settings,
    "Analytics": Analytics,
    "MapView": MapView,
    "TaskBoard": TaskBoard,
    "VoiceOutreach": VoiceOutreach,
    "Messaging": Messaging,
    "SocialScraper": SocialScraper,
    "RoundRobin": RoundRobin,
    "Webhooks": Webhooks,
    "WorkflowEngine": WorkflowEngine,
    "TeamDashboard": TeamDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};