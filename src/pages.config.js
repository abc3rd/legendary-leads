/**
 * pages.config.js - Page routing configuration
 *
 * Heavy pages are code-split via React.lazy to boost startup speed
 * (important for Android WebView deployments).
 */
import { lazy } from 'react';

// Eagerly-loaded: landing page + lightweight pages
import Home from './pages/Home';
import Import from './pages/Import.jsx';
import Leads from './pages/Leads';
import Sequences from './pages/Sequences';
import Settings from './pages/Settings';
import Messaging from './pages/Messaging.jsx';
import RoundRobin from './pages/RoundRobin.jsx';
import Webhooks from './pages/Webhooks.jsx';
import Templates from './pages/Templates.jsx';
import LeadScoringSettings from './pages/LeadScoringSettings.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';

// Lazily-loaded heavy pages (charts, maps, 3D, AI chat, etc.)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const MapView = lazy(() => import('./pages/MapView'));
const VoiceOutreach = lazy(() => import('./pages/VoiceOutreach'));
const SocialScraper = lazy(() => import('./pages/SocialScraper.jsx'));
const LegenDatabase = lazy(() => import('./pages/LegenDatabase.jsx'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const TeamDashboard = lazy(() => import('./pages/TeamDashboard'));
const WorkflowEngine = lazy(() => import('./pages/WorkflowEngine'));
const UniversalInbox = lazy(() => import('./pages/UniversalInbox.jsx'));
const SmartScheduler = lazy(() => import('./pages/SmartScheduler.jsx'));

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
    "Templates": Templates,
    "LegenDatabase": LegenDatabase,
    "UniversalInbox": UniversalInbox,
    "LeadScoringSettings": LeadScoringSettings,
    "About": About,
    "Contact": Contact,
    "SmartScheduler": SmartScheduler,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};