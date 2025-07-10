export const budgetCategories = [
  // RECETTES
  { code: "70011", label: "Droits d'inscription administrative", type: "recette" as const, description: "Droits d'inscription administrative" },
  { code: "70012", label: "Droits d'inscription pédagogique", type: "recette" as const, description: "Droits d'inscription pédagogique" },
  { code: "7002", label: "Droits d'examen", type: "recette" as const, description: "Droits d'examen" },
  { code: "7003", label: "Droits de bibliothèque", type: "recette" as const, description: "Droits de bibliothèque" },
  { code: "7065", label: "Produits des cessions de service", type: "recette" as const, description: "Produits des cessions de service : fonction de service" },
  { code: "70651", label: "Produits des cessions de service : Quote Part", type: "recette" as const, description: "Produits des cessions de service : Quote Part" },
  { code: "70652", label: "Produits des cessions de service : Instituts Rattachés", type: "recette" as const, description: "Produits des cessions de service : Instituts Rattachés" },
  { code: "7066", label: "Produits des entrées dans les musées", type: "recette" as const, description: "Produits des entrées dans les musées" },
  { code: "7067", label: "Produits de la vente des publications", type: "recette" as const, description: "Produits de la vente des publications" },
  { code: "7181", label: "Subventions accordées par l'État", type: "recette" as const, description: "Subventions d'exploitation accordées par l'État" },
  { code: "7583", label: "Produits du domaine immobilier", type: "recette" as const, description: "Produits du domaine immobilier" },
  { code: "75861", label: "Produits divers exceptionnels", type: "recette" as const, description: "Produits divers accidentels ou exceptionnels Rectorat et Instituts rattachés" },
  { code: "75862", label: "Report à nouveau Instituts Rattachés", type: "recette" as const, description: "Report à nouveau Instituts Rattachés" },
  { code: "75868", label: "Quote part du report Rectorat", type: "recette" as const, description: "Quote part du report Rectorat affecté au fonctionnement" },
  
  // DÉPENSES - Achats
  { code: "60411", label: "Consommables informatiques", type: "depense" as const, description: "Consommables informatiques" },
  { code: "60412", label: "Produits pharmaceutiques", type: "depense" as const, description: "Produits pharmaceutiques" },
  { code: "60413", label: "Produits de laboratoire", type: "depense" as const, description: "Produits de laboratoire" },
  { code: "6043", label: "Produits d'entretien", type: "depense" as const, description: "Produits d'entretien" },
  { code: "6047", label: "Fournitures de bureau", type: "depense" as const, description: "Fournitures de bureau" },
  { code: "60481", label: "Achats imprimés et cartes", type: "depense" as const, description: "Achats imprimés et cartes" },
  { code: "60511", label: "Eau", type: "depense" as const, description: "Fournitures non stockables - Eau" },
  { code: "60512", label: "Eau minérale et autres boissons", type: "depense" as const, description: "Eau minérale et autres boissons" },
  { code: "6052", label: "Électricité", type: "depense" as const, description: "Fournitures non stockables - Électricité" },
  { code: "60531", label: "Carburant", type: "depense" as const, description: "Carburant" },
  { code: "60532", label: "Lubrifiants", type: "depense" as const, description: "Lubrifiants" },
  { code: "6056", label: "Achat de petits matériels et outillages", type: "depense" as const, description: "Achat de petits matériels et outillages" },
  { code: "6057", label: "Achat d'études et de prestations de services", type: "depense" as const, description: "Achat d'études et de prestations de services" },
  { code: "6058", label: "Achats de travaux, matériels et équipements", type: "depense" as const, description: "Achats de travaux, matériels et équipements" },
  
  // DÉPENSES - Transports
  { code: "614", label: "Transports du Personnel", type: "depense" as const, description: "Transports du Personnel" },
  { code: "616", label: "Transport de plis", type: "depense" as const, description: "Transport de plis" },
  { code: "61811", label: "Voyages d'études", type: "depense" as const, description: "Voyages d'études" },
  { code: "61812", label: "Autres voyages et déplacements", type: "depense" as const, description: "Autres voyages et déplacements" },
  { code: "61813", label: "Voyages administratifs", type: "depense" as const, description: "Voyages administratifs" },
  { code: "6183", label: "Transports administratifs", type: "depense" as const, description: "Transports administratifs" },
  { code: "6184", label: "Participation aux frais de transport", type: "depense" as const, description: "Participation aux frais de transport" },
  
  // DÉPENSES - Services extérieurs
  { code: "622", label: "Location et Charges Locatives", type: "depense" as const, description: "Location et Charges Locatives" },
  { code: "62411", label: "Entretien bâtiments", type: "depense" as const, description: "Entretien, réparations et maintenance de bâtiments" },
  { code: "62412", label: "Entretien stade", type: "depense" as const, description: "Entretien, réparations et maintenance du stade" },
  { code: "62413", label: "Entretien campus", type: "depense" as const, description: "Entretien, réparations et maintenance du campus" },
  { code: "62421", label: "Entretien meubles", type: "depense" as const, description: "Entretien et réparation des meubles" },
  { code: "62422", label: "Entretien matériels de transport", type: "depense" as const, description: "Entretien et réparation des matériels de transport" },
  { code: "6243", label: "Maintenance", type: "depense" as const, description: "Maintenance" },
  { code: "6252", label: "Assurances matériels de transport", type: "depense" as const, description: "Assurances matériels de transport" },
  { code: "6258", label: "Autres primes d'assurance", type: "depense" as const, description: "Autres primes d'assurance" },
  { code: "6261", label: "Études et recherche", type: "depense" as const, description: "Études et recherche" },
  { code: "6265", label: "Documentation générale", type: "depense" as const, description: "Documentation générale" },
  { code: "6266", label: "Documentation technique", type: "depense" as const, description: "Documentation technique" },
  { code: "6271", label: "Annonces et insertions", type: "depense" as const, description: "Annonces et insertions" },
  { code: "6272", label: "Catalogues et imprimés publicitaires", type: "depense" as const, description: "Catalogues et imprimés publicitaires" },
  { code: "6275", label: "Publications", type: "depense" as const, description: "Publications" },
  { code: "6277", label: "Frais de colloques, séminaires, conférences", type: "depense" as const, description: "Frais de colloques, séminaires, conférences" },
  { code: "6281", label: "Frais de téléphone", type: "depense" as const, description: "Frais de téléphone" },
  { code: "6282", label: "Achats de cartes de téléphone", type: "depense" as const, description: "Achats de cartes de téléphone" },
  { code: "6283", label: "Frais de télécopie", type: "depense" as const, description: "Frais de télécopie" },
  { code: "6284", label: "Internet ADSL", type: "depense" as const, description: "Internet ADSL" },
  
  // DÉPENSES - Personnel
  { code: "66111", label: "Appointements, salaires et commissions PATS", type: "depense" as const, description: "Appointements, salaires et commissions versés aux PATS" },
  { code: "66112", label: "Appointements, salaires et commissions PER", type: "depense" as const, description: "Appointements, salaires et commissions versés aux PER" },
  { code: "66113", label: "Appointements contractuels", type: "depense" as const, description: "Appointements, salaires et commissions versés aux contractuels" },
  { code: "66171", label: "Habillement", type: "depense" as const, description: "Habillement" },
  { code: "661811", label: "Heures supplémentaires PATS", type: "depense" as const, description: "Heures supplémentaires PATS" },
  { code: "661812", label: "Heures complémentaires PER", type: "depense" as const, description: "Heures complémentaires PER" },
  { code: "6634", label: "Indemnités et primes PATS", type: "depense" as const, description: "Indemnités et primes diverses versées PATS" },
  { code: "6635", label: "Indemnités et primes PER", type: "depense" as const, description: "Indemnités et primes diverses PER" },
  { code: "66411", label: "Charges sociales PATS", type: "depense" as const, description: "Charges sociales et cotisations patronales PATS" },
  { code: "66412", label: "Charges sociales PER", type: "depense" as const, description: "Charges sociales et cotisations patronales PER" },
  { code: "6685", label: "Frais médicaux", type: "depense" as const, description: "Frais médicaux" },
  
  // INVESTISSEMENTS
  { code: "211", label: "Frais de recherche et de développement", type: "depense" as const, description: "Frais de recherche et de développement" },
  { code: "212", label: "Brevets, licences, concessions", type: "depense" as const, description: "Brevets, licences, concessions et droits similaires" },
  { code: "213", label: "Logiciels", type: "depense" as const, description: "Logiciels" },
  { code: "2313", label: "Bâtiments administratifs et commerciaux", type: "depense" as const, description: "Bâtiments administratifs et commerciaux" },
  { code: "2351", label: "Installations Générales", type: "depense" as const, description: "Installations Générales" },
  { code: "2352", label: "Installations des Bâtiments Administratifs", type: "depense" as const, description: "Installations des Bâtiments Administratifs" },
  { code: "2353", label: "Installations des Bâtiments Pédagogiques", type: "depense" as const, description: "Installations des Bâtiments Pédagogiques" },
  { code: "2441", label: "Matériel de bureau", type: "depense" as const, description: "Matériel de bureau" },
  { code: "2442", label: "Matériel informatique", type: "depense" as const, description: "Matériel informatique" },
  { code: "2443", label: "Matériel bureautique", type: "depense" as const, description: "Matériel bureautique" },
  { code: "2444", label: "Mobilier de bureau", type: "depense" as const, description: "Mobilier de bureau" },
  { code: "2447", label: "Matériel et Mobilier des logements", type: "depense" as const, description: "Matériel et Mobilier des logements du personnel" },
  { code: "2451", label: "Matériel automobile", type: "depense" as const, description: "Matériel automobile" },
  { code: "2458", label: "Autres matériels de transport", type: "depense" as const, description: "Autres matériels de transport (vélos, mobylettes, motos)" },
  { code: "2481", label: "Collections et œuvres d'art", type: "depense" as const, description: "Collections et œuvres d'art" },
  { code: "2482", label: "Matériels de cours et de TP", type: "depense" as const, description: "Matériels de cours et de TP" },
  { code: "2484", label: "Matériels et équipements spécifiques", type: "depense" as const, description: "Matériels et équipements spécifiques" },
];

export const getBudgetCategoryByCode = (code: string) => {
  return budgetCategories.find(cat => cat.code === code);
};

export const getBudgetCategoriesByType = (type: "recette" | "depense") => {
  return budgetCategories.filter(cat => cat.type === type);
};

export const getRecetteCategories = () => getBudgetCategoriesByType("recette");
export const getDepenseCategories = () => getBudgetCategoriesByType("depense");
