// frontend/app/lib/legalData.ts

export const COMPANY_INFO = {
    name: "WEISS SRL SOCIO UNICO",
    address: "Piazza del Popolo 15/B - 33077 Sacile (PN)",
    vat: "01723900930",
    phone: "0434 938459",
    email: "info@weisscafe.com",
    pec: "weiss.srl@pec.it"
};

export const PROMOTION_DETAILS = {
    title: "CAMPARI SODA INSTANT WIN - WEISS CAFE",
    startDate: "19/12/2025",
    endDate: "21/12/2025",
    drawDate: "Entro il 31/12/2025",
    totalValue: "450,00€ + IVA",
    onlus: "FONDAZIONE ABCD (O come designata)", 
};

export const PRIZES_LIST = [
    { name: "Maglie Campari Soda", qty: 22 },
    { name: "Calzini Campari Soda", qty: 40 },
    { name: "Cappellini Campari Soda", qty: 25 },
    { name: "Laccetti porta telefono Campari Soda", qty: 17 },
    { name: "Pocket mirror Campari Soda", qty: 23 },
    { name: "Cable protector Campari Soda", qty: 20 },
    { name: "Shopper Campari Soda", qty: 25 },
    { name: "Campari Soda (consumazione)", qty: 50 },
];

export const LEGAL_TEXTS = {
    privacy: `
### INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI
**Titolare:** ${COMPANY_INFO.name}, ${COMPANY_INFO.address}.
**Finalità:** Gestione concorso e, previo consenso, marketing.
**Conservazione:** 5 anni per obblighi di legge.
**Diritti:** Accesso/Cancellazione via email a ${COMPANY_INFO.email}.
    `,

    terms: `
### REGOLAMENTO SINTETICO
**Promotore:** ${COMPANY_INFO.name}
**Periodo:** ${PROMOTION_DETAILS.startDate} - ${PROMOTION_DETAILS.endDate}
**Montepremi:** ${PROMOTION_DETAILS.totalValue}
**Meccanica:** Acquisto prodotto -> Codice QR -> Instant Win.
**Premi non assegnati:** Devoluti alla ONLUS o secondo classifica riserve.
    `,

    cookie: `
### COOKIE POLICY
Usiamo solo cookie tecnici essenziali per il funzionamento del gioco.
    `
};