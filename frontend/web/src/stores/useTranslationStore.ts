import { create } from "zustand";

export type Language = "English (US)" | "French" | "Vietnamese";

interface TranslationState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  "English (US)": {
    // Settings Nav
    "nav.personal": "Personal Information",
    "nav.security": "Security & Access",
    "nav.localization": "Localization",
    "nav.appearance": "Appearance",
    "nav.ai": "AI Assistant",
    "nav.preferences": "Travel Preferences",
    "settings.title": "Settings",

    // Localization Settings
    "loc.pageTitle": "Localization & Units",
    "loc.pageSubtitle":
      "Customize measurement systems, currency, and language preferences.",
    "loc.measurementsTitle": "Measurements & Units",
    "loc.temperatureLabel": "Temperature",
    "loc.temperatureDesc": "Choose your preferred temperature unit.",
    "loc.distanceLabel": "Distance",
    "loc.distanceDesc": "Used for maps and driving directions.",
    "loc.currencyLabel": "Default Currency",
    "loc.currencyDesc": "Used for cost estimates and budgets.",
    "loc.languageTitle": "Languages & Translation",
    "loc.primaryLangLabel": "Primary Language",
    "loc.primaryLangDesc": "Your default interface language.",
    "loc.autoTranslateLabel": "Auto-Translate Content",
    "loc.autoTranslateDesc":
      "Automatically translate points of interest and reviews to your primary language.",
    "loc.btnDiscard": "Discard",
    "loc.btnSave": "Save Changes",
    "loc.toastSave": "Localization settings saved",
    "loc.toastFail": "Failed to save settings",
    "loc.miles": "Miles",
    "loc.km": "Km",
    "loc.english": "English (US)",
    "loc.french": "Français",
    "loc.vietnamese": "Tiếng Việt",

    // Appearance Settings
    "appr.pageTitle": "Aesthetics & Accessibility",
    "appr.pageSubtitle":
      "Customize the appearance of the app and configure accessibility options.",
    "appr.themeTitle": "Theme Settings",
    "appr.themeDesc": "Select or customize your interface color scheme.",
    "appr.themeLight": "Light",
    "appr.themeDark": "Dark",
    "appr.themeSystem": "System",
    "appr.accTitle": "Accessibility",
    "appr.highContrast": "High Contrast",
    "appr.highContrastDesc":
      "Increases color contrast across the interface for better readability.",
    "appr.infiniteScroll": "Infinite Scroll",
    "appr.infiniteScrollDesc":
      "Automatically load the next page of itineraries instead of using pagination.",
    "appr.mapControls": "Persistent Map Controls",
    "appr.mapControlsDesc":
      "Always display zoom and pan controls on interactive map views.",

    // Travel Preferences
    "pref.pageTitle": "Travel & Booking Preferences",
    "pref.pageSubtitle":
      "Store your default settings to tailor the AI agent's itineraries perfectly to your liking.",
    "pref.generalTitle": "General Travel Profile",
    "pref.travelStyle": "Travel Style (From Onboarding)",
    "pref.interests": "Interests (From Onboarding)",
    "pref.notSelected": "Not selected",
    "pref.noneSelected": "None selected",
    "pref.bookingTitle": "Booking Specifics",
    "pref.seatPref": "Air Travel: Seat Preference",
    "pref.aisle": "Aisle",
    "pref.window": "Window",
    "pref.middle": "Middle",
    "pref.defaultAirport": "Default Departure Airport",
    "pref.meals": "Special Meals",
    "pref.hotelRoom": "Hotel Room Preference",
    "pref.1bed": "1 Bed",
    "pref.2beds": "2 Beds",
    "pref.smoking": "Smoking Preference",
    "pref.smokingDesc": "Allow booking smoking-friendly rooms.",
    "pref.accessible": "Accessibility Needs",
    "pref.accessibleDesc":
      "Prioritize wheelchair-accessible hotels and transportation.",
    "pref.loyaltyTitle": "Loyalty Programs",
    "pref.addProgram": "Add another program...",
    "pref.routingTitle": "Routing Preferences",
    "pref.travelMode": "Default Travel Mode",
    "pref.transit": "Transit",
    "pref.driving": "Driving",
    "pref.walking": "Walking",
    "pref.cycling": "Cycling",
    "pref.avoidTolls": "Avoid Tolls",
    "pref.avoidTollsDesc": "Default to routes without toll roads.",
    "pref.avoidTraffic": "Avoid Heavy Traffic",
    "pref.avoidTrafficDesc": "Reroute around known congestion.",

    // AI Assistant Settings
    "ai.pageTitle": "AI Assistant Configurations",
    "ai.pageSubtitle":
      "Tune the AI engine and manage your floating travel assistant.",
    "ai.globalTitle": "Global Travel Assistant",
    "ai.enableFloating": "Enable Floating Assistant",
    "ai.enableFloatingDesc":
      "Keep the AI chatbot accessible in the bottom right corner across all pages.",
    "ai.displayLogo": "Display AI Logo",
    "ai.displayLogoDesc":
      "Show the animated AI orb on the floating button when closed.",
    "ai.limitsTitle": "Behavior Limits",
    "ai.strictBudget": "Strict Budget Enforcement",
    "ai.strictBudgetDesc":
      "Prevent the AI from ever suggesting activities that exceed your set tier limit.",

    // Personal Info Settings
    "personal.pageTitle": "Personal Information",
    "personal.pageSubtitle":
      "Manage your legal identity and public profile details.",
    "personal.identityTitle": "Identity",
    "personal.firstName": "First Name",
    "personal.lastName": "Last Name",
    "personal.preferredName": "Preferred Name / Nickname",
    "personal.dob": "Date of Birth",
    "personal.pickDate": "Pick a date",
    "personal.gender": "Gender",
    "personal.contactTitle": "Contact Information",
    "personal.email": "Email Address",
    "personal.phone": "Phone Number",
    "personal.address": "Physical Address",
    "personal.btnDiscard": "Discard",
    "personal.btnSave": "Save Changes",
    "personal.toastSave": "Personal information updated",
    "personal.toastFail": "Failed to update information",

    // Security Settings
    "security.pageTitle": "Security & Access",
    "security.pageSubtitle":
      "Manage your account security, 2FA, and authorized devices.",
    "security.authTitle": "Authentication",
    "security.passwordAuth": "Password & Authentication",
    "security.passwordDesc": "Update your active password.",
    "security.btnChangePassword": "Change Password",
    "security.updatePasswordTitle": "Update Password",
    "security.updatePasswordDesc":
      "Enter your current password and choose a new one. Click save when you're done.",
    "security.currentPassword": "Current Password",
    "security.newPassword": "New Password",
    "security.btnCancel": "Cancel",
    "security.btnSavePassword": "Save Password",
    "security.externalProvider":
      "Your account is managed by an external provider (e.g., Google).",
    "security.twoFactor": "Two-Factor Authentication (2FA)",
    "security.twoFactorDesc": "Add an extra layer of security your account.",
    "security.btnManage2FA": "Manage 2FA",
    "security.deviceHistory": "Device History",
    "security.btnRevoke": "Revoke",
    "security.sharedAccess": "Shared Access",
    "security.collabApprovals": "Collaborator Approvals",
    "security.collabDesc":
      "Review and approve who can view or modify your trip folders.",
    "security.btnManageAccess": "Manage Access",
    "security.toastSavePassword": "Password updated successfully",
    "security.toastFillFields": "Please fill in both password fields.",
    "security.toastAccessUpdate": "Access settings updated",
    "security.toastRevokeDemo":
      "Revoking devices is currently disabled in demo mode",

    // Create Trip Wizard
    "wizard.step": "Step",
    "wizard.of": "of",
    "wizard.btnReset": "Reset",
    "wizard.btnBack": "Back",
    "wizard.btnNext": "Next",
    "wizard.btnCreating": "Creating...",
    "wizard.btnCreate": "Create Trip",
    "wizard.step1Title": "Trip Basics",
    "wizard.step1Desc": "Where and when are you going?",
    "wizard.destination": "Destination",
    "wizard.destPlaceholder": "e.g., Kyoto, Japan",
    "wizard.destError": "Destination must be at least 2 characters",
    "wizard.startDate": "Start Date",
    "wizard.pickStartDate": "Pick start date",
    "wizard.endDate": "End Date",
    "wizard.pickEndDate": "Pick end date",
    "wizard.dateError": "End date must be after the start date",
    "wizard.travelers": "Travelers",
    "wizard.adults": "Adults",
    "wizard.adultsAge": "Ages 13+",
    "wizard.children": "Children",
    "wizard.childrenAge": "Ages 0-12",
    "wizard.step2Title": "Budget",
    "wizard.step2Desc": "Set the total budget and priorities.",
    "wizard.totalBudget": "Total Budget",
    "wizard.personDay": "/person/day",
    "wizard.moneyPriority": "Money Priority",
    "wizard.comfortPriority": "Comfort Priority",
    "wizard.uniquePriority": "Unique Priority",
    "wizard.step3Title": "Accommodation",
    "wizard.step3Desc": "Choose the stay that fits you.",
    "wizard.accType": "Accommodation Type",
    "wizard.hotel": "Hotel",
    "wizard.hostel": "Hostel",
    "wizard.airbnb": "Airbnb",
    "wizard.resort": "Resort",
    "wizard.any": "Any",
    "wizard.flexibility": "Flexibility",
    "wizard.flexDesc": "Toggle if you already have a booking",
    "wizard.step4Title": "Activities",
    "wizard.step4Desc": "Mood and interests for the trip.",
    "wizard.mood": "Mood",
    "wizard.cityBreak": "City Break",
    "wizard.beach": "Beach",
    "wizard.hiking": "Hiking",
    "wizard.foodie": "Foodie",
    "wizard.romantic": "Romantic",
    "wizard.adventure": "Adventure",
    "wizard.interests": "Interests (up to 5)",
    "wizard.dealBreakers": "Deal-breakers",
    "wizard.int_localFood": "Local food",
    "wizard.int_museums": "Museums",
    "wizard.int_nightlife": "Nightlife",
    "wizard.int_nature": "Nature",
    "wizard.int_shopping": "Shopping",
    "wizard.int_wellness": "Wellness",
    "wizard.int_history": "History",
    "wizard.int_photography": "Photography",
    "wizard.int_liveMusic": "Live music",
    "wizard.int_markets": "Markets",
    "wizard.db_crowds": "Crowds",
    "wizard.db_longWalks": "Long walks",
    "wizard.db_earlyMornings": "Early mornings",
    "wizard.db_publicTransport": "Public transport",
    "wizard.db_streetFood": "Street food",
    "wizard.db_lateNights": "Late nights",
    // Activities Step (Wizard Step 4 - New Questions)
    "wizard.paceLabel": "Trip Pace",
    "wizard.paceRelaxed": "Relaxed",
    "wizard.paceRelaxedDesc": "Take time to soak it in (2-3 spots/day)",
    "wizard.paceBalanced": "Balanced",
    "wizard.paceBalancedDesc":
      "Most popular, plenty of time to rest (4-5 spots/day)",
    "wizard.pacePacked": "Packed",
    "wizard.pacePackedDesc": "See as much as possible (6+ spots/day)",
    "wizard.focusLabel": "Trip Focus",
    "wizard.focusMax3": "(Max 3)",
    "wizard.focusCulture": "Heritage & Culture",
    "wizard.focusCultureDesc": "Museums, history, arts",
    "wizard.focusNature": "Nature",
    "wizard.focusNatureDesc": "Beaches, parks, hiking",
    "wizard.focusGastronomy": "Gastronomy",
    "wizard.focusGastronomyDesc": "Local markets, restaurants, cafes",
    "wizard.focusLifestyle": "Lifestyle",
    "wizard.focusLifestyleDesc": "Shopping, spa, bar & nightlife",
    "wizard.constraintsLabel": "Special Requirements",
    "wizard.constraintMobility": "♿ Mobility friendly",
    "wizard.constraintMobilityDesc": "Max 800m walking or short rides",
    "wizard.constraintCrowds": "🤫 Avoid crowds",
    "wizard.constraintCrowdsDesc": "Prioritize hidden gems, avoid peak hours",
    "wizard.constraintStartLate": "🌅 Start after 10 AM",
    "wizard.constraintStartLateDesc": "No early morning activities",
    "wizard.constraintIndoor": "🏠 Indoor only",
    "wizard.constraintIndoorDesc": "Museums, malls, no outdoors",
    "wizard.constraintNoStreetFood": "🍽️ No street food",
    "wizard.constraintNoStreetFoodDesc":
      "Only restaurants & cafes with seating",
    "wizard.constraintNoLateNights": "🌙 Early nights",
    "wizard.constraintNoLateNightsDesc": "Finish by 10 PM, no bars/clubs",
    "wizard.warnLifestyleLateNights":
      "⚠️ Nightlife & 'Early nights' conflict. We will prioritize bars closing before 22h.",
    "wizard.infoCrowdsLifestyle":
      "ℹ️ We'll suggest boutique shops instead of big malls and crowded night markets.",
    "wizard.constraintIncompatible": "Incompatible with current focus",

    // Transport Step (Wizard Step 5)
    "wizard.step5Title": "Transport",
    "wizard.step5Desc": "How do you want to get around?",
    "wizard.transportLabel": "How do you want to travel?",
    "wizard.transportLabelDesc":
      "This helps us suggest sightseeing spots that match the distance between locations.",
    "wizard.transportWalking": "Walking",
    "wizard.transportWalkingDesc":
      "Comfortable when two points are less than 1.5 km apart",
    "wizard.transportPublic": "Public Transport",
    "wizard.transportPublicDesc":
      "Bus / Metro / Tram — great for distances under 10 km",
    "wizard.transportCar": "Car / Taxi",
    "wizard.transportCarDesc":
      "Suitable for distances under 15 km between stops",

    // Trips Page
    "trips.pageTitle": "My Trips",
    "trips.pageSubtitle": "Manage and plan all your adventures",
    "trips.newTrip": "New Trip",
    "trips.searchPlaceholder": "Search trips...",
    "trips.filterPlaceholder": "Filter by status",
    "trips.filterAll": "All Trips",
    "trips.filterDraft": "Draft",
    "trips.filterQueued": "Queued",
    "trips.filterProcessing": "Processing",
    "trips.filterCompleted": "Completed",
    "trips.filterFailed": "Failed",
    "trips.filterGenerating": "Generating",
    "trips.errorLoad": "Failed to load trips",
    "trips.emptyFilter": "No trips match your filters",
    "trips.emptyAll": "You haven't created any trips yet",
    "trips.createFirst": "Create Your First Trip",
    "trips.defaultTitle": "Trip to",

    // Map & Explore
    "explore.pageTitle": "Explore",
    "explore.pageSubtitle": "Discover places around the world",
    "explore.tripMapTitle": "Trip Map",
    "explore.tripMapSubtitle": "View your itinerary on the map",
    "explore.mapUnavailable": "Map Unavailable",
    "explore.mapError": "Failed to load the map. Please try again later.",
    "explore.mapboxTokenError": "Mapbox token not configured",

    // General App
    "dashboard.title": "Dashboard",
    "dashboard.trips": "My Trips",
    "dash.welcome": "Welcome back!",
    "dash.subtitle": "Here's what's happening with your trips",
    "dash.planNew": "Plan New Trip",
    "dash.totalTrips": "Total Trips",
    "dash.upcomingTrips": "Upcoming Trips",
    "dash.activeNow": "Active Now",
    "dash.recentTrips": "Recent Trips",
    "dash.totalPlaces": "Total Destinations",
    "dash.budgetSpent": "Total Spent",
    "dash.avgTravelers": "Avg. Travelers",
    "dash.viewAll": "View All",
    "dash.noTrips": "No trips yet",
    "dash.startPlanning": "Start planning your first adventure!",
    "dash.createTrip": "Create Trip",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.myTrips": "My Trips",
    "sidebar.explore": "Explore",
    "sidebar.ai": "AI Assistant",

    // Dropdown Menu
    "menu.account": "Account",
    "menu.myAccount": "My Account",
    "menu.settings": "Settings",
    "menu.signOut": "Sign Out",

    "trip.itinerary": "Itinerary",
    "trip.noItinerary": "No itinerary yet",
    "trip.noItineraryDesc": "Use the AI Assistant to generate your trip plan.",
    "trip.delete": "Delete trip",
    "trip.deleteConfirmTitle": 'Delete "{name}"?',
    "trip.deleteConfirmDesc":
      "This will permanently delete this trip and all its itinerary data. This action cannot be undone.",
    "trip.changeStatus": "Change trip status",
    "trip.lifecycle_upcoming": "Upcoming",
    "trip.lifecycle_in_trip": "In Trip",
    "trip.lifecycle_completed": "Completed",
    "trip.lifecycle_cancelled": "Cancelled",
    "trip.lifecycle_failed": "Failed",
    // Trips page sort
    "trips.sortPlaceholder": "Sort by",
    "trips.sortNewest": "Newest first",
    "trips.sortOldest": "Oldest first",
    "trips.sortAZ": "A \u2192 Z",
    "trips.sortZA": "Z \u2192 A",

    // Map View
    "map.viewOnMap": "View on Map",
    "map.day": "Day",
    "map.activities": "activities",
    "map.noCoords": "No location data for this trip",
    "map.noCoordsDesc":
      "Locations appear here once the itinerary is generated.",
    "map.flyToDay": "Jump to Day",
  },
  French: {
    // Settings Nav
    "nav.personal": "Informations Personnelles",
    "nav.security": "Sécurité et Accès",
    "nav.localization": "Localisation",
    "nav.appearance": "Apparence",
    "nav.ai": "Assistant IA",
    "nav.preferences": "Préférences de Voyage",
    "settings.title": "Paramètres",

    // Localization Settings
    "loc.pageTitle": "Localisation et Unités",
    "loc.pageSubtitle":
      "Personnalisez les systèmes de mesure, la devise et les préférences de langue.",
    "loc.measurementsTitle": "Mesures et Unités",
    "loc.temperatureLabel": "Température",
    "loc.temperatureDesc": "Choisissez votre unité de température préférée.",
    "loc.distanceLabel": "Distance",
    "loc.distanceDesc": "Utilisé pour les cartes et les itinéraires.",
    "loc.currencyLabel": "Devise par Défaut",
    "loc.currencyDesc": "Utilisé pour les estimations de coûts et les budgets.",
    "loc.languageTitle": "Langues et Traduction",
    "loc.primaryLangLabel": "Langue Principale",
    "loc.primaryLangDesc": "Votre langue d'interface par défaut.",
    "loc.autoTranslateLabel": "Traduction Automatique",
    "loc.autoTranslateDesc":
      "Traduire automatiquement les points d'intérêt et les avis dans votre langue principale.",
    "loc.btnDiscard": "Annuler",
    "loc.btnSave": "Enregistrer",
    "loc.toastSave": "Paramètres de localisation enregistrés",
    "loc.toastFail": "Échec de l'enregistrement",
    "loc.miles": "Milles",
    "loc.km": "Km",
    "loc.english": "Anglais (US)",
    "loc.french": "Français",
    "loc.vietnamese": "Vietnamien",

    // Appearance Settings
    "appr.pageTitle": "Esthétique et Accessibilité",
    "appr.pageSubtitle":
      "Personnalisez l'apparence de l'application et les options d'accessibilité.",
    "appr.themeTitle": "Paramètres du Thème",
    "appr.themeDesc": "Sélectionnez ou personnalisez la palette de couleurs.",
    "appr.themeLight": "Clair",
    "appr.themeDark": "Sombre",
    "appr.themeSystem": "Système",
    "appr.accTitle": "Accessibilité",
    "appr.highContrast": "Contraste Élevé",
    "appr.highContrastDesc":
      "Augmente le contraste des couleurs pour une meilleure lisibilité.",
    "appr.infiniteScroll": "Défilement Infini",
    "appr.infiniteScrollDesc":
      "Charge automatiquement la page suivante au lieu d'utiliser la pagination.",
    "appr.mapControls": "Contrôles de Carte Persistants",
    "appr.mapControlsDesc":
      "Afficher toujours les contrôles de zoom sur les cartes.",

    // Travel Preferences
    "pref.pageTitle": "Préférences de Voyage et Réservation",
    "pref.pageSubtitle":
      "Enregistrez vos paramètres par défaut pour adapter les itinéraires de l'IA à vos goûts.",
    "pref.generalTitle": "Profil de Voyage Général",
    "pref.travelStyle": "Style de Voyage (De l'inscription)",
    "pref.interests": "Centres d'intérêt (De l'inscription)",
    "pref.notSelected": "Non sélectionné",
    "pref.noneSelected": "Aucun sélectionné",
    "pref.bookingTitle": "Détails de Réservation",
    "pref.seatPref": "Voyage Aérien : Préférence de Siège",
    "pref.aisle": "Couloir",
    "pref.window": "Fenêtre",
    "pref.middle": "Milieu",
    "pref.defaultAirport": "Aéroport de Départ par Défaut",
    "pref.meals": "Repas Spéciaux",
    "pref.hotelRoom": "Préférence de Chambre d'Hôtel",
    "pref.1bed": "1 Lit",
    "pref.2beds": "2 Lits",
    "pref.smoking": "Préférence Fumeur",
    "pref.smokingDesc": "Autoriser la réservation de chambres fumeurs.",
    "pref.accessible": "Besoins d'Accessibilité",
    "pref.accessibleDesc":
      "Prioriser les hôtels et transports accessibles en fauteuil roulant.",
    "pref.loyaltyTitle": "Programmes de Fidélité",
    "pref.addProgram": "Ajouter un autre programme...",
    "pref.routingTitle": "Préférences d'Itinéraire",
    "pref.travelMode": "Mode de Déplacement par Défaut",
    "pref.transit": "Transport",
    "pref.driving": "Conduite",
    "pref.walking": "Marche",
    "pref.cycling": "Vélo",
    "pref.avoidTolls": "Éviter les Péages",
    "pref.avoidTollsDesc": "Privilégier les itinéraires sans routes à péage.",
    "pref.avoidTraffic": "Éviter les Bouchons",
    "pref.avoidTrafficDesc": "Contourner les congestions connues.",

    // AI Assistant Settings
    "ai.pageTitle": "Configurations de l'Assistant IA",
    "ai.pageSubtitle":
      "Réglez le moteur IA et gérez votre assistant de voyage flottant.",
    "ai.globalTitle": "Assistant de voyage global",
    "ai.enableFloating": "Activer l'assistant flottant",
    "ai.enableFloatingDesc":
      "Gardez le chatbot IA accessible dans le coin inférieur droit.",
    "ai.displayLogo": "Afficher le logo de l'IA",
    "ai.displayLogoDesc":
      "Montrez l'orbe IA animée sur le bouton flottant lorsqu'il est fermé.",
    "ai.limitsTitle": "Limites de Comportement",
    "ai.strictBudget": "Application Stricte du Budget",
    "ai.strictBudgetDesc":
      "Empêchez l'IA de suggérer des activités dépassant votre limite.",

    // Personal Info Settings
    "personal.pageTitle": "Informations Personnelles",
    "personal.pageSubtitle":
      "Gérez votre identité légale et les détails de votre profil public.",
    "personal.identityTitle": "Identité",
    "personal.firstName": "Prénom",
    "personal.lastName": "Nom de famille",
    "personal.preferredName": "Nom Préféré / Surnom",
    "personal.dob": "Date de naissance",
    "personal.pickDate": "Choisir une date",
    "personal.gender": "Genre",
    "personal.contactTitle": "Coordonnées",
    "personal.email": "Adresse Email",
    "personal.phone": "Numéro de Téléphone",
    "personal.address": "Adresse Physique",
    "personal.btnDiscard": "Annuler",
    "personal.btnSave": "Enregistrer les modifications",
    "personal.toastSave": "Informations personnelles mises à jour",
    "personal.toastFail": "Échec de la mise à jour des informations",

    // Security Settings
    "security.pageTitle": "Sécurité et Accès",
    "security.pageSubtitle":
      "Gérez la sécurité de votre compte, la 2FA et les appareils autorisés.",
    "security.authTitle": "Authentification",
    "security.passwordAuth": "Mot de passe et Authentification",
    "security.passwordDesc": "Mettez à jour votre mot de passe actif.",
    "security.btnChangePassword": "Changer le Mot de Passe",
    "security.updatePasswordTitle": "Mettre à jour le mot de passe",
    "security.updatePasswordDesc":
      "Entrez votre mot de passe actuel et choisissez-en un nouveau. Cliquez sur enregistrer quand vous avez terminé.",
    "security.currentPassword": "Mot de passe actuel",
    "security.newPassword": "Nouveau mot de passe",
    "security.btnCancel": "Annuler",
    "security.btnSavePassword": "Enregistrer le mot de passe",
    "security.externalProvider":
      "Votre compte est géré par un fournisseur externe (ex: Google).",
    "security.twoFactor": "Authentification à deux facteurs (2FA)",
    "security.twoFactorDesc":
      "Ajoutez une couche de sécurité supplémentaire à votre compte.",
    "security.btnManage2FA": "Gérer 2FA",
    "security.deviceHistory": "Historique des Appareils",
    "security.btnRevoke": "Révoquer",
    "security.sharedAccess": "Accès Partagé",
    "security.collabApprovals": "Approbations des Collaborateurs",
    "security.collabDesc":
      "Examinez et approuvez qui peut voir ou modifier vos dossiers de voyage.",
    "security.btnManageAccess": "Gérer l'accès",
    "security.toastSavePassword": "Mot de passe mis à jour avec succès",
    "security.toastFillFields":
      "Veuillez remplir les deux champs de mot de passe.",
    "security.toastAccessUpdate": "Paramètres d'accès mis à jour",
    "security.toastRevokeDemo":
      "La révocation des appareils est actuellement désactivée en mode démo",

    // Create Trip Wizard
    "wizard.step": "Étape",
    "wizard.of": "sur",
    "wizard.btnReset": "Réinitialiser",
    "wizard.btnBack": "Retour",
    "wizard.btnNext": "Suivant",
    "wizard.btnCreating": "Création...",
    "wizard.btnCreate": "Créer le voyage",
    "wizard.step1Title": "Bases du Voyage",
    "wizard.step1Desc": "Où et quand partez-vous ?",
    "wizard.destination": "Destination",
    "wizard.destPlaceholder": "ex: Kyoto, Japon",
    "wizard.destError": "La destination doit comporter au moins 2 caractères",
    "wizard.startDate": "Date de Début",
    "wizard.pickStartDate": "Choisir la date de début",
    "wizard.endDate": "Date de Fin",
    "wizard.pickEndDate": "Choisir la date de fin",
    "wizard.dateError":
      "La date de fin doit être postérieure à la date de début",
    "wizard.travelers": "Voyageurs",
    "wizard.adults": "Adultes",
    "wizard.adultsAge": "13 ans et +",
    "wizard.children": "Enfants",
    "wizard.childrenAge": "0-12 ans",
    "wizard.step2Title": "Budget",
    "wizard.step2Desc": "Définissez le budget total et les priorités.",
    "wizard.totalBudget": "Budget Total",
    "wizard.personDay": "/personne/jour",
    "wizard.moneyPriority": "Priorité Financière",
    "wizard.comfortPriority": "Priorité au Confort",
    "wizard.uniquePriority": "Priorité à l'Originalité",
    "wizard.step3Title": "Hébergement",
    "wizard.step3Desc": "Choisissez le séjour qui vous convient.",
    "wizard.accType": "Type d'Hébergement",
    "wizard.hotel": "Hôtel",
    "wizard.hostel": "Auberge",
    "wizard.airbnb": "Airbnb",
    "wizard.resort": "Complexe",
    "wizard.any": "Peu importe",
    "wizard.flexibility": "Flexibilité",
    "wizard.flexDesc": "Cochez si vous avez déjà une réservation",
    "wizard.step4Title": "Activités",
    "wizard.step4Desc": "Ambiance et centres d'intérêt du voyage.",
    "wizard.mood": "Ambiance",
    "wizard.cityBreak": "Escapade Citadine",
    "wizard.beach": "Plage",
    "wizard.hiking": "Randonnée",
    "wizard.foodie": "Gastronomie",
    "wizard.romantic": "Romantique",
    "wizard.adventure": "Aventure",
    "wizard.interests": "Centres d'intérêt (jusqu'à 5)",
    "wizard.dealBreakers": "À éviter absolument",
    "wizard.int_localFood": "Nourriture locale",
    "wizard.int_museums": "Musées",
    "wizard.int_nightlife": "Vie nocturne",
    "wizard.int_nature": "Nature",
    "wizard.int_shopping": "Shopping",
    "wizard.int_wellness": "Bien-être",
    "wizard.int_history": "Histoire",
    "wizard.int_photography": "Photographie",
    "wizard.int_liveMusic": "Musique live",
    "wizard.int_markets": "Marchés",
    "wizard.db_crowds": "Foules",
    "wizard.db_longWalks": "Longues marches",
    "wizard.db_earlyMornings": "Matinées précoces",
    "wizard.db_publicTransport": "Transports en commun",
    "wizard.db_streetFood": "Cuisine de rue",
    "wizard.db_lateNights": "Nuits tardives",
    // Activities Step (Wizard Step 4 - New Questions)
    "wizard.paceLabel": "Rythme du Voyage",
    "wizard.paceRelaxed": "Détendu",
    "wizard.paceRelaxedDesc": "Prenez le temps d'apprécier (2-3 lieux/jour)",
    "wizard.paceBalanced": "Équilibré",
    "wizard.paceBalancedDesc":
      "Le plus populaire, assez de temps pour se reposer (4-5 lieux/jour)",
    "wizard.pacePacked": "Intense",
    "wizard.pacePackedDesc": "Voir autant que possible (6+ lieux/jour)",
    "wizard.focusLabel": "Objectif du Voyage",
    "wizard.focusMax3": "(Max 3)",
    "wizard.focusCulture": "Patrimoine & Culture",
    "wizard.focusCultureDesc": "Musées, histoire, arts",
    "wizard.focusNature": "Nature",
    "wizard.focusNatureDesc": "Plages, parcs, randonnée",
    "wizard.focusGastronomy": "Gastronomie",
    "wizard.focusGastronomyDesc": "Marchés locaux, restaurants, cafés",
    "wizard.focusLifestyle": "Style de vie",
    "wizard.focusLifestyleDesc": "Shopping, spa, bar et vie nocturne",
    "wizard.constraintsLabel": "Besoins Spécifiques",
    "wizard.constraintMobility": "♿ Accessibilité",
    "wizard.constraintMobilityDesc": "Max 800m de marche ou trajets courts",
    "wizard.constraintCrowds": "🤫 Éviter la foule",
    "wizard.constraintCrowdsDesc":
      "Privilégier les lieux cachés, éviter les heures de pointe",
    "wizard.constraintStartLate": "🌅 Commencer après 10h",
    "wizard.constraintStartLateDesc": "Pas d'activités tôt le matin",
    "wizard.constraintIndoor": "🏠 En intérieur uniquement",
    "wizard.constraintIndoorDesc":
      "Musées, centres commerciaux, pas d'extérieur",
    "wizard.constraintNoStreetFood": "🍽️ Pas de cuisine de rue",
    "wizard.constraintNoStreetFoodDesc":
      "Seulement des restaurants et cafés avec places assises",
    "wizard.constraintNoLateNights": "🌙 Rentrer tôt",
    "wizard.constraintNoLateNightsDesc":
      "Terminer avant 22h, pas de bars/clubs",
    "wizard.warnLifestyleLateNights":
      "⚠️ Conflit entre 'Vie nocturne' et 'Rentrer tôt'. Nous prioriserons les bars fermant avant 22h.",
    "wizard.infoCrowdsLifestyle":
      "ℹ️ Nous suggérerons des boutiques plutôt que de grands magasins et les foules.",
    "wizard.constraintIncompatible": "Incompatible avec l'objectif actuel",

    // Transport Step (Wizard Step 5)
    "wizard.step5Title": "Transport",
    "wizard.step5Desc": "Comment souhaitez-vous vous déplacer ?",
    "wizard.transportLabel": "Comment voulez-vous voyager ?",
    "wizard.transportLabelDesc":
      "Cela nous aide à suggérer des sites touristiques adaptés à la distance entre les lieux.",
    "wizard.transportWalking": "À pied",
    "wizard.transportWalkingDesc":
      "Confortable lorsque deux points sont à moins de 1,5 km",
    "wizard.transportPublic": "Transports en commun",
    "wizard.transportPublicDesc":
      "Bus / Métro / Tram — idéal pour les distances de moins de 10 km",
    "wizard.transportCar": "Voiture / Taxi",
    "wizard.transportCarDesc":
      "Adapté pour les distances de moins de 15 km entre les arrêts",

    // Trips Page
    "trips.pageTitle": "Mes Voyages",
    "trips.pageSubtitle": "Gérez et planifiez toutes vos aventures",
    "trips.newTrip": "Nouveau Voyage",
    "trips.searchPlaceholder": "Rechercher des voyages...",
    "trips.filterPlaceholder": "Filtrer par statut",
    "trips.filterAll": "Tous les voyages",
    "trips.filterDraft": "Brouillon",
    "trips.filterQueued": "En file d'attente",
    "trips.filterProcessing": "En traitement",
    "trips.filterCompleted": "Terminé",
    "trips.filterFailed": "Échoué",
    "trips.filterGenerating": "En génération",
    "trips.errorLoad": "Échec du chargement des voyages",
    "trips.emptyFilter": "Aucun voyage ne correspond à vos filtres",
    "trips.emptyAll": "Vous n'avez pas encore créé de voyage",
    "trips.createFirst": "Créer votre premier voyage",
    "trips.defaultTitle": "Voyage à",

    // Map & Explore
    "explore.pageTitle": "Explorer",
    "explore.pageSubtitle": "Découvrez des endroits à travers le monde",
    "explore.tripMapTitle": "Carte du voyage",
    "explore.tripMapSubtitle": "Consultez votre itinéraire sur la carte",
    "explore.mapUnavailable": "Carte indisponible",
    "explore.mapError":
      "Échec du chargement de la carte. Veuillez réessayer plus tard.",
    "explore.mapboxTokenError": "Jeton Mapbox non configuré",

    // General App
    "dashboard.title": "Tableau de bord",
    "dashboard.trips": "Mes Voyages",
    "dash.welcome": "Bon retour !",
    "dash.subtitle": "Voici ce qui se passe avec vos voyages",
    "dash.planNew": "Planifier",
    "dash.totalTrips": "Total des voyages",
    "dash.upcomingTrips": "Voyages à venir",
    "dash.activeNow": "Actif maintenant",
    "dash.recentTrips": "Voyages récents",
    "dash.totalPlaces": "Destinations Totales",
    "dash.budgetSpent": "Dépenses Totales",
    "dash.avgTravelers": "Voyageurs Moy.",
    "dash.viewAll": "Voir tout",
    "dash.noTrips": "Aucun voyage",
    "dash.startPlanning": "Commencez à planifier votre aventure !",
    "dash.createTrip": "Créer",

    // Sidebar
    "sidebar.dashboard": "Tableau de bord",
    "sidebar.myTrips": "Mes Voyages",
    "sidebar.explore": "Explorer",
    "sidebar.ai": "Assistant IA",

    // Dropdown Menu
    "menu.account": "Compte",
    "menu.myAccount": "Mon Compte",
    "menu.settings": "Paramètres",
    "menu.signOut": "Se Déconnecter",

    "trip.itinerary": "Itinéraire",
    "trip.noItinerary": "Aucun itinéraire pour l'instant",
    "trip.noItineraryDesc":
      "Utilisez l'assistant IA pour générer votre plan de voyage.",
    "trip.delete": "Supprimer",
    "trip.deleteConfirmTitle": 'Supprimer "{name}" ?',
    "trip.deleteConfirmDesc":
      "Cette action supprimera définitivement ce voyage et toutes ses données. Elle est irréversible.",
    "trip.changeStatus": "Changer le statut",
    "trip.lifecycle_upcoming": "À venir",
    "trip.lifecycle_in_trip": "En cours",
    "trip.lifecycle_completed": "Terminé",
    "trip.lifecycle_cancelled": "Annulé",
    "trip.lifecycle_failed": "Échoué",
    // Trips page sort
    "trips.sortPlaceholder": "Trier par",
    "trips.sortNewest": "Plus récent",
    "trips.sortOldest": "Plus ancien",
    "trips.sortAZ": "A \u2192 Z",
    "trips.sortZA": "Z \u2192 A",

    // Map View
    "map.viewOnMap": "Voir sur la carte",
    "map.day": "Jour",
    "map.activities": "activités",
    "map.noCoords": "Aucune donnée de localisation pour ce voyage",
    "map.noCoordsDesc":
      "Les lieux apparaissent ici une fois l'itinéraire généré.",
    "map.flyToDay": "Aller au Jour",
  },
  Vietnamese: {
    // Settings Nav
    "nav.personal": "Thông tin Cáo nhân",
    "nav.security": "Bảo mật & Truy cập",
    "nav.localization": "Định vị",
    "nav.appearance": "Giao diện",
    "nav.ai": "Trợ lý AI",
    "nav.preferences": "Sở thích Du lịch",
    "settings.title": "Cài đặt",

    // Localization Settings
    "loc.pageTitle": "Định vị & Đơn vị",
    "loc.pageSubtitle": "Tùy chỉnh hệ thống đo lường, tiền tệ và ngôn ngữ.",
    "loc.measurementsTitle": "Đo lường & Đơn vị",
    "loc.temperatureLabel": "Nhiệt độ",
    "loc.temperatureDesc": "Chọn đơn vị nhiệt độ ưa thích của bạn.",
    "loc.distanceLabel": "Khoảng cách",
    "loc.distanceDesc": "Sử dụng cho bản đồ và chỉ đường.",
    "loc.currencyLabel": "Tiền tệ Mặc định",
    "loc.currencyDesc": "Sử dụng cho ước tính chi phí và ngân sách.",
    "loc.languageTitle": "Ngôn ngữ & Dịch thuật",
    "loc.primaryLangLabel": "Ngôn ngữ Chính",
    "loc.primaryLangDesc": "Ngôn ngữ giao diện mặc định của bạn.",
    "loc.autoTranslateLabel": "Tự động Dịch",
    "loc.autoTranslateDesc":
      "Tự động dịch các địa điểm quan tâm và đánh giá sang ngôn ngữ chính của bạn.",
    "loc.btnDiscard": "Hủy",
    "loc.btnSave": "Lưu thay đổi",
    "loc.toastSave": "Đã lưu cài đặt định vị",
    "loc.toastFail": "Không thể lưu cài đặt",
    "loc.miles": "Dặm",
    "loc.km": "Km",
    "loc.english": "Tiếng Anh (Mỹ)",
    "loc.french": "Tiếng Pháp",
    "loc.vietnamese": "Tiếng Việt",

    // Appearance Settings
    "appr.pageTitle": "Giao diện & Trợ năng",
    "appr.pageSubtitle":
      "Tùy chỉnh giao diện ứng dụng và cấu hình các tùy chọn trợ năng.",
    "appr.themeTitle": "Cài đặt Chủ đề",
    "appr.themeDesc": "Chọn hoặc tùy chỉnh màu sắc giao diện của bạn.",
    "appr.themeLight": "Sáng",
    "appr.themeDark": "Tối",
    "appr.themeSystem": "Hệ thống",
    "appr.accTitle": "Trợ năng",
    "appr.highContrast": "Độ tương phản cao",
    "appr.highContrastDesc":
      "Tăng độ tương phản màu sắc trên toàn giao diện để dễ đọc hơn.",
    "appr.infiniteScroll": "Cuộn vô hạn",
    "appr.infiniteScrollDesc":
      "Tự động tải trang tiếp theo thay vì sử dụng phân trang.",
    "appr.mapControls": "Hiển thị điều khiển bản đồ",
    "appr.mapControlsDesc": "Luôn hiển thị các nút thu phóng trên bản đồ.",

    // Travel Preferences
    "pref.pageTitle": "Sở thích Du lịch & Đặt phòng",
    "pref.pageSubtitle":
      "Lưu các cài đặt mặc định của bạn để AI có thể lên lịch trình hoàn hảo theo ý thích của bạn.",
    "pref.generalTitle": "Hồ sơ Du lịch Chung",
    "pref.travelStyle": "Phong cách Du lịch (Từ lúc đăng ký)",
    "pref.interests": "Sở thích (Từ lúc đăng ký)",
    "pref.notSelected": "Chưa chọn",
    "pref.noneSelected": "Không có",
    "pref.bookingTitle": "Chi tiết Đặt phòng",
    "pref.seatPref": "Di chuyển Hàng không: Chỗ ngồi",
    "pref.aisle": "Lối đi",
    "pref.window": "Cửa sổ",
    "pref.middle": "Ghế giữa",
    "pref.defaultAirport": "Sân bay Khởi hành Mặc định",
    "pref.meals": "Suất ăn Đặc biệt",
    "pref.hotelRoom": "Tùy chọn Phòng Khách sạn",
    "pref.1bed": "1 Giường",
    "pref.2beds": "2 Giường",
    "pref.smoking": "Cho phép hút thuốc",
    "pref.smokingDesc": "Cho phép đặt phòng khách sạn cho phép hút thuốc.",
    "pref.accessible": "Nhu cầu Trợ năng",
    "pref.accessibleDesc":
      "Ưu tiên khách sạn và phương tiện giao thông hỗ trợ xe lăn.",
    "pref.loyaltyTitle": "Chương trình Khách hàng Thân thiết",
    "pref.addProgram": "Thêm một chương trình khác...",
    "pref.routingTitle": "Sở thích Định tuyến",
    "pref.travelMode": "Phương tiện di chuyển mặc định",
    "pref.transit": "Phương tiện công cộng",
    "pref.driving": "Lái xe",
    "pref.walking": "Đi bộ",
    "pref.cycling": "Xe đạp",
    "pref.avoidTolls": "Tránh trạm thu phí",
    "pref.avoidTollsDesc": "Mặc định tránh các tuyến đường có trạm thu phí.",
    "pref.avoidTraffic": "Tránh kẹt xe",
    "pref.avoidTrafficDesc":
      "Định tuyến lại xung quanh các khu vực ùn tắc đã biết.",

    // AI Assistant Settings
    "ai.pageTitle": "Cấu hình Trợ lý AI",
    "ai.pageSubtitle":
      "Điều chỉnh công cụ AI và quản lý trợ lý du lịch nổi của bạn.",
    "ai.globalTitle": "Trợ lý Du lịch Toàn cầu",
    "ai.enableFloating": "Bật Trợ lý Nổi",
    "ai.enableFloatingDesc":
      "Giữ cho chatbot AI có thể truy cập ở góc dưới bên phải trên tất cả các trang.",
    "ai.displayLogo": "Hiển thị Logo AI",
    "ai.displayLogoDesc":
      "Hiển thị quả cầu AI hoạt hình trên nút nổi khi đóng.",
    "ai.limitsTitle": "Giới hạn Hành vi",
    "ai.strictBudget": "Thi hành Ngân sách Nghiêm ngặt",
    "ai.strictBudgetDesc":
      "Ngăn AI đề xuất các hoạt động vượt quá giới hạn thiết lập của bạn.",

    // Personal Info Settings
    "personal.pageTitle": "Thông tin Cá nhân",
    "personal.pageSubtitle":
      "Quản lý danh tính pháp lý và thông tin hồ sơ công khai của bạn.",
    "personal.identityTitle": "Danh tính",
    "personal.firstName": "Tên",
    "personal.lastName": "Họ",
    "personal.preferredName": "Tên gọi ưu thích / Biệt danh",
    "personal.dob": "Ngày sinh",
    "personal.pickDate": "Chọn một ngày",
    "personal.gender": "Giới tính",
    "personal.contactTitle": "Thông tin Liên hệ",
    "personal.email": "Địa chỉ Email",
    "personal.phone": "Số điện thoại",
    "personal.address": "Địa chỉ thường trú",
    "personal.btnDiscard": "Hủy thay đổi",
    "personal.btnSave": "Lưu thay đổi",
    "personal.toastSave": "Đã cập nhật thông tin cá nhân",
    "personal.toastFail": "Không thể cập nhật thông tin",

    // Security Settings
    "security.pageTitle": "Bảo mật & Truy cập",
    "security.pageSubtitle":
      "Quản lý bảo mật tài khoản, xác thực 2 bước và các thiết bị được ủy quyền.",
    "security.authTitle": "Xác thực",
    "security.passwordAuth": "Mật khẩu & Xác thực",
    "security.passwordDesc": "Cập nhật mật khẩu hoạt động của bạn.",
    "security.btnChangePassword": "Đổi Mật Khẩu",
    "security.updatePasswordTitle": "Cập nhật Mật khẩu",
    "security.updatePasswordDesc":
      "Nhập mật khẩu hiện tại và chọn mật khẩu mới. Nhấp vào lưu khi bạn hoàn tất.",
    "security.currentPassword": "Mật khẩu hiện tại",
    "security.newPassword": "Mật khẩu mới",
    "security.btnCancel": "Hủy bỏ",
    "security.btnSavePassword": "Lưu Mật khẩu",
    "security.externalProvider":
      "Tài khoản của bạn được quản lý bởi nhà cung cấp bên ngoài (ví dụ: Google).",
    "security.twoFactor": "Xác thực Hai yếu tố (2FA)",
    "security.twoFactorDesc":
      "Thêm một lớp bảo mật bổ sung cho tài khoản của bạn.",
    "security.btnManage2FA": "Quản lý 2FA",
    "security.deviceHistory": "Lịch sử Thiết bị",
    "security.btnRevoke": "Thu hồi",
    "security.sharedAccess": "Truy cập Chia sẻ",
    "security.collabApprovals": "Phê duyệt Cộng tác viên",
    "security.collabDesc":
      "Xem xét và phê duyệt người có thể xem hoặc sửa đổi thư mục chuyến đi của bạn.",
    "security.btnManageAccess": "Quản lý Truy cập",
    "security.toastSavePassword": "Đã cập nhật mật khẩu thành công",
    "security.toastFillFields": "Vui lòng điền vào cả hai trường mật khẩu.",
    "security.toastAccessUpdate": "Đã cập nhật cài đặt truy cập",
    "security.toastRevokeDemo":
      "Tính năng thu hồi thiết bị hiện đã bị vô hiệu hóa trong chế độ dùng thử",

    // Create Trip Wizard
    "wizard.step": "Bước",
    "wizard.of": "trên",
    "wizard.btnReset": "Đặt lại",
    "wizard.btnBack": "Quay lại",
    "wizard.btnNext": "Tiếp tục",
    "wizard.btnCreating": "Đang tạo...",
    "wizard.btnCreate": "Tạo Chuyến Đi",
    "wizard.step1Title": "Thông tin Cơ bản",
    "wizard.step1Desc": "Bạn định đi đâu và khi nào?",
    "wizard.destination": "Điểm đến",
    "wizard.destPlaceholder": "VD: Kyoto, Nhật Bản",
    "wizard.destError": "Điểm đến phải có ít nhất 2 ký tự",
    "wizard.startDate": "Ngày Bắt đầu",
    "wizard.pickStartDate": "Chọn ngày bắt đầu",
    "wizard.endDate": "Ngày Kết thúc",
    "wizard.pickEndDate": "Chọn ngày kết thúc",
    "wizard.dateError": "Ngày kết thúc phải sau ngày bắt đầu",
    "wizard.travelers": "Người Đi Cùng",
    "wizard.adults": "Người Lớn",
    "wizard.adultsAge": "Trên 13 tuổi",
    "wizard.children": "Trẻ Em",
    "wizard.childrenAge": "0-12 tuổi",
    "wizard.step2Title": "Ngân Sách",
    "wizard.step2Desc": "Đặt tổng ngân sách và các ưu tiên khác.",
    "wizard.totalBudget": "Tổng Ngân Sách",
    "wizard.personDay": "/người/ngày",
    "wizard.moneyPriority": "Ưu tiên Tài chính",
    "wizard.comfortPriority": "Ưu tiên Sự Thoải mái",
    "wizard.uniquePriority": "Ưu tiên Sự Độc đáo",
    "wizard.step3Title": "Chỗ Ở",
    "wizard.step3Desc": "Chọn hình thức lưu trú phù hợp với bạn.",
    "wizard.accType": "Loại Chỗ Ở",
    "wizard.hotel": "Khách sạn",
    "wizard.hostel": "Nhà nghỉ",
    "wizard.airbnb": "Airbnb",
    "wizard.resort": "Khu nghỉ dưỡng",
    "wizard.any": "Bất kỳ",
    "wizard.flexibility": "Sự Linh hoạt",
    "wizard.flexDesc": "Bật nếu bạn đã đặt chỗ trước",
    "wizard.step4Title": "Hoạt Động",
    "wizard.step4Desc": "Tâm trạng và sở thích cho chuyến đi.",
    "wizard.mood": "Tâm trạng",
    "wizard.cityBreak": "Khám phá thành phố",
    "wizard.beach": "Biển",
    "wizard.hiking": "Đường dài & Leo núi",
    "wizard.foodie": "Ẩm thực",
    "wizard.romantic": "Lãng mạn",
    "wizard.adventure": "Phiêu lưu mạo hiểm",
    "wizard.interests": "Sở thích (tối đa 5)",
    "wizard.dealBreakers": "Những điều cần Tránh",
    "wizard.int_localFood": "Ẩm thực địa phương",
    "wizard.int_museums": "Bảo tàng",
    "wizard.int_nightlife": "Cuộc sống về đêm",
    "wizard.int_nature": "Thiên nhiên",
    "wizard.int_shopping": "Mua sắm",
    "wizard.int_wellness": "Sức khỏe & Chải chuốt",
    "wizard.int_history": "Lịch sử",
    "wizard.int_photography": "Nhiếp ảnh",
    "wizard.int_liveMusic": "Nhạc sống",
    "wizard.int_markets": "Chợ địa phương",
    "wizard.db_crowds": "Nơi quá đông người",
    "wizard.db_longWalks": "Đi bộ đường dài",
    "wizard.db_earlyMornings": "Dậy sớm",
    "wizard.db_publicTransport": "Giao thông công cộng",
    "wizard.db_streetFood": "Thức ăn đường phố",
    "wizard.db_lateNights": "Thức khuya",
    // Activities Step (Wizard Step 4 - New Questions)
    "wizard.paceLabel": "Tốc độ chuyến đi",
    "wizard.paceRelaxed": "Thong thả",
    "wizard.paceRelaxedDesc": "Tận hưởng từng khoảnh khắc (2-3 điểm/ngày)",
    "wizard.paceBalanced": "Cân bằng",
    "wizard.paceBalancedDesc":
      "Phổ biến nhất, đủ thời gian nghỉ (4-5 điểm/ngày)",
    "wizard.pacePacked": "Khám phá tối đa",
    "wizard.pacePackedDesc": "Đi nhiều nhất có thể (6+ điểm/ngày)",
    "wizard.focusLabel": "Trọng tâm chuyến đi",
    "wizard.focusMax3": "(Chọn tối đa 3)",
    "wizard.focusCulture": "Di sản & Văn hóa",
    "wizard.focusCultureDesc": "Bảo tàng, lịch sử, nghệ thuật",
    "wizard.focusNature": "Thiên nhiên",
    "wizard.focusNatureDesc": "Bãi biển, công viên, leo núi",
    "wizard.focusGastronomy": "Ẩm thực",
    "wizard.focusGastronomyDesc": "Chợ địa phương, nhà hàng, cà phê",
    "wizard.focusLifestyle": "Phong cách sống",
    "wizard.focusLifestyleDesc": "Mua sắm, spa, bar & nightlife",
    "wizard.constraintsLabel": "Yêu cầu đặc biệt",
    "wizard.constraintMobility": "♿ Di chuyển thoải mái",
    "wizard.constraintMobilityDesc": "Tối đa 800m đi bộ hoặc đón xe ngắn",
    "wizard.constraintCrowds": "🤫 Tránh chỗ đông người",
    "wizard.constraintCrowdsDesc": "Ưu tiên 'hidden gems', tránh giờ cao điểm",
    "wizard.constraintStartLate": "🌅 Bắt đầu sau 10 giờ",
    "wizard.constraintStartLateDesc": "Không xếp hoạt động buổi sáng sớm",
    "wizard.constraintIndoor": "🏠 Trong nhà",
    "wizard.constraintIndoorDesc": "Bảo tàng, mall, không đi ngoài trời",
    "wizard.constraintNoStreetFood": "🍽️ Không ăn vỉa hè",
    "wizard.constraintNoStreetFoodDesc": "Chỉ nhà hàng và cà phê có bàn ghế",
    "wizard.constraintNoLateNights": "🌙 Về sớm",
    "wizard.constraintNoLateNightsDesc":
      "Kết thúc trước 22 giờ, không bar/club",
    "wizard.warnLifestyleLateNights":
      "⚠️ Nightlife và 'Về sớm' có thể xung đột. Chúng tôi sẽ ưu tiên bars đóng trước 22h.",
    "wizard.infoCrowdsLifestyle":
      "ℹ️ Sẽ gợi ý boutique shops thay vì mall lớn và chợ đêm đông.",
    "wizard.constraintIncompatible": "Không tương thích với focus hiện tại",

    // Transport Step (Wizard Step 5)
    "wizard.step5Title": "Phương Tiện",
    "wizard.step5Desc": "Bạn muốn di chuyển bằng gì?",
    "wizard.transportLabel": "Bạn muốn di chuyển bằng phương tiện gì?",
    "wizard.transportLabelDesc":
      "Lựa chọn này giúp chúng tôi gợi ý các điểm tham quan phù hợp với khoảng cách giữa các địa điểm.",
    "wizard.transportWalking": "Đi bộ",
    "wizard.transportWalkingDesc": "Thoải mái khi 2 điểm cách nhau dưới 1.5 km",
    "wizard.transportPublic": "Phương tiện công cộng",
    "wizard.transportPublicDesc":
      "Xe buýt / Tàu điện / Tram — tốt cho khoảng cách dưới 10 km",
    "wizard.transportCar": "Xe / Taxi",
    "wizard.transportCarDesc":
      "Phù hợp cho khoảng cách dưới 15 km giữa các điểm",

    // Trips Page
    "trips.pageTitle": "Chuyến đi của tôi",
    "trips.pageSubtitle": "Quản lý và lên kế hoạch cho mọi chuyến phiêu lưu",
    "trips.newTrip": "Chuyến đi mới",
    "trips.searchPlaceholder": "Tìm kiếm chuyến đi...",
    "trips.filterPlaceholder": "Lọc theo trạng thái",
    "trips.filterAll": "Tất cả chuyến đi",
    "trips.filterDraft": "Bản nháp",
    "trips.filterQueued": "Đang chờ",
    "trips.filterProcessing": "Đang xử lý",
    "trips.filterCompleted": "Đã hoàn thành",
    "trips.filterFailed": "Thất bại",
    "trips.filterGenerating": "Đang tạo",
    "trips.errorLoad": "Không thể tải danh sách chuyến đi",
    "trips.emptyFilter": "Không có chuyến đi nào phù hợp với bộ lọc",
    "trips.emptyAll": "Bạn chưa tạo chuyến đi nào",
    "trips.createFirst": "Tạo chuyến đi đầu tiên của bạn",
    "trips.defaultTitle": "Chuyến đi tới",

    // Map & Explore
    "explore.pageTitle": "Khám phá",
    "explore.pageSubtitle": "Khám phá những địa điểm trên khắp thế giới",
    "explore.tripMapTitle": "Bản đồ Chuyến đi",
    "explore.tripMapSubtitle": "Xem lịch trình của bạn trên bản đồ",
    "explore.mapUnavailable": "Bản đồ không khả dụng",
    "explore.mapError": "Không thể tải bản đồ. Vui lòng thử lại sau.",
    "explore.mapboxTokenError": "Mapbox token chưa được cấu hình",

    // General App
    "dashboard.title": "Bảng điều khiển",
    "dashboard.trips": "Chuyến đi của tôi",
    "dash.welcome": "Chào mừng trở lại!",
    "dash.subtitle": "Đây là những gì đang diễn ra với chuyến đi của bạn",
    "dash.planNew": "Lên Kế Hoạch Mới",
    "dash.totalTrips": "Tổng số chuyến đi",
    "dash.upcomingTrips": "Chuyến đi sắp tới",
    "dash.activeNow": "Đang hoạt động",
    "dash.recentTrips": "Chuyến đi gần đây",
    "dash.totalPlaces": "Tổng Điểm Đến",
    "dash.budgetSpent": "Tổng Chi Tiêu",
    "dash.avgTravelers": "Khách Trung Bình",
    "dash.viewAll": "Xem Tất Cả",
    "dash.noTrips": "Chưa có chuyến đi",
    "dash.startPlanning": "Bắt đầu chuyến phiêu lưu đầu tiên của bạn!",
    "dash.createTrip": "Tạo Chuyến Đi",

    // Sidebar
    "sidebar.dashboard": "Bảng điều khiển",
    "sidebar.myTrips": "Chuyến đi của tôi",
    "sidebar.explore": "Khám phá",
    "sidebar.ai": "Trợ lý AI",

    // Dropdown Menu
    "menu.account": "Tài khoản",
    "menu.myAccount": "Tài khoản của tôi",
    "menu.settings": "Cài đặt",
    "menu.signOut": "Đăng xuất",

    "trip.itinerary": "Lịch Trình",
    "trip.noItinerary": "Chưa có lịch trình",
    "trip.noItineraryDesc": "Dùng Trợ lý AI để tạo kế hoạch chuyến đi của bạn.",
    "trip.delete": "Xóa chuyến đi",
    "trip.deleteConfirmTitle": 'Xóa "{name}"?',
    "trip.deleteConfirmDesc":
      "Thao tác này sẽ xóa vĩnh viễn chuyến đi này và toàn bộ lịch trình. Không thể hoàn tác.",
    "trip.changeStatus": "Thay đổi trạng thái",
    "trip.lifecycle_upcoming": "Sắp đi",
    "trip.lifecycle_in_trip": "Đang đi",
    "trip.lifecycle_completed": "Hoàn thành",
    "trip.lifecycle_cancelled": "Đã hủy",
    "trip.lifecycle_failed": "Thất bại",
    // Trips page sort
    "trips.sortPlaceholder": "Sắp xếp",
    "trips.sortNewest": "Mới nhất",
    "trips.sortOldest": "Cũ nhất",
    "trips.sortAZ": "A \u2192 Z",
    "trips.sortZA": "Z \u2192 A",

    // Map View
    "map.viewOnMap": "Xem trên bản đồ",
    "map.day": "Ngày",
    "map.activities": "hoạt động",
    "map.noCoords": "Không có dữ liệu vị trí cho chuyến đi này",
    "map.noCoordsDesc":
      "Các địa điểm sẽ hiện ở đây sau khi lịch trình được tạo.",
    "map.flyToDay": "Nhảy đến Ngày",
  },
};

// Initialize from localStorage
const getInitialLanguage = (): Language => {
  try {
    const prefs = JSON.parse(localStorage.getItem("user-preferences") || "{}");
    if (
      prefs.language &&
      ["English (US)", "French", "Vietnamese"].includes(prefs.language)
    ) {
      return prefs.language as Language;
    }
  } catch (e) {
    // ignore
  }
  return "English (US)";
};

export const useTranslationStore = create<TranslationState>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => {
    set({ language: lang });
    // Also sync to localStorage
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      );
      localStorage.setItem(
        "user-preferences",
        JSON.stringify({ ...prefs, language: lang }),
      );
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }
  },
  t: (key: string) => {
    const lang = get().language;
    const dictionary = TRANSLATIONS[lang] || TRANSLATIONS["English (US)"];
    return dictionary[key] || TRANSLATIONS["English (US)"][key] || key;
  },
}));
